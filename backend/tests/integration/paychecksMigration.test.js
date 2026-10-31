// backend/tests/integration/paychecksMigration.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const migration = require('../../migrations/20261031_090000_simp_008_paycheck_virtuals');

jest.setTimeout(60000);

describe('Step 6B.1: [SIMP-008, AUD-ARCH-003] Paycheck Virtuals Migration Tests', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('1. _up backfills canonical fields on legacy records and runs idempotently', async () => {
    const paychecksCollection = mongoose.connection.collection('paychecks');
    const legacyDocId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    // Insert pre-migration document into raw collection (missing canonical fields)
    await paychecksCollection.insertOne({
      _id: legacyDocId,
      user: userId,
      month: '2024-03',
      date: new Date('2024-03-15T12:00:00.000Z'),
      amount: 8000,
      grossAmount: 10000,
      insuranceDeduction: 880,
      taxDeduction: 1120,
      disbursementType: 'Regular',
      deletedAt: null,
      createdAt: new Date('2024-03-15T12:00:00.000Z'),
      updatedAt: new Date('2024-03-15T12:00:00.000Z'),
    });

    // Execute migration up
    const res1 = await migration.up(mongoose.connection);
    expect(res1.success).toBe(true);

    const migratedDoc = await paychecksCollection.findOne({ _id: legacyDocId });
    expect(migratedDoc.period).toBe('2024-03');
    expect(migratedDoc.payDate).toEqual(new Date('2024-03-15T12:00:00.000Z'));
    expect(migratedDoc.netPay).toBe(8000);
    expect(migratedDoc.netPayInPiastres).toBe(800000);
    expect(migratedDoc.grossSalary).toBe(10000);
    expect(migratedDoc.grossSalaryInPiastres).toBe(1000000);
    expect(migratedDoc.insuranceDetails?.actualEmployeeShare).toBe(880);
    expect(migratedDoc.taxDetails?.actualTax).toBe(1120);

    // Re-run migration up to assert idempotency
    const res2 = await migration.up(mongoose.connection);
    expect(res2.success).toBe(true);

    const docAfterSecondRun = await paychecksCollection.findOne({ _id: legacyDocId });
    expect(docAfterSecondRun.period).toBe('2024-03');
    expect(docAfterSecondRun.netPay).toBe(8000);
  });

  it('2. _down restores all 10 physical legacy fields on post-migration records and runs idempotently', async () => {
    const paychecksCollection = mongoose.connection.collection('paychecks');
    const postMigrationDocId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    // Insert post-migration document (has only canonical fields, 0 physical legacy fields)
    await paychecksCollection.insertOne({
      _id: postMigrationDocId,
      user: userId,
      period: '2025-01',
      payDate: new Date('2025-01-15T12:00:00.000Z'),
      grossSalary: 18000,
      grossSalaryInPiastres: 1800000,
      netPay: 14000,
      netPayInPiastres: 1400000,
      insuranceDetails: { actualEmployeeShare: 1500, expectedEmployeeShare: 1500 },
      taxDetails: { actualTax: 2500, expectedTax: 2500 },
      disbursementType: 'Regular',
      deletedAt: null,
      createdAt: new Date('2025-01-15T12:00:00.000Z'),
      updatedAt: new Date('2025-01-15T12:00:00.000Z'),
    });

    // Execute migration down
    const res1 = await migration.down(mongoose.connection);
    expect(res1.success).toBe(true);

    const rolledBackDoc = await paychecksCollection.findOne({ _id: postMigrationDocId });
    expect(rolledBackDoc.month).toBe('2025-01');
    expect(rolledBackDoc.date).toEqual(new Date('2025-01-15T12:00:00.000Z'));
    expect(rolledBackDoc.amount).toBe(14000);
    expect(rolledBackDoc.amountInPiastres).toBe(1400000);
    expect(rolledBackDoc.grossAmount).toBe(18000);
    expect(rolledBackDoc.grossAmountInPiastres).toBe(1800000);
    expect(rolledBackDoc.insuranceDeduction).toBe(1500);
    expect(rolledBackDoc.insuranceDeductionInPiastres).toBe(150000);
    expect(rolledBackDoc.taxDeduction).toBe(2500);
    expect(rolledBackDoc.taxDeductionInPiastres).toBe(250000);

    // Re-run migration down to assert idempotency
    const res2 = await migration.down(mongoose.connection);
    expect(res2.success).toBe(true);

    const docAfterSecondRun = await paychecksCollection.findOne({ _id: postMigrationDocId });
    expect(docAfterSecondRun.month).toBe('2025-01');
    expect(docAfterSecondRun.amount).toBe(14000);
  });
});

