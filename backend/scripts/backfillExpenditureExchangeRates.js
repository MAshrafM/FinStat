// backend/scripts/backfillExpenditureExchangeRates.js
const mongoose = require('mongoose');

/**
 * Migration: Backfills legacy expenditures with currency, exchangeRateSnapshot, and foreignAmount defaults.
 * Legacy expenditures without currency explicitly set are assigned 'EGP', exchangeRateSnapshot = 1, foreignAmount = null.
 *
 * @param {import('mongodb').Db} [customDb] - Optional MongoDB database instance
 * @returns {Promise<{ updatedCount: number, skippedCount: number, totalCount: number, forexSnapshotsAvailable: number }>}
 */
async function backfillExpenditureExchangeRates(customDb) {
  const db = customDb || mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const expendituresCollection = db.collection('expenditures');
  const forexCollection = db.collection('forexratehistories');

  const forexSnapshotsAvailable = await forexCollection.countDocuments();
  console.log(`[MF-DEF-005 Migration] Forex snapshots in database: ${forexSnapshotsAvailable}`);

  const expenditures = await expendituresCollection.find({
    deletedAt: null,
  }).toArray();

  let updatedCount = 0;
  let skippedCount = 0;
  const totalCount = expenditures.length;
  const bulkOps = [];

  for (const exp of expenditures) {
    const hasCurrency = exp.currency && typeof exp.currency === 'string';
    const hasRate = exp.exchangeRateSnapshot !== undefined && exp.exchangeRateSnapshot !== null;

    if (!hasCurrency || !hasRate) {
      const updates = {};
      if (!hasCurrency) {
        updates.currency = 'EGP';
        updates.foreignAmount = null;
      }
      if (!hasRate) {
        updates.exchangeRateSnapshot = 1;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: exp._id },
          update: { $set: updates },
        },
      });
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  if (bulkOps.length > 0) {
    await expendituresCollection.bulkWrite(bulkOps);
  }

  const summary = {
    updatedCount,
    skippedCount,
    totalCount,
    forexSnapshotsAvailable,
  };

  console.log('[MF-DEF-005 Migration] Expenditure Exchange Rate Backfill Complete:');
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped (Already configured): ${skippedCount}`);
  console.log(`  Total Evaluated: ${totalCount}`);

  return summary;
}

// Standalone execution support
if (require.main === module) {
  const connectDB = require('../config/db');
  (async () => {
    try {
      await connectDB();
      console.log('Connected to MongoDB. Running expenditure exchange rate backfill...');
      const summary = await backfillExpenditureExchangeRates();
      console.log('Migration finished successfully.', summary);
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  backfillExpenditureExchangeRates,
};
