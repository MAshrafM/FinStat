const mongoose = require('mongoose');
const Budget = require('../models/Budget');

/**
 * Deduplicate and normalize budget documents and ensure the compound partial unique index is created.
 *
 * @param {Object} options
 * @param {import('mongoose').Model} [options.BudgetModel] - Budget mongoose model
 * @param {Console} [options.logger] - Logger instance
 * @returns {Promise<Object>} Migration statistics
 */
async function runDedupeAndNormalize({ BudgetModel = Budget, logger = console } = {}) {
  logger.log('Starting budget deduplication and normalization migration...');
  const stats = {
    repairedYears: 0,
    softDeletedLegacy: 0,
    normalizedMonthly: 0,
    normalizedQuarterly: 0,
    normalizedYearly: 0,
    deduplicatedGroups: 0,
    softDeletedDuplicates: 0,
    indexCreated: false,
  };

  // Phase A: Audit and legacy data repair
  // 1. Repair string years to integers for active budgets
  const stringYearBudgets = await BudgetModel.find({
    deletedAt: null,
    year: { $type: 'string' },
  });
  for (const b of stringYearBudgets) {
    const num = parseInt(b.year, 10);
    if (!isNaN(num)) {
      await BudgetModel.updateOne({ _id: b._id }, { $set: { year: num } });
      stats.repairedYears++;
    }
  }

  // 2. Soft-delete active monthly budgets missing month
  const invalidMonthly = await BudgetModel.find({
    deletedAt: null,
    period: 'monthly',
    $or: [{ month: null }, { month: { $exists: false } }],
  });
  for (const doc of invalidMonthly) {
    await BudgetModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          deletedAt: new Date(),
          notes: (doc.notes ? doc.notes + '; ' : '') + 'Soft-deleted by migration: monthly budget missing required month field',
        },
      }
    );
    stats.softDeletedLegacy++;
  }

  // 3. Soft-delete active quarterly budgets missing quarter
  const invalidQuarterly = await BudgetModel.find({
    deletedAt: null,
    period: 'quarterly',
    $or: [{ quarter: null }, { quarter: { $exists: false } }],
  });
  for (const doc of invalidQuarterly) {
    await BudgetModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          deletedAt: new Date(),
          notes: (doc.notes ? doc.notes + '; ' : '') + 'Soft-deleted by migration: quarterly budget missing required quarter field',
        },
      }
    );
    stats.softDeletedLegacy++;
  }

  // 4. Soft-delete active budgets with invalid or missing period
  const invalidPeriod = await BudgetModel.find({
    deletedAt: null,
    period: { $nin: ['monthly', 'quarterly', 'yearly'] },
  });
  for (const doc of invalidPeriod) {
    await BudgetModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          deletedAt: new Date(),
          notes: (doc.notes ? doc.notes + '; ' : '') + 'Soft-deleted by migration: budget missing valid period',
        },
      }
    );
    stats.softDeletedLegacy++;
  }

  // Phase B: Field normalization for remaining active budgets
  // For monthly budgets: quarter must be null
  const normMonthlyRes = await BudgetModel.updateMany(
    { deletedAt: null, period: 'monthly', quarter: { $ne: null } },
    { $set: { quarter: null } }
  );
  stats.normalizedMonthly = normMonthlyRes.modifiedCount || 0;

  // For quarterly budgets: month must be null
  const normQuarterlyRes = await BudgetModel.updateMany(
    { deletedAt: null, period: 'quarterly', month: { $ne: null } },
    { $set: { month: null } }
  );
  stats.normalizedQuarterly = normQuarterlyRes.modifiedCount || 0;

  // For yearly budgets: month and quarter must be null
  const normYearlyRes = await BudgetModel.updateMany(
    {
      deletedAt: null,
      period: 'yearly',
      $or: [{ month: { $ne: null } }, { quarter: { $ne: null } }],
    },
    { $set: { month: null, quarter: null } }
  );
  stats.normalizedYearly = normYearlyRes.modifiedCount || 0;

  // Phase C: Deduplicate active budgets
  const duplicates = await BudgetModel.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: {
          user: '$user',
          category: '$category',
          period: '$period',
          year: '$year',
          month: '$month',
          quarter: '$quarter',
        },
        docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  stats.deduplicatedGroups = duplicates.length;

  for (const group of duplicates) {
    // Sort descending by _id (most recent first)
    const sorted = group.docs.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));
    const toKeep = sorted[0];
    const toDelete = sorted.slice(1);

    for (const item of toDelete) {
      const doc = await BudgetModel.findById(item._id);
      await BudgetModel.updateOne(
        { _id: item._id },
        {
          $set: {
            deletedAt: new Date(),
            notes: (doc?.notes ? doc.notes + '; ' : '') + 'Soft-deleted by migration: duplicate active budget',
          },
        }
      );
      stats.softDeletedDuplicates++;
    }
  }

  // Phase D: Index cleanup & creation
  const collection = BudgetModel.collection;
  const existingIndexes = await collection.indexes();

  // If any older compound index without partialFilterExpression exists, drop it
  for (const idx of existingIndexes) {
    const keys = Object.keys(idx.key || {});
    if (
      keys.includes('user') &&
      keys.includes('category') &&
      keys.includes('period') &&
      keys.includes('year') &&
      !idx.partialFilterExpression
    ) {
      logger.log(`Dropping legacy non-partial index: ${idx.name}`);
      await collection.dropIndex(idx.name);
    }
  }

  // Create partial unique index
  logger.log('Creating compound partial unique index on active budgets...');
  await collection.createIndex(
    { user: 1, category: 1, period: 1, year: 1, month: 1, quarter: 1 },
    {
      unique: true,
      partialFilterExpression: { deletedAt: null },
      name: 'user_1_category_1_period_1_year_1_month_1_quarter_1_unique_active',
    }
  );
  stats.indexCreated = true;

  logger.log('Migration completed successfully. Stats:', stats);
  return stats;
}

async function main() {
  require('dotenv').config({ path: './.env' });
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/finstat';
  await mongoose.connect(mongoUri);
  try {
    await runDedupeAndNormalize();
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { runDedupeAndNormalize };
