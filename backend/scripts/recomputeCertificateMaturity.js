// backend/scripts/recomputeCertificateMaturity.js
const mongoose = require('mongoose');
const { addMonthsClamped } = require('../utils/interestAccrual');

/**
 * Migration: Recomputes maturityDate for certificates that were derived with naive setMonth arithmetic
 * while strictly preserving manual user-supplied maturity dates.
 *
 * @param {import('mongodb').Db} [customDb] - Optional MongoDB database instance for testing
 * @returns {Promise<{ updatedCount: number, skippedManualCount: number, skippedAlreadyCorrectCount: number, totalCount: number }>}
 */
async function recomputeCertificateMaturity(customDb) {
  const db = customDb || mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const certificatesCollection = db.collection('certificates');
  const certificates = await certificatesCollection.find({
    deletedAt: null,
    startDate: { $exists: true, $ne: null },
    period: { $exists: true, $ne: null },
  }).toArray();

  let updatedCount = 0;
  let skippedManualCount = 0;
  let skippedAlreadyCorrectCount = 0;
  const totalCount = certificates.length;

  for (const cert of certificates) {
    const periodNum = Number(cert.period);
    if (!Number.isFinite(periodNum) || periodNum <= 0) {
      continue;
    }

    const correctMaturity = addMonthsClamped(cert.startDate, periodNum);

    // 1. Explicitly derived or confirmed server-computed
    if (cert.maturityDateDerived === true) {
      if (!cert.maturityDate || new Date(cert.maturityDate).getTime() !== correctMaturity.getTime()) {
        await certificatesCollection.updateOne(
          { _id: cert._id },
          { $set: { maturityDate: correctMaturity, maturityDateDerived: true } }
        );
        updatedCount++;
      } else {
        skippedAlreadyCorrectCount++;
      }
      continue;
    }

    // 2. Explicitly user-entered manual maturity date
    if (cert.maturityDateDerived === false) {
      skippedManualCount++;
      continue;
    }

    // 3. Legacy record (maturityDateDerived is undefined)
    if (cert.maturityDateDerived === undefined || cert.maturityDateDerived === null) {
      if (!cert.maturityDate) {
        // Never had maturityDate set -> compute it
        await certificatesCollection.updateOne(
          { _id: cert._id },
          { $set: { maturityDate: correctMaturity, maturityDateDerived: true } }
        );
        updatedCount++;
        continue;
      }

      const storedMaturity = new Date(cert.maturityDate);
      const buggyMaturity = new Date(cert.startDate);
      buggyMaturity.setMonth(buggyMaturity.getMonth() + periodNum);

      if (storedMaturity.getTime() === buggyMaturity.getTime()) {
        // Derived using unpatched month overflow logic -> correct it
        await certificatesCollection.updateOne(
          { _id: cert._id },
          { $set: { maturityDate: correctMaturity, maturityDateDerived: true } }
        );
        updatedCount++;
      } else {
        // Manually entered -> preserve manual date
        await certificatesCollection.updateOne(
          { _id: cert._id },
          { $set: { maturityDateDerived: false } }
        );
        skippedManualCount++;
      }
    }
  }

  const summary = {
    updatedCount,
    skippedManualCount,
    skippedAlreadyCorrectCount,
    totalCount,
  };

  console.log('[AUD-CORR-003 Migration] Certificate Maturity Recomputation Complete:');
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped (Manual user date preserved): ${skippedManualCount}`);
  console.log(`  Skipped (Already correct): ${skippedAlreadyCorrectCount}`);
  console.log(`  Total Evaluated: ${totalCount}`);

  return summary;
}

if (require.main === module) {
  const connectDB = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await recomputeCertificateMaturity();
      await mongoose.connection.close();
      process.exit(0);
    } catch (err) {
      console.error('[AUD-CORR-003 Migration FATAL]', err);
      process.exit(1);
    }
  })();
}

module.exports = { recomputeCertificateMaturity };
