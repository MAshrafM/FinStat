// backend/tests/integration/familyRollupApi.test.js
const request = require('supertest');
const app = require('../../server');
const testDb = require('../helpers/testDb');
const User = require('../../models/User');
const Gold = require('../../models/Gold');
const AccountDelegation = require('../../models/AccountDelegation');
const marketPriceService = require('../../utils/marketPriceService');
const { createTestUser, generateTestToken } = require('../helpers/authFixtures');

jest.setTimeout(60000);

describe('Step 8C.1b: Consolidated Family Office Rollup Integration Tests [FEAT-009]', () => {
  let parentManager, childViewer, spouseManager, strangerManager;
  let parentToken, childToken, spouseToken, strangerToken;

  beforeAll(async () => {
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  beforeEach(async () => {
    await testDb.clearDatabase();
    marketPriceService.clearMemoryCache();

    jest.spyOn(marketPriceService, 'getGoldPrices').mockResolvedValue({
      '24': 3000,
      '21': 2625,
      '18': 2250,
      source: 'mock',
      stale: false,
    });
    jest.spyOn(marketPriceService, 'getStockPrices').mockResolvedValue({});
    jest.spyOn(marketPriceService, 'getCurrencyRates').mockResolvedValue({ USD: 50 });

    // 1. Parent Manager (Family Head)
    parentManager = await createTestUser({
      username: 'family_head',
      email: 'head@finstat.io',
      role: 'manager',
      fullName: 'Family Head',
    });
    parentToken = generateTestToken(parentManager);

    // 2. Child Dependent (Managed by Parent)
    childViewer = await createTestUser({
      username: 'family_child',
      email: 'child@finstat.io',
      role: 'viewer',
      fullName: 'Family Child',
      managedBy: parentManager._id,
    });
    childToken = generateTestToken(childViewer);

    // 3. Spouse Manager (Independent user who delegates to Family Head)
    spouseManager = await createTestUser({
      username: 'family_spouse',
      email: 'spouse@finstat.io',
      role: 'manager',
      fullName: 'Family Spouse',
    });
    spouseToken = generateTestToken(spouseManager);

    // 4. Stranger User (Unrelated tenant)
    strangerManager = await createTestUser({
      username: 'stranger_mgr',
      email: 'stranger@finstat.io',
      role: 'manager',
      fullName: 'Stranger Manager',
    });
    strangerToken = generateTestToken(strangerManager);

    // Seed some mock asset data:
    // Parent has 100g gold (24k) @ 3000 EGP = 300,000 EGP
    await Gold.create({
      user: parentManager._id,
      item: 'Gold Bar 100g',
      karat: 24,
      weight: 100,
      price: 3000,
      paid: 300000,
      status: 'hold',
      date: new Date(),
    });

    // Spouse has 50g gold (24k) @ 3000 EGP = 150,000 EGP
    await Gold.create({
      user: spouseManager._id,
      item: 'Gold Bar 50g',
      karat: 24,
      weight: 50,
      price: 3000,
      paid: 150000,
      status: 'hold',
      date: new Date(),
    });
  });

  // Test 1: GET /api/users/family-rollup returns HTTP 200 with consolidated net worth, total assets, total debts, and member summaries
  test('1. GET /api/users/family-rollup returns HTTP 200 with consolidated net worth, total assets, total debts, and member summaries', async () => {
    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.consolidatedNetWorth).toBeDefined();
    expect(res.body.consolidatedAssets).toBeDefined();
    expect(res.body.consolidatedDebts).toBeDefined();
    expect(Array.isArray(res.body.members)).toBe(true);
  });

  // Test 2: Includes primary user's assets and liabilities in rollup calculations
  test("2. Includes primary user's assets and liabilities in rollup calculations", async () => {
    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const headMember = res.body.members.find((m) => m.userId === parentManager._id.toString());
    expect(headMember).toBeDefined();
    expect(headMember.isSelf).toBe(true);
    expect(headMember.totalAssets).toBeGreaterThanOrEqual(300000);
  });

  // Test 3: Includes all managed dependent accounts (managedBy: req.user.id) in rollup calculations
  test('3. Includes all managed dependent accounts (managedBy: req.user.id) in rollup calculations', async () => {
    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const childMember = res.body.members.find((m) => m.userId === childViewer._id.toString());
    expect(childMember).toBeDefined();
    expect(childMember.relationship).toBe('dependent');
  });

  // Test 4: Includes active delegated accounts (delegate: req.user.id, status: 'active') in rollup calculations
  test("4. Includes active delegated accounts (delegate: req.user.id, status: 'active') in rollup calculations", async () => {
    // Spouse delegates to Family Head
    await AccountDelegation.create({
      delegator: spouseManager._id,
      delegate: parentManager._id,
      relationship: 'spouse',
      permissions: 'view_only',
      status: 'active',
    });

    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const spouseMember = res.body.members.find((m) => m.userId === spouseManager._id.toString());
    expect(spouseMember).toBeDefined();
    expect(spouseMember.relationship).toBe('spouse');
    expect(spouseMember.totalAssets).toBeGreaterThanOrEqual(150000);
  });

  // Test 5: Excludes revoked or pending delegations from family rollup
  test('5. Excludes revoked or pending delegations from family rollup', async () => {
    // Create revoked delegation
    await AccountDelegation.create({
      delegator: spouseManager._id,
      delegate: parentManager._id,
      relationship: 'spouse',
      permissions: 'view_only',
      status: 'revoked',
    });

    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const spouseMember = res.body.members.find((m) => m.userId === spouseManager._id.toString());
    expect(spouseMember).toBeUndefined();
  });

  // Test 6: Asserts mathematical conservation: consolidatedNetWorth === sum(member.netWorth) (asserts INV-8C-04)
  test('6. Asserts mathematical conservation: consolidatedNetWorth === sum(member.netWorth) (asserts INV-8C-04)', async () => {
    // Active spouse delegation
    await AccountDelegation.create({
      delegator: spouseManager._id,
      delegate: parentManager._id,
      relationship: 'spouse',
      permissions: 'view_only',
      status: 'active',
    });

    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const memberNetWorthSum = res.body.members.reduce((acc, m) => acc + Number(m.netWorth || 0), 0);
    const memberAssetsSum = res.body.members.reduce((acc, m) => acc + Number(m.totalAssets || 0), 0);
    const memberDebtsSum = res.body.members.reduce((acc, m) => acc + Number(m.totalDebts || 0), 0);

    expect(res.body.consolidatedNetWorth).toBeCloseTo(memberNetWorthSum, 2);
    expect(res.body.consolidatedAssets).toBeCloseTo(memberAssetsSum, 2);
    expect(res.body.consolidatedDebts).toBeCloseTo(memberDebtsSum, 2);
    expect(res.body.consolidatedNetWorth).toBeCloseTo(
      res.body.consolidatedAssets - res.body.consolidatedDebts,
      2
    );
  });

  // Test 7: Enforces multi-tenant isolation: Manager A cannot see Manager B's dependents or delegations in rollup
  test("7. Enforces multi-tenant isolation: Manager A cannot see Manager B's dependents or delegations in rollup", async () => {
    // Stranger creates their own dependent
    const strangerDependent = await createTestUser({
      username: 'stranger_child',
      email: 'stranger_child@finstat.io',
      role: 'viewer',
      fullName: 'Stranger Dependent',
      managedBy: strangerManager._id,
    });

    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    const strangerChild = res.body.members.find((m) => m.userId === strangerDependent._id.toString());
    const strangerHead = res.body.members.find((m) => m.userId === strangerManager._id.toString());
    expect(strangerChild).toBeUndefined();
    expect(strangerHead).toBeUndefined();
  });

  // Test 8: Single user without dependents or delegations receives single-member rollup matching their individual portfolio summary
  test('8. Single user without dependents or delegations receives single-member rollup matching their individual portfolio summary', async () => {
    const res = await request(app)
      .get('/api/users/family-rollup')
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.members.length).toBe(1);
    expect(res.body.members[0].userId).toBe(strangerManager._id.toString());
    expect(res.body.members[0].isSelf).toBe(true);
    expect(res.body.consolidatedNetWorth).toBe(res.body.members[0].netWorth);
  });
});
