// backend/tests/integration/corporateActionImmutability.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Trade = require('../../models/Trade');
const CorporateAction = require('../../models/CorporateAction');
const { applyCorporateActions, createSplitWizard } = require('../../utils/corporateActionEngine');
const migration = require('../../migrations/20261025_120000_add_appliedDynamically_flag');

describe('Corporate Action Immutability & Dynamic Multiplier Tests [AUD-DATA-002, SIMP-006]', () => {
  let user;
  let token;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    process.env.ENABLE_DYNAMIC_SPLITS = 'true';

    user = await User.create({
      username: 'corp_action_user',
      email: 'corp@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
  });

  afterEach(() => {
    delete process.env.ENABLE_DYNAMIC_SPLITS;
  });

  it('should leave trades unmultiplied when CorporateAction has appliedDynamically: false (legacy action)', async () => {
    const historicalTrade = await Trade.create({
      user: user._id,
      stockCode: 'COMI',
      broker: 'Thndr',
      type: 'Buy',
      shares: 100,
      price: 50,
      priceInPiastres: 5000,
      fees: 10,
      feesInPiastres: 1000,
      totalValue: 5010,
      totalValueInPiastres: 501000,
      date: new Date('2026-01-10T10:00:00Z'),
    });

    const legacyAction = new CorporateAction({
      user: user._id,
      stockCode: 'COMI',
      broker: 'Thndr',
      type: 'split',
      ratio: 2,
      effectiveDate: new Date('2026-02-01T10:00:00Z'),
      appliedDynamically: false,
    });
    await legacyAction.save();

    const adjusted = applyCorporateActions([historicalTrade], [legacyAction]);
    expect(adjusted.length).toBe(1);
    // Legacy action must not multiply trade
    expect(adjusted[0].shares).toBe(100);
    expect(adjusted[0].price).toBe(50);
  });

  it('should apply multiplier dynamically when appliedDynamically: true without mutating historical Trade documents in DB', async () => {
    const historicalTrade = await Trade.create({
      user: user._id,
      stockCode: 'COMI',
      broker: 'Thndr',
      type: 'Buy',
      shares: 100,
      price: 50,
      priceInPiastres: 5000,
      fees: 10,
      feesInPiastres: 1000,
      totalValue: 5010,
      totalValueInPiastres: 501000,
      date: new Date('2026-01-10T10:00:00Z'),
    });

    const { corporateAction } = await createSplitWizard(user._id, {
      stockCode: 'COMI',
      broker: 'Thndr',
      type: 'split',
      ratio: 2,
      effectiveDate: new Date('2026-02-01T10:00:00Z'),
      notes: 'Test split',
      logTrade: true,
    });

    expect(corporateAction.appliedDynamically).toBe(true);

    // 1. Verify DB trade document remains completely untouched (immutable)
    const freshDbTrade = await Trade.findById(historicalTrade._id);
    expect(freshDbTrade.shares).toBe(100);
    expect(freshDbTrade.price).toBe(50);
    expect(freshDbTrade.priceInPiastres).toBe(5000);

    // 2. Verify dynamic application during valuation
    const adjusted = applyCorporateActions([freshDbTrade], [corporateAction]);
    expect(adjusted.length).toBe(1);
    expect(adjusted[0].shares).toBe(200); // 100 * 2
    expect(adjusted[0].price).toBe(25);   // 50 / 2
    expect(adjusted[0].priceInPiastres).toBe(2500);
  });

  it('should respect ENABLE_DYNAMIC_SPLITS=false feature flag and bypass dynamic multiplication', async () => {
    process.env.ENABLE_DYNAMIC_SPLITS = 'false';

    const trade = {
      stockCode: 'ETEL',
      broker: 'EFG',
      type: 'Buy',
      shares: 50,
      price: 20,
      date: new Date('2026-03-01T10:00:00Z'),
    };

    const action = {
      stockCode: 'ETEL',
      broker: 'EFG',
      type: 'split',
      ratio: 2,
      effectiveDate: new Date('2026-03-15T10:00:00Z'),
      appliedDynamically: true,
    };

    const adjusted = applyCorporateActions([trade], [action]);
    expect(adjusted[0].shares).toBe(50);
    expect(adjusted[0].price).toBe(20);
  });

  it('should create corporate action via API with appliedDynamically: true', async () => {
    const res = await request(app)
      .post('/api/corporate-actions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        stockCode: 'FWRY',
        broker: 'Thndr',
        type: 'bonus',
        ratio: 0.2,
        effectiveDate: '2026-04-01T00:00:00Z',
        notes: '20% bonus shares',
      });

    expect(res.status).toBe(201);
    expect(res.body.appliedDynamically).toBe(true);
    expect(res.body.stockCode).toBe('FWRY');

    const dbRecord = await CorporateAction.findById(res.body._id);
    expect(dbRecord.appliedDynamically).toBe(true);
  });

  it('should execute migration idempotently with dry-run support', async () => {
    // Seed an unflagged corporate action directly via collection bypass
    const col = mongoose.connection.collection('corporateactions');
    await col.insertOne({
      user: user._id,
      stockCode: 'SWDY',
      broker: 'Thndr',
      type: 'split',
      ratio: 2,
      effectiveDate: new Date('2026-05-01T00:00:00Z'),
    });

    // 1. Dry run
    const originalArgv = process.argv;
    process.argv = [...originalArgv, '--dry-run'];
    try {
      const dryResult = await migration.up(mongoose.connection.db);
      expect(dryResult.dryRun).toBe(true);

      const stillUnset = await col.findOne({ stockCode: 'SWDY' });
      expect(stillUnset.appliedDynamically).toBeUndefined();
    } finally {
      process.argv = originalArgv;
    }

    // 2. Real migration run
    await migration.up(mongoose.connection.db);
    const updated = await col.findOne({ stockCode: 'SWDY' });
    expect(updated.appliedDynamically).toBe(false);

    // 3. Rollback
    await migration.down(mongoose.connection.db);
    const rolledBack = await col.findOne({ stockCode: 'SWDY' });
    expect(rolledBack.appliedDynamically).toBeUndefined();
  });
});
