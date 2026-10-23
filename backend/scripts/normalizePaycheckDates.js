// backend/scripts/normalizePaycheckDates.js
const mongoose = require('mongoose');

/**
 * Normalizes a date input to UTC midday (12:00:00.000Z).
 */
function normalizeToUtcMidday(dateInput) {
  if (!dateInput) return new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00.000Z`);
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return new Date(`${dateInput.slice(0, 10)}T12:00:00.000Z`);
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(`${d.toISOString().slice(0, 10)}T12:00:00.000Z`);
}

/**
 * Helper to extract year from period or date
 */
function extractYear(period, fallbackYear) {
  if (fallbackYear && !isNaN(Number(fallbackYear))) {
    return Number(fallbackYear);
  }
  if (typeof period === 'string') {
    const match = period.match(/\b(20\d{2}|19\d{2})\b/);
    if (match) return Number(match[1]);
  }
  return new Date().getFullYear();
}

/**
 * Recalculates priorYtdGross and cumulativeYtdGross chronologically for all active paychecks in a year
 * directly using the MongoDB collection for reliability and speed.
 */
async function recalculateYearlyPaychecksChain(paychecksCollection, userId, year) {
  const yearStr = String(year);
  const startOfYear = new Date(`${yearStr}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${yearStr}-12-31T23:59:59.999Z`);

  const paychecks = await paychecksCollection.find({
    user: userId,
    deletedAt: null,
    $or: [
      { period: { $regex: `^${yearStr}`, $options: 'i' } },
      { month: { $regex: `^${yearStr}`, $options: 'i' } },
      { payDate: { $gte: startOfYear, $lte: endOfYear } },
      { date: { $gte: startOfYear, $lte: endOfYear } },
    ],
  }).sort({ payDate: 1, createdAt: 1 }).toArray();

  let runningYtd = 0;
  const chainOps = [];
  for (const pc of paychecks) {
    const gross = Number(pc.grossSalary !== undefined && pc.grossSalary !== null ? pc.grossSalary : (pc.grossAmount || 0));
    const priorYtdGross = runningYtd;
    const cumulativeYtdGross = priorYtdGross + gross;
    runningYtd = cumulativeYtdGross;

    if (pc.priorYtdGross !== priorYtdGross || pc.cumulativeYtdGross !== cumulativeYtdGross) {
      chainOps.push({
        updateOne: {
          filter: { _id: pc._id },
          update: { $set: { priorYtdGross, cumulativeYtdGross } },
        },
      });
    }
  }

  if (chainOps.length > 0) {
    await paychecksCollection.bulkWrite(chainOps);
  }
}

/**
 * Migration: Normalizes all legacy paycheck dates to UTC midday (12:00:00.000Z)
 * and cascades YTD recalculation across affected calendar years.
 *
 * @param {import('mongodb').Db} [customDb] - Optional MongoDB database instance
 * @returns {Promise<{ updatedCount: number, skippedCount: number, totalCount: number, chainsRecalculated: number }>}
 */
async function normalizePaycheckDates(customDb) {
  const db = customDb || mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const paychecksCollection = db.collection('paychecks');
  const paychecks = await paychecksCollection.find({
    deletedAt: null,
  }).toArray();

  let updatedCount = 0;
  let skippedCount = 0;
  const totalCount = paychecks.length;
  const affectedChains = new Map(); // key: `${userId}:${year}`, value: { userId, year }
  const bulkOps = [];

  for (const pc of paychecks) {
    const originalPayDate = pc.payDate ? new Date(pc.payDate) : (pc.date ? new Date(pc.date) : new Date());
    const normalized = normalizeToUtcMidday(originalPayDate);
    if (!normalized) {
      skippedCount++;
      continue;
    }

    const needsDateUpdate =
      !pc.payDate ||
      !pc.date ||
      new Date(pc.payDate).getTime() !== normalized.getTime() ||
      new Date(pc.date).getTime() !== normalized.getTime();

    if (needsDateUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: pc._id },
          update: { $set: { payDate: normalized, date: normalized } },
        },
      });
      updatedCount++;

      if (pc.user) {
        const year = extractYear(pc.period || pc.month, normalized.getUTCFullYear());
        const chainKey = `${pc.user.toString()}:${year}`;
        if (!affectedChains.has(chainKey)) {
          affectedChains.set(chainKey, { userId: pc.user, year });
        }
      }
    } else {
      skippedCount++;
    }
  }

  if (bulkOps.length > 0) {
    await paychecksCollection.bulkWrite(bulkOps);
  }

  // Recalculate chains for affected user-year combinations
  let chainsRecalculated = 0;
  for (const { userId, year } of affectedChains.values()) {
    await recalculateYearlyPaychecksChain(paychecksCollection, userId, year);
    chainsRecalculated++;
  }

  const summary = {
    updatedCount,
    skippedCount,
    totalCount,
    chainsRecalculated,
  };

  console.log('[MF-DEF-004 Migration] Paycheck UTC Midday Normalization Complete:');
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped (Already normalized / invalid): ${skippedCount}`);
  console.log(`  Total: ${totalCount}`);
  console.log(`  YTD Chains Recalculated: ${chainsRecalculated}`);

  return summary;
}

// Standalone execution support
if (require.main === module) {
  const connectDB = require('../config/db');
  (async () => {
    try {
      await connectDB();
      console.log('Connected to MongoDB. Running paycheck date normalization...');
      const summary = await normalizePaycheckDates();
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
  normalizePaycheckDates,
  normalizeToUtcMidday,
};
