// backend/tests/integration/purchasingPowerApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Expenditure = require('../../models/Expenditure');
const Currency = require('../../models/Currency');
const ForexRateHistory = require('../../models/ForexRateHistory');
const MarketPriceCache = require('../../models/MarketPriceCache');
const marketPriceService = require('../../utils/marketPriceService');
const forexRevaluation = require('../../utils/forexRevaluation');

jest.setTimeout(60000);

describe('Step 7D.1a: [FEAT-007, GAP-014] Purchasing Power & Gold Analytics API Integration Tests', () => {
  let managerUser;
  let managerAuth;
  let viewerUser;
  let viewerAuth;
  let otherUser;
  let otherAuth;

  beforeAll(async () => {
    await connect();
    await Expenditure.init();
    await Currency.init();
    await ForexRateHistory.init();
    await MarketPriceCache.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    marketPriceService.clearMemoryCache();

    // Seed Manager
    const m = await createUserWithToken({ role: 'manager', username: 'purchasing_mgr' });
    managerUser = m.user;
    managerAuth = m.authHeader;

    // Seed Viewer managed by manager
    const v = await createUserWithToken({
      role: 'viewer',
      username: 'purchasing_viewer',
      managedBy: managerUser._id,
    });
    viewerUser = v.user;
    viewerAuth = v.authHeader;

    // Seed Other User (for multi-tenant isolation)
    const o = await createUserWithToken({ role: 'manager', username: 'purchasing_other' });
    otherUser = o.user;
    otherAuth = o.authHeader;
  });

  // Test 1: HTTP 200 and schema structure
  it('1. GET /api/golds/purchasing-power returns HTTP 200 with structured metrics', async () => {
    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.current).toBeDefined();
    expect(res.body.current).toHaveProperty('netWorthEgp');
    expect(res.body.current).toHaveProperty('goldPrice24k');
    expect(res.body.current).toHaveProperty('usdRate');
    expect(res.body.current).toHaveProperty('purchasingPowerGoldGrams');
    expect(res.body.current).toHaveProperty('purchasingPowerUsd');
    expect(Array.isArray(res.body.timeline)).toBe(true);
    expect(Array.isArray(res.body.currencyHoldings)).toBe(true);
  });

  // Test 2: Correctly converts net worth into 24K gold grams
  it('2. Correctly converts net worth into 24K gold grams based on current gold scrapers', async () => {
    // Seed expenditure bank balance: 420,000 EGP (42,000,000 piastres)
    await Expenditure.create({
      user: managerUser._id,
      title: 'Initial Balance',
      amount: 420000,
      amountInPiastres: 42000000,
      paymentMethod: 'Bank',
      transactionType: 'W',
      date: new Date(),
      runningBalancesInPiastres: {
        bank: 42000000,
        cash: 0,
        prepaid: 0,
      },
    });

    // Mock gold price: 4,200 EGP per gram of 24K
    jest.spyOn(marketPriceService, 'getGoldPrices').mockResolvedValue({
      data: { '24': 4200, '21': 3675, '18': 3150 },
      isLive: true,
      isStale: false,
      source: 'test-scraper',
      timestamp: Date.now(),
    });

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.current.netWorthEgp).toBe(420000);
    expect(res.body.current.goldPrice24k).toBe(4200);
    // 420,000 / 4,200 = 100 grams
    expect(res.body.current.purchasingPowerGoldGrams).toBe(100);
  });

  // Test 3: Correctly converts net worth into USD based on current CIB exchange rates
  it('3. Correctly converts net worth into USD based on current exchange rates', async () => {
    // Net worth = 485,000 EGP
    await Expenditure.create({
      user: managerUser._id,
      title: 'Savings',
      amount: 485000,
      amountInPiastres: 48500000,
      paymentMethod: 'Bank',
      transactionType: 'W',
      date: new Date(),
      runningBalancesInPiastres: {
        bank: 48500000,
        cash: 0,
        prepaid: 0,
      },
    });

    // Mock exchange rates: 1 USD = 48.5 EGP
    jest.spyOn(forexRevaluation, 'fetchLatestRates').mockResolvedValueOnce({
      rates: { USD: 48.5, EUR: 52.0 },
      rateSource: 'CIB',
      isStale: false,
      timestamp: Date.now(),
    });

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.current.netWorthEgp).toBe(485000);
    expect(res.body.current.usdRate).toBe(48.5);
    // 485,000 / 48.5 = 10,000 USD
    expect(res.body.current.purchasingPowerUsd).toBe(10000);
  });

  // Test 4: Returns 0 gold grams and 0 USD when user has zero assets without NaN or Infinity (🟢-3)
  it('4. Returns 0 gold grams and 0 USD when user has zero assets (both null expenditure and 0 balance)', async () => {
    // Case A: Zero transactions (null latestExpenditure)
    const resA = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(resA.status).toBe(200);
    expect(resA.body.current.netWorthEgp).toBe(0);
    expect(resA.body.current.purchasingPowerGoldGrams).toBe(0);
    expect(resA.body.current.purchasingPowerUsd).toBe(0);
    expect(Number.isNaN(resA.body.current.purchasingPowerGoldGrams)).toBe(false);
    expect(Number.isFinite(resA.body.current.purchasingPowerGoldGrams)).toBe(true);

    // Case B: Explicit 0 balance
    await Expenditure.create({
      user: managerUser._id,
      title: 'Emptied',
      amount: 0,
      amountInPiastres: 0,
      paymentMethod: 'Cash',
      transactionType: 'W',
      date: new Date(),
      runningBalancesInPiastres: { bank: 0, cash: 0, prepaid: 0 },
    });

    const resB = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(resB.status).toBe(200);
    expect(resB.body.current.netWorthEgp).toBe(0);
    expect(resB.body.current.purchasingPowerGoldGrams).toBe(0);
    expect(resB.body.current.purchasingPowerUsd).toBe(0);
  });

  // Test 5: Slices historical timeline points with chronological dates (🔴-4)
  it('5. Slices historical timeline points in chronological order with recent entries', async () => {
    const baseDate = new Date('2026-10-01T00:00:00.000Z');
    // Seed 3 historical snapshots
    for (let i = 0; i < 5; i++) {
      const snapDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      await ForexRateHistory.create({
        baseCurrency: 'EGP',
        rates: { USD: 48.0 + i * 0.1 },
        source: 'CIB',
        date: snapDate,
      });
    }

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.timeline.length).toBe(5);
    // Chronological order: first element is older than last element
    const firstDate = new Date(res.body.timeline[0].date).getTime();
    const lastDate = new Date(res.body.timeline[res.body.timeline.length - 1].date).getTime();
    expect(firstDate).toBeLessThan(lastDate);
    // Asserts timeline[timeline.length - 1].date is recent
    expect(res.body.timeline[res.body.timeline.length - 1].usdRate).toBeCloseTo(48.4, 2);
  });

  // Test 6: Includes mark-to-market valuations for user foreign currency holdings (GAP-014)
  it('6. Includes mark-to-market valuations for user foreign currency holdings', async () => {
    // Seed currency holding: 1,000 USD bought at 40 EGP (price = 40,000 EGP)
    await Currency.create({
      user: managerUser._id,
      name: 'US Dollars',
      currencyCode: 'USD',
      amount: 1000,
      price: 40000,
      priceInPiastres: 4000000,
      purchaseRate: 40,
      date: new Date('2026-05-01'),
    });

    jest.spyOn(forexRevaluation, 'fetchLatestRates').mockResolvedValueOnce({
      rates: { USD: 48.5 },
      rateSource: 'CIB',
      isStale: false,
      timestamp: Date.now(),
    });

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.currencyHoldings.length).toBe(1);
    const pos = res.body.currencyHoldings[0];
    expect(pos.currencyCode).toBe('USD');
    expect(pos.amount).toBe(1000);
    expect(pos.purchaseRate).toBe(40);
    expect(pos.costBasisEgp).toBe(40000);
    expect(pos.currentRate).toBe(48.5);
    expect(pos.currentValueEgp).toBe(48500);
    expect(pos.currentValueUsd).toBe(1000);
  });

  // Test 7: Calculates unrealized forex gains/losses on active currency holdings
  it('7. Calculates unrealized forex gains/losses on active currency holdings', async () => {
    await Currency.create({
      user: managerUser._id,
      name: 'Euros',
      currencyCode: 'EUR',
      amount: 500,
      price: 25000,
      priceInPiastres: 2500000,
      purchaseRate: 50,
      date: new Date('2026-06-01'),
    });

    jest.spyOn(forexRevaluation, 'fetchLatestRates').mockResolvedValueOnce({
      rates: { EUR: 54.0, USD: 48.5 },
      rateSource: 'CIB',
      isStale: false,
      timestamp: Date.now(),
    });

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    const pos = res.body.currencyHoldings[0];
    // Cost basis = 500 * 50 = 25,000 EGP. Current value = 500 * 54 = 27,000 EGP.
    expect(pos.unrealizedGainLossEgp).toBe(2000);
    expect(pos.unrealizedGainLossPercentage).toBe(8); // +8.0%
  });

  // Test 8: Gracefully falls back to cached MarketPriceCache when live gold scrapers fail
  it('8. Gracefully falls back to cached MarketPriceCache when live gold scrapers fail', async () => {
    // Seed persistent cache
    await MarketPriceCache.findOneAndUpdate(
      { key: 'gold' },
      { data: { '24': 4100, '21': 3587, '18': 3075 }, source: 'mongodb-cache', updatedAt: new Date() },
      { upsert: true }
    );

    // Fail live scraper
    jest.spyOn(marketPriceService, 'getGoldPrices').mockResolvedValue({
      data: { '24': 4100, '21': 3587, '18': 3075 },
      isLive: false,
      isStale: true,
      source: 'mongodb-cache',
      timestamp: Date.now(),
    });

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.current.goldPrice24k).toBe(4100);
    expect(res.body.current.goldPriceStatus).toBe('stale');
  });

  // Test 9: Gracefully falls back to ForexRateHistory when CIB currency feed is unavailable
  it('9. Gracefully falls back to ForexRateHistory when CIB currency feed is unavailable', async () => {
    // Seed ForexRateHistory fallback
    await ForexRateHistory.create({
      baseCurrency: 'EGP',
      rates: { USD: 48.25 },
      source: 'fallback',
      date: new Date(),
    });

    jest.spyOn(forexRevaluation, 'fetchLatestRates').mockResolvedValueOnce({
      rates: { USD: 48.25 },
      rateSource: 'fallback',
      isStale: true,
      timestamp: Date.now() - 3600000,
    });

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.current.usdRate).toBe(48.25);
    expect(res.body.current.usdRateStatus).toBe('stale');
  });

  // Test 10: Enforces multi-tenant isolation
  it('10. Enforces multi-tenant isolation (User A cannot view User B data)', async () => {
    // Seed 1,000,000 for Manager
    await Expenditure.create({
      user: managerUser._id,
      title: 'Manager Assets',
      amount: 1000000,
      amountInPiastres: 100000000,
      paymentMethod: 'Bank',
      transactionType: 'W',
      date: new Date(),
      runningBalancesInPiastres: { bank: 100000000, cash: 0, prepaid: 0 },
    });

    // Seed 50,000 for Other User
    await Expenditure.create({
      user: otherUser._id,
      title: 'Other Assets',
      amount: 50000,
      amountInPiastres: 5000000,
      paymentMethod: 'Bank',
      transactionType: 'W',
      date: new Date(),
      runningBalancesInPiastres: { bank: 5000000, cash: 0, prepaid: 0 },
    });

    const otherRes = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', otherAuth);

    expect(otherRes.status).toBe(200);
    expect(otherRes.body.current.netWorthEgp).toBe(50000);
    expect(otherRes.body.current.netWorthEgp).not.toBe(1000000);
  });

  // Test 11: Viewers with canModify: false can successfully query purchasing power (🟡-A)
  it('11. Viewers with canModify: false can successfully query purchasing power', async () => {
    await Expenditure.create({
      user: managerUser._id,
      title: 'Managed Balance',
      amount: 150000,
      amountInPiastres: 15000000,
      paymentMethod: 'Bank',
      transactionType: 'W',
      date: new Date(),
      runningBalancesInPiastres: { bank: 15000000, cash: 0, prepaid: 0 },
    });

    const res = await request(app)
      .get('/api/golds/purchasing-power')
      .set('Authorization', viewerAuth);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Viewer sees effective manager's balance
    expect(res.body.current.netWorthEgp).toBe(150000);
  });

  // Test 12: Rejects unauthenticated requests with HTTP 401
  it('12. Rejects unauthenticated requests with HTTP 401', async () => {
    const res = await request(app).get('/api/golds/purchasing-power');
    expect(res.status).toBe(401);
  });
});

