// backend/tests/unit/mwrrCashFlowDoubleCounting.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const User = require('../../models/User');
const Trade = require('../../models/Trade');
const {
  getPortfolioCashFlows,
  getNetBrokerCash,
  getPortfolioSummary,
} = require('../../utils/portfolioService');

jest.setTimeout(60000);

describe('Step 4A.6: [GAP-011] MWRR Option C Cash Flow Boundary & Broker Cash Terminal Value', () => {
  let user;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    user = await User.create({
      username: 'mwrr_tester',
      email: 'mwrr@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
  });

  it('Scenario 1: should correctly handle TopUp-only portfolio without crashing and include broker cash in terminal value', async () => {
    // 1. User logs TopUp of 50,000 on Thndr on 2026-01-01
    await Trade.create({
      user: user._id,
      date: new Date('2026-01-01T00:00:00.000Z'),
      broker: 'Thndr',
      type: 'TopUp',
      totalValue: 50000,
      totalValueInPiastres: 5000000,
    });

    const netCash = await getNetBrokerCash(user._id);
    expect(netCash).toBe(50000);

    const cashFlows = await getPortfolioCashFlows(user._id, netCash);
    // Should have exactly 2 flows: the initial TopUp (-50,000) and the terminal value (+50,000)
    expect(cashFlows.length).toBe(2);
    expect(cashFlows[0].amount).toBe(-50000);
    expect(cashFlows[1].amount).toBe(50000);

    const summary = await getPortfolioSummary(user._id, { forceRefresh: true });
    expect(summary.xirr).toBe(0);
    expect(summary.xirrMessage).toBeNull();
  });

  it('Scenario 2: should not double-count TopUp and Buy, and should correctly include uninvested dividend cash in terminal value', async () => {
    // 1. TopUp of 50,000 on 2026-01-01
    await Trade.create({
      user: user._id,
      date: new Date('2026-01-01T00:00:00.000Z'),
      broker: 'Thndr',
      type: 'TopUp',
      totalValue: 50000,
      totalValueInPiastres: 5000000,
    });

    // 2. Buy 50,000 of AAPL on 2026-01-02
    await Trade.create({
      user: user._id,
      date: new Date('2026-01-02T00:00:00.000Z'),
      broker: 'Thndr',
      type: 'Buy',
      stockCode: 'AAPL',
      shares: 100,
      price: 500,
      fees: 0,
      totalValue: 50000,
      totalValueInPiastres: 5000000,
      iteration: 1,
    });

    // 3. Receive 5,000 cash dividend on 2026-03-01
    await Trade.create({
      user: user._id,
      date: new Date('2026-03-01T00:00:00.000Z'),
      broker: 'Thndr',
      type: 'Dividend',
      stockCode: 'AAPL',
      totalValue: 5000,
      totalValueInPiastres: 500000,
      iteration: 1,
    });

    // Uninvested cash in Thndr = 50,000 (TopUp) - 50,000 (Buy) + 5,000 (Dividend) = 5,000
    const netCash = await getNetBrokerCash(user._id);
    expect(netCash).toBe(5000);

    const stockTerminalValue = 55000; // AAPL market value
    const totalTerminalValue = stockTerminalValue + netCash; // 60,000

    const cashFlows = await getPortfolioCashFlows(user._id, totalTerminalValue);

    // With Option C: Buy and Dividend are internal to Thndr, so cashFlows only contains TopUp (-50,000) and Terminal (+60,000)
    expect(cashFlows.length).toBe(2);
    expect(cashFlows[0].amount).toBe(-50000);
    expect(cashFlows[1].amount).toBe(60000);
  });

  it('Scenario 3: should fallback to treating Buy as external inflow for brokers without TopUp records', async () => {
    // Buy 20,000 on EFG without any TopUp records
    await Trade.create({
      user: user._id,
      date: new Date('2026-01-10T00:00:00.000Z'),
      broker: 'EFG',
      type: 'Buy',
      stockCode: 'COMI',
      shares: 100,
      price: 200,
      fees: 0,
      totalValue: 20000,
      totalValueInPiastres: 2000000,
      iteration: 1,
    });

    const cashFlows = await getPortfolioCashFlows(user._id, 25000);
    expect(cashFlows.length).toBe(2);
    expect(cashFlows[0].amount).toBe(-20000);
    expect(cashFlows[1].amount).toBe(25000);
  });
});
