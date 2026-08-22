// backend/validationSchemas/authSchemas.js
const { z } = require('zod');

/**
 * Schema for user login (Step 1)
 */
const loginSchema = z.object({
  username: z
    .string({ message: 'Username is required' })
    .trim()
    .min(1, 'Username cannot be empty'),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password cannot be empty'),
}).strict();

/**
 * Schema for 2FA login verification (Step 2)
 */
const twoFALoginSchema = z.object({
  tempToken: z
    .string({ message: 'Temporary 2FA token is required' })
    .min(1, 'Temporary 2FA token is required'),
  code: z
    .string()
    .trim()
    .optional(),
  backupCode: z
    .string()
    .trim()
    .optional(),
}).strict().refine((data) => !!(data.code || data.backupCode), {
  message: 'Either a 6-digit TOTP code or an 8-character backup code must be provided',
  path: ['code'],
});

/**
 * Schema for verifying and enabling 2FA setup
 */
const verifySetupSchema = z.object({
  secret: z
    .string({ message: 'Secret is required' })
    .trim()
    .min(1, 'Secret is required'),
  code: z
    .string({ message: 'Verification code is required' })
    .trim()
    .min(6, 'Verification code must be at least 6 digits'),
}).strict();

/**
 * Schema for disabling 2FA
 */
const disable2FASchema = z.object({
  password: z
    .string()
    .optional(),
  code: z
    .string()
    .trim()
    .optional(),
}).strict().refine((data) => !!(data.password || data.code), {
  message: 'Password or current TOTP code is required to disable 2FA',
  path: ['password'],
});

module.exports = {
  createSchema: loginSchema,
  loginSchema,
  twoFALoginSchema,
  verifySetupSchema,
  disable2FASchema,
};
