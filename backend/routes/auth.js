// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const LoginAudit = require('../models/LoginAudit');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authRateLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');
const { UnauthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');

const {
  generateSecret,
  verifyCode,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
} = require('../utils/totpUtils');

const {
  generateAccessToken,
  generateRefreshToken,
  generateTemp2FAToken,
  getRefreshTokenExpiresAt,
} = require('../utils/tokenUtils');

const { logAudit } = require('../utils/auditLogger');

const {
  loginSchema,
  twoFALoginSchema,
  verifySetupSchema,
  disable2FASchema,
} = require('../validationSchemas/authSchemas');

require('dotenv').config();

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

const formatUserResponse = async (user) => {
  let parentUsername = null;
  if (user.managedBy) {
    const parent = await User.findById(user.managedBy).select('username');
    if (parent) parentUsername = parent.username;
  }
  return {
    id: user._id ? user._id.toString() : user.id,
    username: user.username,
    role: user.role || 'viewer',
    totpEnabled: !!user.totpEnabled,
    managedBy: user.managedBy ? user.managedBy.toString() : null,
    parentUsername,
  };
};

// @route   POST api/auth/login
// @desc    Authenticate user & return access token or require 2FA
// @access  Public
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { username, password } = getValidated(req, 'body');
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      logAudit({
        userId: null,
        attemptedUsername: username,
        success: false,
        ip,
        userAgent,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logAudit({
        userId: user._id,
        attemptedUsername: username,
        success: false,
        ip,
        userAgent,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    // 3. If 2FA enabled, respond with require2FA and temporary 5-min token
    if (user.totpEnabled) {
      const tempToken = generateTemp2FAToken(user._id);
      return res.json({
        success: true,
        require2FA: true,
        tempToken,
      });
    }

    // 4. Issue standard tokens when 2FA is not enabled
    const token = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);

    await RefreshToken.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: getRefreshTokenExpiresAt(),
    });

    res.cookie('refreshToken', rawRefreshToken, getCookieOptions());

    logAudit({
      userId: user._id,
      attemptedUsername: username,
      success: true,
      ip,
      userAgent,
    });

    res.json({
      success: true,
      token,
      user: await formatUserResponse(user),
    });
  })
);

// @route   POST api/auth/login/2fa
// @desc    Verify TOTP or backup code with tempToken, issue final tokens
// @access  Public
router.post(
  '/login/2fa',
  authRateLimiter,
  validate({ body: twoFALoginSchema }),
  asyncHandler(async (req, res) => {
    const { tempToken, code, backupCode } = getValidated(req, 'body');
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 1. Verify temp 2FA token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired 2FA session. Please log in again.');
    }

    if (!decoded.user || !decoded.user.temp2FA) {
      throw new UnauthorizedError('Invalid 2FA session token');
    }

    const userId = decoded.user.id;
    const user = await User.findById(userId).select('+totpSecret +backupCodes');
    if (!user || !user.totpEnabled) {
      throw new UnauthorizedError('User not found or 2FA is not enabled');
    }

    // 2. Handle Backup Code Verification
    if (backupCode) {
      const cleanBackup = backupCode.trim().toUpperCase();
      let matchIndex = -1;

      for (let i = 0; i < (user.backupCodes || []).length; i++) {
        const isMatch = await bcrypt.compare(cleanBackup, user.backupCodes[i]);
        if (isMatch) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex === -1) {
        logAudit({
          userId: user._id,
          attemptedUsername: user.username,
          success: false,
          ip,
          userAgent,
        });
        throw new UnauthorizedError('Invalid backup code');
      }

      // Consume (remove) the used backup code
      user.backupCodes.splice(matchIndex, 1);
      await user.save();
    } else if (code) {
      // 3. Handle TOTP Code Verification
      const plainSecret = decryptSecret(user.totpSecret);
      const isTotpValid = verifyCode(plainSecret, code);

      if (!isTotpValid) {
        logAudit({
          userId: user._id,
          attemptedUsername: user.username,
          success: false,
          ip,
          userAgent,
        });
        throw new UnauthorizedError('Invalid two-factor authentication code');
      }
    }

    // 4. Verification successful: Issue access token + refresh token
    const token = generateAccessToken(user);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);

    await RefreshToken.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: getRefreshTokenExpiresAt(),
    });

    res.cookie('refreshToken', rawRefreshToken, getCookieOptions());

    logAudit({
      userId: user._id,
      attemptedUsername: user.username,
      success: true,
      ip,
      userAgent,
    });

    res.json({
      success: true,
      token,
      user: await formatUserResponse(user),
    });
  })
);

// @route   POST api/auth/refresh
// @desc    Read refresh token cookie, rotate token, issue new access token
// @access  Public (reads HTTP-only cookie)
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    // Find all unexpired refresh tokens
    const unexpiredTokens = await RefreshToken.find({
      expiresAt: { $gt: new Date() },
    });

    let matchedTokenRecord = null;
    for (const record of unexpiredTokens) {
      const isMatch = await bcrypt.compare(rawRefreshToken, record.token);
      if (isMatch) {
        matchedTokenRecord = record;
        break;
      }
    }

    // If not found or expired
    if (!matchedTokenRecord) {
      res.clearCookie('refreshToken', getCookieOptions());
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reuse detection: If token was already revoked, revoke ALL sessions for this user
    if (matchedTokenRecord.revoked) {
      await RefreshToken.updateMany(
        { userId: matchedTokenRecord.userId },
        { $set: { revoked: true } }
      );
      res.clearCookie('refreshToken', getCookieOptions());
      throw new UnauthorizedError('Security alert: Revoked refresh token reused. All sessions terminated.');
    }

    // Revoke old token
    matchedTokenRecord.revoked = true;
    await matchedTokenRecord.save();

    // Fetch user
    const user = await User.findById(matchedTokenRecord.userId);
    if (!user) {
      res.clearCookie('refreshToken', getCookieOptions());
      throw new UnauthorizedError('User no longer exists');
    }

    // Rotate: Issue new refresh token & access token
    const newAccessToken = generateAccessToken(user);
    const newRawRefreshToken = generateRefreshToken();
    const newHashed = await bcrypt.hash(newRawRefreshToken, 10);

    await RefreshToken.create({
      userId: user._id,
      token: newHashed,
      expiresAt: getRefreshTokenExpiresAt(),
    });

    res.cookie('refreshToken', newRawRefreshToken, getCookieOptions());

    res.json({
      success: true,
      token: newAccessToken,
      user: await formatUserResponse(user),
    });
  })
);

// @route   POST api/auth/logout
// @desc    Revoke refresh token & clear cookie
// @access  Private (auth)
router.post(
  '/logout',
  auth,
  asyncHandler(async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (rawRefreshToken) {
      const tokens = await RefreshToken.find({ userId: req.user.id, revoked: false });
      for (const rec of tokens) {
        const isMatch = await bcrypt.compare(rawRefreshToken, rec.token);
        if (isMatch) {
          rec.revoked = true;
          await rec.save();
          break;
        }
      }
    }

    res.clearCookie('refreshToken', getCookieOptions());
    res.json({ success: true, message: 'Logged out successfully' });
  })
);

// @route   GET api/auth/me
// @desc    Get current user profile & security status
// @access  Private (auth)
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      user: await formatUserResponse(user),
    });
  })
);

// @route   POST api/auth/2fa/setup
// @desc    Generate a new TOTP secret (base32)
// @access  Private (auth)
router.post(
  '/2fa/setup',
  auth,
  asyncHandler(async (req, res) => {
    const { secret, otpauth_url } = generateSecret();
    const formattedSecret = secret.match(/.{1,4}/g)?.join(' ') || secret;

    res.json({
      success: true,
      secret,
      formattedSecret,
      otpauth_url,
    });
  })
);

// @route   POST api/auth/2fa/verify-setup
// @desc    Verify TOTP code, encrypt secret, enable 2FA, return 10 backup codes
// @access  Private (auth)
router.post(
  '/2fa/verify-setup',
  auth,
  authRateLimiter,
  validate({ body: verifySetupSchema }),
  asyncHandler(async (req, res) => {
    const { secret, code } = getValidated(req, 'body');

    const isValid = verifyCode(secret, code);
    if (!isValid) {
      throw new BadRequestError('Invalid verification code. Please check your authenticator app and try again.');
    }

    const encryptedSecret = encryptSecret(secret);
    const { plain: plainBackupCodes, hashed: hashedBackupCodes } = await generateBackupCodes(10);

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.totpSecret = encryptedSecret;
    user.totpEnabled = true;
    user.backupCodes = hashedBackupCodes;
    await user.save();

    res.json({
      success: true,
      message: 'Two-factor authentication has been enabled successfully',
      backupCodes: plainBackupCodes,
    });
  })
);

// @route   POST api/auth/2fa/disable
// @desc    Disable 2FA with password or TOTP re-authentication
// @access  Private (auth)
router.post(
  '/2fa/disable',
  auth,
  validate({ body: disable2FASchema }),
  asyncHandler(async (req, res) => {
    const { password, code } = getValidated(req, 'body');

    const user = await User.findById(req.user.id).select('+password +totpSecret');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.totpEnabled) {
      throw new BadRequestError('2FA is already disabled');
    }

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid password');
      }
    } else if (code) {
      const plainSecret = decryptSecret(user.totpSecret);
      const isTotpValid = verifyCode(plainSecret, code);
      if (!isTotpValid) {
        throw new UnauthorizedError('Invalid two-factor authentication code');
      }
    }

    user.totpEnabled = false;
    user.totpSecret = undefined;
    user.backupCodes = [];
    await user.save();

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  })
);

// @route   GET api/auth/audit-logs
// @desc    Get paginated login audit logs for current user
// @access  Private (auth)
router.get(
  '/audit-logs',
  auth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    const [total, logs] = await Promise.all([
      LoginAudit.countDocuments(query),
      LoginAudit.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  })
);

module.exports = router;
