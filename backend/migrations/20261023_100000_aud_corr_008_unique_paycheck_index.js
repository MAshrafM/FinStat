// backend/migrations/20261023_100000_aud_corr_008_unique_paycheck_index.js
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

    const paychecksCollection = db.collection ? db.collection('paychecks') : mongoose.connection.collection('paychecks');

    // 1. Backfill missing or null disbursementType
    const backfillFilter = {
      $or: [
        { disbursementType: { $exists: false } },
        { disbursementType: null },
      ],
    };

    const backfillCount = await paychecksCollection.countDocuments(backfillFilter);
    console.log(`[MIGRATION] Found ${backfillCount} paychecks needing disbursementType backfill.`);

    if (!isDryRun && backfillCount > 0) {
      await paychecksCollection.updateMany(backfillFilter, {
        $set: { disbursementType: 'Regular' },
      });
      console.log(`[MIGRATION] Backfilled ${backfillCount} paychecks with disbursementType: 'Regular'.`);
    }

    // 2. Pre-flight dedup audit
    const duplicates = await paychecksCollection.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: { user: '$user', period: '$period', disbursementType: '$disbursementType' },
          count: { $sum: 1 },
          docs: { $push: { id: '$_id', createdAt: '$createdAt' } },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    console.log(`[MIGRATION] Found ${duplicates.length} duplicate groups.`);

    if (isDryRun) {
      console.log(`[MIGRATION DRY-RUN] Would dedup ${duplicates.length} duplicate groups and create partial unique index.`);
      return { dryRun: true, backfillCount, duplicateGroups: duplicates.length };
    }

    for (const group of duplicates) {
      group.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const [keep, ...superseded] = group.docs;
      for (const sup of superseded) {
        await paychecksCollection.updateOne(
          { _id: sup.id },
          {
            $set: {
              deletedAt: new Date(),
              notes: '[MIGRATION_AUD_CORR_008_DEDUP] Superseded duplicate',
            },
          }
        );
      }
    }

    // 3. Create unique partial compound index
    await paychecksCollection.createIndex(
      { user: 1, period: 1, disbursementType: 1 },
      {
        unique: true,
        partialFilterExpression: { deletedAt: null },
        name: 'idx_unique_user_period_disbursement',
      }
    );

    console.log('[MIGRATION] Created unique index idx_unique_user_period_disbursement successfully.');
    return { success: true, backfillCount, dedupedGroups: duplicates.length };
  },

  async down(db) {
    const paychecksCollection = db.collection ? db.collection('paychecks') : mongoose.connection.collection('paychecks');
    console.log('[MIGRATION ROLLBACK] Dropping unique index idx_unique_user_period_disbursement...');
    try {
      await paychecksCollection.dropIndex('idx_unique_user_period_disbursement');
      console.log('[MIGRATION ROLLBACK] Dropped index idx_unique_user_period_disbursement successfully.');
    } catch (err) {
      console.warn('[MIGRATION ROLLBACK] Warning: index may not exist:', err.message);
    }
  },
};
