// backend/migrations/20261025_120000_add_appliedDynamically_flag.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = {
  async up(db) {
    const isDryRun = process.argv.includes('--dry-run');
    const isForce = process.argv.includes('--force');

    if (isForce && (process.env.NODE_ENV === 'production' || process.env.VERCEL)) {
      throw new Error('[MIGRATION] --force is strictly prohibited in production and Vercel environments.');
    }

    const corpCollection = db.collection ? db.collection('corporateactions') : db;
    const tradesCollection = db.collection ? db.collection('trades') : mongoose.connection.collection('trades');

    const filter = isForce ? {} : { appliedDynamically: { $exists: false } };
    const legacyActions = await corpCollection.find(filter).toArray();

    console.log(`[MIGRATION] Found ${legacyActions.length} corporate action records matching filter.`);

    for (const action of legacyActions) {
      let tradeCount = 0;
      if (tradesCollection) {
        tradeCount = await tradesCollection.countDocuments({
          user: action.user,
          stockCode: action.stockCode,
          date: { $lt: action.effectiveDate },
          deletedAt: null,
        });
      }

      if (tradeCount > 0) {
        console.warn(
          `[MIGRATION REVIEW] CorporateAction ${action._id} (${action.stockCode}) ` +
          `has ${tradeCount} pre-split trades. Verify manually whether the split was applied destructively. ` +
          `If destructive split was applied, leave appliedDynamically: false. If not, set appliedDynamically: true and manually adjust trades.`
        );
      }
    }

    if (isDryRun) {
      console.log(`[MIGRATION DRY-RUN] Would update ${legacyActions.length} corporate actions to { appliedDynamically: false }. No changes committed.`);
      return { modifiedCount: 0, dryRun: true, count: legacyActions.length };
    }

    const result = await corpCollection.updateMany(filter, {
      $set: { appliedDynamically: false },
    });

    console.log(`[MIGRATION] Successfully updated ${result.modifiedCount || 0} corporate actions with appliedDynamically: false.`);
    return result;
  },

  async down(db) {
    const corpCollection = db.collection ? db.collection('corporateactions') : db;
    console.log('[MIGRATION ROLLBACK] Removing appliedDynamically field from corporate actions...');
    const result = await corpCollection.updateMany({}, {
      $unset: { appliedDynamically: '' },
    });
    console.log(`[MIGRATION ROLLBACK] Successfully unset appliedDynamically on ${result.modifiedCount || 0} documents.`);
    return result;
  },
};

// Standalone execution support
if (require.main === module) {
  (async () => {
    try {
      const command = process.argv[2] === 'down' ? 'down' : 'up';
      console.log(`Connecting to database for migration (${command})...`);
      await mongoose.connect(process.env.MONGO_URI);
      const db = mongoose.connection.db;

      if (command === 'down') {
        await module.exports.down(db);
      } else {
        await module.exports.up(db);
      }

      console.log(`Migration ${command} finished.`);
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  })();
}
