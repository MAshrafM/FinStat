// backend/scripts/backfillCardTransactionCurrency.js
const mongoose = require('mongoose');

/**
 * Migration [MF-DEF-005-EXT]: Backfills CardTransaction records missing currency or exchangeRateSnapshot.
 * Legacy card transactions without currency or exchangeRateSnapshot are assigned:
 * currency = 'EGP', foreignAmount = null, exchangeRateSnapshot = 1.
 *
 * @param {import('mongodb').Db} [customDb] - Optional MongoDB database instance
 * @returns {Promise<{ updatedCount: number, skippedCount: number, totalCount: number, errorCount: number }>}
 */
async function backfillCardTransactionCurrency(customDb) {
  const db = customDb || mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const cardTransactionsCollection = db.collection('cardtransactions');

  const totalCount = await cardTransactionsCollection.countDocuments();
  const filter = {
    $or: [
      { currency: { $exists: false } },
      { exchangeRateSnapshot: { $exists: false } },
    ],
  };

  const toUpdateCount = await cardTransactionsCollection.countDocuments(filter);
  const skippedCount = totalCount - toUpdateCount;

  let updatedCount = 0;
  let errorCount = 0;

  try {
    const result = await cardTransactionsCollection.updateMany(
      filter,
      {
        $set: {
          currency: 'EGP',
          foreignAmount: null,
          exchangeRateSnapshot: 1,
        },
      }
    );
    updatedCount = result.modifiedCount;
  } catch (err) {
    errorCount++;
    console.error('Error during CardTransaction backfill:', err);
    throw err;
  }

  console.log('[MF-DEF-005-EXT] Card transaction currency backfill');
  console.log(`  Updated: ${updatedCount} (added currency='EGP', foreignAmount=null, exchangeRateSnapshot=1)`);
  console.log(`  Skipped: ${skippedCount} (all records had currency field)`);
  console.log(`  Errors: ${errorCount}`);

  return {
    updatedCount,
    skippedCount,
    totalCount,
    errorCount,
  };
}

if (require.main === module) {
  const connectDB = require('../config/db');
  (async () => {
    try {
      await connectDB();
      console.log('Connected to MongoDB. Running card transaction currency backfill...');
      const summary = await backfillCardTransactionCurrency();
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
  backfillCardTransactionCurrency,
};
