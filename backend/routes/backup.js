// backend/routes/backup.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const { BadRequestError, ForbiddenError } = require('../utils/errors');
const { buildEjsonBackup, buildXlsxBackup } = require('../utils/backupExporter');
const { importBackupBuffer } = require('../utils/backupImporter');
const { logAudit } = require('../utils/auditLogger');

// 15 MB in-memory buffer limit for EJSON payloads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

// @route   GET /api/admin/backup/status
// @desc    Returns availability of database restore in current environment
// @access  Private (Admin only)
router.get(
  '/status',
  auth,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const importAvailable = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
    res.json({
      success: true,
      importAvailable,
      environment: process.env.NODE_ENV || 'development',
    });
  })
);

// @route   GET /api/admin/backup/export
// @desc    Exports MongoDB collections to streaming EJSON or XLSX buffer
// @access  Private (Admin only)
router.get(
  '/export',
  auth,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const format = (req.query.format || 'json').toLowerCase();
    const userId = req.query.userId || null;
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      const buffer = await buildXlsxBackup(userId);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="finstat-backup-${dateStr}.xlsx"`
      );
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }

    // Default: EJSON JSON format (recommended for type-safe restore)
    const buffer = await buildEjsonBackup(userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finstat-backup-${dateStr}.json"`
    );
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  })
);

// @route   POST /api/admin/backup/import
// @desc    Dev-only database restore from uploaded EJSON backup file
// @access  Private (Admin only)
router.post(
  '/import',
  auth,
  authorize(['admin']),
  // 1. Production Hard Gate
  (req, res, next) => {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      return res.status(501).json({
        success: false,
        message:
          'Backup import is available in development only. Production database restores must be performed by the operations team using backend/_seeders/restore_db.js.',
      });
    }
    next();
  },
  // 2. CSRF Defense for destructive import
  (req, res, next) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (process.env.NODE_ENV !== 'production') {
      ['http://localhost:3000', 'http://127.0.0.1:3000'].forEach((devOrigin) => {
        if (!allowedOrigins.includes(devOrigin)) allowedOrigins.push(devOrigin);
      });
    }

    const origin = req.headers.origin;
    const isXmlHttpRequest = req.headers['x-requested-with'] === 'XMLHttpRequest';

    // Must have matching origin or XMLHttpRequest header
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin) && !isXmlHttpRequest) {
      return next(new ForbiddenError('Cross-origin import requests are blocked'));
    }
    next();
  },
  upload.single('backup'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError('No backup file uploaded');
    }

    const dryRun = req.query.dryRun === 'true';
    const allowUsers = req.query.allowUsers === 'true';

    const result = await importBackupBuffer(req.file.buffer, {
      dryRun,
      allowUsers,
      userId: req.user.id,
    });

    logAudit({
      userId: req.user.id,
      action: dryRun ? 'backup_import_dry_run' : 'backup_import_execute',
      success: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      ...result,
    });
  })
);

module.exports = router;
