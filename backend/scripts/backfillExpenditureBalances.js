// backend/scripts/backfillExpenditureBalances.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Expenditure = require('../models/Expenditure');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Backfill...');
  } catch (err) {
    console.error(`Error connecting to DB: ${err.message}`);
    process.exit(1);
  }
};

const backfillExpenditureBalances = async () => {
  await connectDB();

  try {
    console.log('Starting Expenditure running balances backfill...');

    // Get all distinct users with expenditures
    const userIds = await Expenditure.distinct('user');
    console.log(`Found ${userIds.length} distinct user(s).`);

    let totalUpdated = 0;

    for (const userId of userIds) {
      console.log(`Processing expenditures for user: ${userId}...`);

      const docs = await Expenditure.find({ user: userId }).sort({ date: 1, _id: 1 });
      console.log(`Found ${docs.length} expenditures for user ${userId}.`);

      if (docs.length === 0) continue;

      const bulkOps = [];

      for (const doc of docs) {
        // Ensure runningBalances matches document bank/cash/prepaid snapshots
        const bank = typeof doc.bank === 'number' ? doc.bank : (doc.runningBalances?.bank || 0);
        const cash = typeof doc.cash === 'number' ? doc.cash : (doc.runningBalances?.cash || 0);
        const prepaid = typeof doc.prepaid === 'number' ? doc.prepaid : (doc.runningBalances?.prepaid || 0);

        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                runningBalances: {
                  bank,
                  cash,
                  prepaid,
                },
                bank,
                cash,
                prepaid,
              },
            },
          },
        });
      }

      if (bulkOps.length > 0) {
        // Execute bulk in chunks of 500
        const chunkSize = 500;
        for (let i = 0; i < bulkOps.length; i += chunkSize) {
          const chunk = bulkOps.slice(i, i + chunkSize);
          const result = await Expenditure.bulkWrite(chunk);
          totalUpdated += (result.modifiedCount || result.matchedCount || 0);
        }
      }
    }

    console.log(`✅ Backfill completed successfully! Total records updated/processed: ${totalUpdated}`);
  } catch (error) {
    console.error('Backfill migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

if (require.main === module) {
  backfillExpenditureBalances();
}

module.exports = backfillExpenditureBalances;
