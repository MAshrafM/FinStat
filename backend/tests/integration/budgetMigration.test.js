const mongoose = require('mongoose');
const testDb = require('../helpers/testDb');
const Budget = require('../../models/Budget');
const User = require('../../models/User');
const { runDedupeAndNormalize } = require('../../scripts/dedupeAndNormalizeBudgets');

describe('Step 4D.1: [AUD-CORR-004] Budget Migration & Deduplication Tests', () => {
  let testUser;

  beforeAll(async () => {
    await testDb.connect();
    testUser = await User.create({
      username: 'migration_user',
      name: 'Migration User',
      email: 'migration@test.com',
      password: 'password123',
    });
  });

  afterAll(async () => {
    await testDb.clearDatabase();
    await testDb.closeDatabase();
  });

  beforeEach(async () => {
    await Budget.deleteMany({});
  });

  test('deduplication keeps newest active budget by _id and soft-deletes older duplicates', async () => {
    // Insert two duplicate active monthly budgets directly into collection (bypassing model guards)
    const olderDoc = {
      user: testUser._id,
      category: 'Dining',
      period: 'monthly',
      year: 2025,
      month: 5,
      amount: 1000,
      notes: 'Older budget',
      deletedAt: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    };
    const newerDoc = {
      user: testUser._id,
      category: 'Dining',
      period: 'monthly',
      year: 2025,
      month: 5,
      amount: 1500,
      notes: 'Newer budget',
      deletedAt: null,
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
    };

    const inserted = await Budget.collection.insertMany([olderDoc, newerDoc]);
    const olderId = inserted.insertedIds[0];
    const newerId = inserted.insertedIds[1];

    const stats = await runDedupeAndNormalize({ BudgetModel: Budget, logger: { log: () => {} } });

    expect(stats.deduplicatedGroups).toBe(1);
    expect(stats.softDeletedDuplicates).toBe(1);

    const remainingActive = await Budget.find({ deletedAt: null });
    expect(remainingActive.length).toBe(1);
    expect(remainingActive[0]._id.toString()).toBe(newerId.toString());
    expect(remainingActive[0].amount).toBe(1500);

    const softDeleted = await Budget.findById(olderId);
    expect(softDeleted.deletedAt).toBeTruthy();
    expect(softDeleted.notes).toContain('Soft-deleted by migration: duplicate active budget');
  });

  test('field normalization sets appropriate nulls for monthly, quarterly, and yearly budgets', async () => {
    await Budget.collection.insertMany([
      {
        user: testUser._id,
        category: 'Groceries',
        period: 'monthly',
        year: 2025,
        month: 3,
        quarter: 1, // Invalid extra field
        amount: 3000,
        deletedAt: null,
      },
      {
        user: testUser._id,
        category: 'Insurance',
        period: 'quarterly',
        year: 2025,
        quarter: 2,
        month: 4, // Invalid extra field
        amount: 6000,
        deletedAt: null,
      },
      {
        user: testUser._id,
        category: 'Vacation',
        period: 'yearly',
        year: 2025,
        month: 12, // Invalid extra field
        quarter: 4, // Invalid extra field
        amount: 25000,
        deletedAt: null,
      },
    ]);

    const stats = await runDedupeAndNormalize({ BudgetModel: Budget, logger: { log: () => {} } });

    expect(stats.normalizedMonthly).toBe(1);
    expect(stats.normalizedQuarterly).toBe(1);
    expect(stats.normalizedYearly).toBe(1);

    const monthly = await Budget.findOne({ category: 'Groceries' });
    expect(monthly.quarter).toBeNull();
    expect(monthly.month).toBe(3);

    const quarterly = await Budget.findOne({ category: 'Insurance' });
    expect(quarterly.month).toBeNull();
    expect(quarterly.quarter).toBe(2);

    const yearly = await Budget.findOne({ category: 'Vacation' });
    expect(yearly.month).toBeNull();
    expect(yearly.quarter).toBeNull();
  });

  test('legacy repair repairs string years and soft-deletes invalid or incomplete budgets', async () => {
    await Budget.collection.insertMany([
      {
        user: testUser._id,
        category: 'Repaired Year',
        period: 'monthly',
        year: '2025', // String type
        month: 7,
        amount: 2000,
        deletedAt: null,
      },
      {
        user: testUser._id,
        category: 'Missing Month',
        period: 'monthly',
        year: 2025,
        // month is missing
        amount: 1000,
        deletedAt: null,
      },
      {
        user: testUser._id,
        category: 'Invalid Period',
        period: 'biweekly', // Invalid period
        year: 2025,
        amount: 1000,
        deletedAt: null,
      },
    ]);

    const stats = await runDedupeAndNormalize({ BudgetModel: Budget, logger: { log: () => {} } });

    expect(stats.repairedYears).toBe(1);
    expect(stats.softDeletedLegacy).toBe(2);

    const repaired = await Budget.findOne({ category: 'Repaired Year' });
    expect(typeof repaired.year).toBe('number');
    expect(repaired.year).toBe(2025);
    expect(repaired.deletedAt).toBeNull();

    const missingMonth = await Budget.findOne({ category: 'Missing Month' });
    expect(missingMonth.deletedAt).toBeTruthy();

    const invalidPeriod = await Budget.findOne({ category: 'Invalid Period' });
    expect(invalidPeriod.deletedAt).toBeTruthy();
  });

  test('migration is idempotent on second execution', async () => {
    await Budget.create({
      user: testUser._id,
      category: 'Utilities',
      period: 'monthly',
      year: 2025,
      month: 8,
      amount: 1200,
    });

    // Run first time
    const stats1 = await runDedupeAndNormalize({ BudgetModel: Budget, logger: { log: () => {} } });
    expect(stats1.indexCreated).toBe(true);

    // Run second time
    const stats2 = await runDedupeAndNormalize({ BudgetModel: Budget, logger: { log: () => {} } });
    expect(stats2.softDeletedDuplicates).toBe(0);
    expect(stats2.softDeletedLegacy).toBe(0);
    expect(stats2.normalizedMonthly).toBe(0);
    expect(stats2.normalizedQuarterly).toBe(0);
    expect(stats2.normalizedYearly).toBe(0);
    expect(stats2.repairedYears).toBe(0);
  });

  test('partial unique index is created and enforces uniqueness only on active records', async () => {
    await runDedupeAndNormalize({ BudgetModel: Budget, logger: { log: () => {} } });

    // Active record 1
    await Budget.collection.insertOne({
      user: testUser._id,
      category: 'Rent',
      period: 'monthly',
      year: 2025,
      month: 1,
      quarter: null,
      amount: 5000,
      deletedAt: null,
    });

    // Duplicate active record fails with E11000
    let duplicateError = null;
    try {
      await Budget.collection.insertOne({
        user: testUser._id,
        category: 'Rent',
        period: 'monthly',
        year: 2025,
        month: 1,
        quarter: null,
        amount: 5500,
        deletedAt: null,
      });
    } catch (err) {
      duplicateError = err;
    }
    expect(duplicateError).toBeTruthy();
    expect(duplicateError.code).toBe(11000);

    // Multiple soft-deleted records with identical keys are allowed to coexist
    const softDeletedTimestamp = new Date();
    await Budget.collection.insertOne({
      user: testUser._id,
      category: 'Rent',
      period: 'monthly',
      year: 2025,
      month: 1,
      quarter: null,
      amount: 4000,
      deletedAt: softDeletedTimestamp,
    });

    await Budget.collection.insertOne({
      user: testUser._id,
      category: 'Rent',
      period: 'monthly',
      year: 2025,
      month: 1,
      quarter: null,
      amount: 4200,
      deletedAt: softDeletedTimestamp,
    });

    const softDeletedCount = await Budget.countDocuments({
      category: 'Rent',
      deletedAt: { $ne: null },
    });
    expect(softDeletedCount).toBe(2);
  });
});
