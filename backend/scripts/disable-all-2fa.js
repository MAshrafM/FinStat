// backend/scripts/disable-all-2fa.js
const mongoose = require('mongoose');
const User = require('../models/User');
const LoginAudit = require('../models/LoginAudit');

/**
 * Emergency utility to reset 2FA across all user accounts in response to ENCRYPTION_KEY compromise.
 *
 * @param {Object} options
 * @param {import('mongoose').Model} [options.UserModel] - User mongoose model
 * @param {import('mongoose').Model} [options.LoginAuditModel] - LoginAudit mongoose model
 * @param {boolean} [options.isDryRun=false] - Whether to simulate without making database mutations
 * @param {Console} [options.logger=console] - Logger instance
 * @returns {Promise<Object>} Reset execution metrics
 */
async function disableAll2FA({
  UserModel = User,
  LoginAuditModel = LoginAudit,
  isDryRun = false,
  logger = console,
} = {}) {
  logger.log(`Starting emergency 2FA reset procedure (Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE MUTATION'})...`);

  const stats = {
    totalScanned: 0,
    updated: 0,
    skippedAlreadyDisabled: 0,
    auditEntriesCreated: 0,
    errors: 0,
    isDryRun,
  };

  const users = await UserModel.find({});
  stats.totalScanned = users.length;

  for (const user of users) {
    const has2FAActive = user.totpEnabled === true || user.totpSecret !== null || (Array.isArray(user.backupCodes) && user.backupCodes.length > 0);

    if (!has2FAActive) {
      stats.skippedAlreadyDisabled++;
      continue;
    }

    if (isDryRun) {
      logger.log(`[DRY-RUN] Would reset 2FA for user: ${user.username || user.email || user._id}`);
      stats.updated++;
      continue;
    }

    try {
      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            totpEnabled: false,
            totpSecret: null,
            backupCodes: [],
          },
        }
      );

      stats.updated++;

      if (LoginAuditModel) {
        await LoginAuditModel.create({
          userId: user._id,
          attemptedUsername: user.username || user.email || 'unknown',
          success: true,
          ip: '127.0.0.1',
          userAgent: 'FinStat-CLI-disable-all-2fa',
          action: 'emergency_2fa_reset',
        });
        stats.auditEntriesCreated++;
      }
    } catch (err) {
      logger.error(`Error resetting 2FA for user ${user._id}:`, err);
      stats.errors++;
    }
  }

  logger.log(`Emergency 2FA reset completed. Summary: Updated: ${stats.updated}, Skipped (already disabled): ${stats.skippedAlreadyDisabled}, Errors: ${stats.errors}, Total Scanned: ${stats.totalScanned}`);
  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isConfirmed = args.includes('--confirm-emergency-reset');

  if (!isDryRun && !isConfirmed) {
    console.error('================================================================================');
    console.error('CRITICAL SAFETY GATE: Emergency 2FA reset mutates all user authentication state.');
    console.error('To preview changes without touching the database, run:');
    console.error('  node backend/scripts/disable-all-2fa.js --dry-run');
    console.error('To execute live emergency reset across all accounts, run:');
    console.error('  node backend/scripts/disable-all-2fa.js --confirm-emergency-reset');
    console.error('================================================================================');
    process.exit(1);
  }

  require('dotenv').config({ path: './.env' });
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/finstat';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  try {
    await disableAll2FA({ isDryRun, logger: console });
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error during emergency 2FA reset:', err);
    process.exit(1);
  });
}

module.exports = { disableAll2FA };
