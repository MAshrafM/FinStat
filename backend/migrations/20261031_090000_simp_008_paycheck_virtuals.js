// backend/migrations/20261031_090000_simp_008_paycheck_virtuals.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = {
  async up(db) {
    const isDryRun = process.argv.includes('--dry-run');
    const paychecksCollection = db && db.collection ? db.collection('paychecks') : mongoose.connection.collection('paychecks');

    console.log('[MIGRATION:UP] Starting Paycheck virtuals canonicalization backfill...');

    const cursor = paychecksCollection.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      if (doc.period === undefined && doc.month !== undefined) {
        updates.period = doc.month;
      }
      if (doc.payDate === undefined && doc.date !== undefined) {
        updates.payDate = doc.date;
      }
      if (doc.netPay === undefined && doc.amount !== undefined) {
        updates.netPay = doc.amount;
      }
      if (doc.netPayInPiastres === undefined) {
        if (doc.amountInPiastres !== undefined) {
          updates.netPayInPiastres = doc.amountInPiastres;
        } else if (doc.netPay !== undefined || doc.amount !== undefined) {
          updates.netPayInPiastres = Math.round((doc.netPay !== undefined ? doc.netPay : doc.amount) * 100);
        }
      }
      if (doc.grossSalary === undefined && doc.grossAmount !== undefined) {
        updates.grossSalary = doc.grossAmount;
      }
      if (doc.grossSalaryInPiastres === undefined) {
        if (doc.grossAmountInPiastres !== undefined) {
          updates.grossSalaryInPiastres = doc.grossAmountInPiastres;
        } else if (doc.grossSalary !== undefined || doc.grossAmount !== undefined) {
          updates.grossSalaryInPiastres = Math.round((doc.grossSalary !== undefined ? doc.grossSalary : doc.grossAmount) * 100);
        }
      }
      if (doc.insuranceDetails === undefined || doc.insuranceDetails?.actualEmployeeShare === undefined) {
        if (doc.insuranceDeduction !== undefined) {
          updates['insuranceDetails.actualEmployeeShare'] = doc.insuranceDeduction;
          if (doc.insuranceDetails?.expectedEmployeeShare === undefined) {
            updates['insuranceDetails.expectedEmployeeShare'] = doc.insuranceDeduction;
          }
        }
      }
      if (doc.taxDetails === undefined || doc.taxDetails?.actualTax === undefined) {
        if (doc.taxDeduction !== undefined) {
          updates['taxDetails.actualTax'] = doc.taxDeduction;
          if (doc.taxDetails?.expectedTax === undefined) {
            updates['taxDetails.expectedTax'] = doc.taxDeduction;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        count++;
        if (!isDryRun) {
          bulkOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: updates },
            },
          });
        }
      }

      if (bulkOps.length >= 1000) {
        await paychecksCollection.bulkWrite(bulkOps);
        bulkOps.length = 0;
      }
    }

    if (bulkOps.length > 0 && !isDryRun) {
      await paychecksCollection.bulkWrite(bulkOps);
    }

    // Drop legacy index if present
    if (!isDryRun) {
      try {
        await paychecksCollection.dropIndex('user_1_month_-1');
        console.log('[MIGRATION:UP] Dropped legacy index user_1_month_-1.');
      } catch (err) {
        // Suppress error if index does not exist
      }
    }

    console.log(`[MIGRATION:UP] Completed. Backfilled ${count} records. (DryRun: ${isDryRun})`);
    return { success: true, backfilledCount: count, dryRun: isDryRun };
  },

  async down(db) {
    const isDryRun = process.argv.includes('--dry-run');
    const paychecksCollection = db && db.collection ? db.collection('paychecks') : mongoose.connection.collection('paychecks');

    console.log('[MIGRATION:DOWN] Restoring all 10 legacy physical fields on Paycheck records...');

    const cursor = paychecksCollection.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      if (doc.month === undefined && doc.period !== undefined) updates.month = doc.period;
      if (doc.date === undefined && doc.payDate !== undefined) updates.date = doc.payDate;
      if (doc.amount === undefined && doc.netPay !== undefined) updates.amount = doc.netPay;
      if (doc.amountInPiastres === undefined) {
        updates.amountInPiastres = doc.netPayInPiastres !== undefined ? doc.netPayInPiastres : Math.round((doc.netPay || 0) * 100);
      }
      if (doc.grossAmount === undefined && doc.grossSalary !== undefined) updates.grossAmount = doc.grossSalary;
      if (doc.grossAmountInPiastres === undefined) {
        updates.grossAmountInPiastres = doc.grossSalaryInPiastres !== undefined ? doc.grossSalaryInPiastres : Math.round((doc.grossSalary || 0) * 100);
      }
      if (doc.insuranceDeduction === undefined) {
        updates.insuranceDeduction = doc.insuranceDetails?.actualEmployeeShare || 0;
      }
      if (doc.insuranceDeductionInPiastres === undefined) {
        updates.insuranceDeductionInPiastres = Math.round((doc.insuranceDetails?.actualEmployeeShare || 0) * 100);
      }
      if (doc.taxDeduction === undefined) {
        updates.taxDeduction = doc.taxDetails?.actualTax || 0;
      }
      if (doc.taxDeductionInPiastres === undefined) {
        updates.taxDeductionInPiastres = Math.round((doc.taxDetails?.actualTax || 0) * 100);
      }

      if (Object.keys(updates).length > 0) {
        count++;
        if (!isDryRun) {
          bulkOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: updates },
            },
          });
        }
      }

      if (bulkOps.length >= 1000) {
        await paychecksCollection.bulkWrite(bulkOps);
        bulkOps.length = 0;
      }
    }

    if (bulkOps.length > 0 && !isDryRun) {
      await paychecksCollection.bulkWrite(bulkOps);
    }

    if (!isDryRun) {
      try {
        await paychecksCollection.createIndex({ user: 1, month: -1 });
        console.log('[MIGRATION:DOWN] Restored index user_1_month_-1.');
      } catch (err) {
        console.warn('[MIGRATION:DOWN] Warning creating index:', err.message);
      }
    }

    console.log(`[MIGRATION:DOWN] Completed. Restored legacy fields on ${count} records. (DryRun: ${isDryRun})`);
    return { success: true, restoredCount: count, dryRun: isDryRun };
  },
};

