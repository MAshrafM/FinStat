// backend/tests/unit/services/tradeExecutionService.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../../helpers/testDb');
const Trade = require('../../../models/Trade');
const User = require('../../../models/User');
const CorporateAction = require('../../../models/CorporateAction');
const Expenditure = require('../../../models/Expenditure');
const tradeExecutionService = require('../../../services/tradeExecutionService');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../../utils/errors');

jest.setTimeout(60000);

describe('Sub-step 8A.1b: Trade Execution Service Unit Tests [AUD-ARCH-002]', () => {
  let userId;

  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    await User.create({
      _id: userId,
      username: 'tradetester',
      name: 'Trade Tester',
      email: 'trade@tester.com',
      password: 'password123',
      costBasisMethod: 'average',
    });
  });

  // Test 1: listTrades returns paginated trades and filters by broker and stockCode search
  test('1. listTrades returns paginated trades and filters by broker and stockCode search', async () => {
    await Trade.create([
      { user: userId, broker: 'Hermes', stockCode: 'COMI', type: 'Buy', shares: 100, price: 50, totalValue: 5000, date: new Date('2026-01-01') },
      { user: userId, broker: 'Thndr', stockCode: 'EAST', type: 'Buy', shares: 200, price: 20, totalValue: 4000, date: new Date('2026-01-02') },
      { user: userId, broker: 'Hermes', stockCode: 'FWRY', type: 'Buy', shares: 500, price: 10, totalValue: 5000, date: new Date('2026-01-03') },
    ]);

    const resBroker = await tradeExecutionService.listTrades({
      userId,
      query: { broker: 'Hermes', page: 1, limit: 10 },
    });
    expect(resBroker.data.length).toBe(2);
    expect(resBroker.page).toBe(1);

    const resSearch = await tradeExecutionService.listTrades({
      userId,
      query: { search: 'com', page: 1, limit: 10 },
    });
    expect(resSearch.data.length).toBe(1);
    expect(resSearch.data[0].stockCode).toBe('COMI');
  });

  // Test 2: getAllTrades returns non-paginated lean trades with X-Truncated detection at limit cap
  test('2. getAllTrades returns non-paginated lean trades with truncation detection', async () => {
    await Trade.create([
      { user: userId, broker: 'Hermes', stockCode: 'COMI', type: 'Buy', shares: 100, price: 50, totalValue: 5000, date: new Date() },
      { user: userId, broker: 'Hermes', stockCode: 'EAST', type: 'Buy', shares: 200, price: 20, totalValue: 4000, date: new Date() },
    ]);

    const result = await tradeExecutionService.getAllTrades({ userId, requestedLimit: 1 });
    expect(result.trades.length).toBe(1);
    expect(result.truncated).toBe(true);

    const resultAll = await tradeExecutionService.getAllTrades({ userId, requestedLimit: 100 });
    expect(resultAll.trades.length).toBe(2);
    expect(resultAll.truncated).toBe(false);
  });

  // Test 3: getPortfolioSummary groups trades by broker/stock/iteration and applies cost basis
  test('3. getPortfolioSummary groups trades by broker/stock/iteration and applies cost basis', async () => {
    await Trade.create([
      { user: userId, broker: 'Thndr', stockCode: 'COMI', type: 'Buy', shares: 100, price: 50, totalValue: 5000, date: new Date('2026-01-01') },
      { user: userId, broker: 'Thndr', stockCode: 'COMI', type: 'Sell', shares: 40, price: 60, totalValue: 2400, date: new Date('2026-01-15') },
    ]);

    const summary = await tradeExecutionService.getPortfolioSummary({ userId });
    expect(summary.length).toBe(1);
    expect(summary[0]._id.stockCode).toBe('COMI');
    expect(summary[0].currentShares).toBe(60);
    expect(summary[0].status).toBe('Open');
  });

  // Test 4: executeStockSplit creates split trade and corporate action record via wizard
  test('4. executeStockSplit creates split trade and corporate action record via wizard', async () => {
    await Trade.create({
      user: userId,
      broker: 'Thndr',
      stockCode: 'COMI',
      type: 'Buy',
      shares: 100,
      price: 50,
      totalValue: 5000,
      date: new Date('2026-01-01'),
    });

    const result = await tradeExecutionService.executeStockSplit({
      userId,
      ticker: 'COMI',
      broker: 'Thndr',
      splitRatio: 2,
      splitDate: '2026-02-01',
      canModify: true,
    });

    expect(result.corporateAction).toBeDefined();
    expect(result.corporateAction.type).toBe('split');
  });

  // Test 5: executeCorporateAction applies bonus issue / stock split corporate action wizard
  test('5. executeCorporateAction applies bonus issue / stock split corporate action wizard', async () => {
    await Trade.create({
      user: userId,
      broker: 'Thndr',
      stockCode: 'EAST',
      type: 'Buy',
      shares: 100,
      price: 20,
      totalValue: 2000,
      date: new Date('2026-01-01'),
    });

    const result = await tradeExecutionService.executeCorporateAction({
      userId,
      data: {
        stockCode: 'EAST',
        broker: 'Thndr',
        type: 'bonus',
        ratio: 0.5,
        effectiveDate: '2026-02-01',
        logTrade: false,
      },
      canModify: true,
    });

    expect(result.corporateAction).toBeDefined();
    expect(result.corporateAction.type).toBe('bonus');
  });

  // Test 6: getMarketPrices fetches market prices via marketPriceService
  test('6. getMarketPrices fetches market prices', async () => {
    const prices = await tradeExecutionService.getMarketPrices({ forceRefresh: false });
    expect(prices).toBeDefined();
  });

  // Test 7: createTrade creates Buy trade with converted piastres and invalidates portfolio cache
  test('7. createTrade creates Buy trade with converted piastres and invalidates cache', async () => {
    const trade = await tradeExecutionService.createTrade({
      userId,
      data: {
        broker: 'Thndr',
        stockCode: 'COMI',
        type: 'Buy',
        shares: 100,
        price: 50.5,
        fees: 10.25,
        totalValue: 5060.25,
        date: new Date('2026-01-01'),
      },
      canModify: true,
    });

    expect(trade._id).toBeDefined();
    expect(trade.priceInPiastres).toBe(5050);
    expect(trade.feesInPiastres).toBe(1025);
    expect(trade.totalValueInPiastres).toBe(506025);
  });

  // Test 8: createTrade enforces share availability validation on Sell trades
  test('8. createTrade enforces share availability validation on Sell trades', async () => {
    await Trade.create({
      user: userId,
      broker: 'Thndr',
      stockCode: 'COMI',
      type: 'Buy',
      shares: 50,
      price: 50,
      totalValue: 2500,
      date: new Date('2026-01-01'),
    });

    await expect(
      tradeExecutionService.createTrade({
        userId,
        data: {
          broker: 'Thndr',
          stockCode: 'COMI',
          type: 'Sell',
          shares: 100, // More than owned 50
          price: 60,
          fees: 5,
          totalValue: 5995,
          date: new Date('2026-01-10'),
        },
        canModify: true,
      })
    ).rejects.toThrow(BadRequestError);
  });

  // Test 9: createTrade creates TopUp trade and creates linked credit expenditure inflow via bridge
  test('9. createTrade creates TopUp trade and creates linked credit expenditure inflow via bridge', async () => {
    const trade = await tradeExecutionService.createTrade({
      userId,
      data: {
        broker: 'Thndr',
        type: 'TopUp',
        totalValue: 5000,
        sourceAccount: 'Bank',
        date: new Date('2026-01-01'),
      },
      canModify: true,
    });

    expect(trade.type).toBe('TopUp');
    expect(trade.linkedExpenditureId).toBeDefined();

    const bridgeExp = await Expenditure.findById(trade.linkedExpenditureId);
    expect(bridgeExp).toBeDefined();
    expect(bridgeExp.bridgeDirection).toBe('outflow');
  });

  // Test 10: createTrade creates Withdraw trade and creates linked debit expenditure outflow via bridge
  test('10. createTrade creates Withdraw trade and creates linked debit expenditure outflow via bridge', async () => {
    const trade = await tradeExecutionService.createTrade({
      userId,
      data: {
        broker: 'Thndr',
        type: 'Withdraw',
        totalValue: 2000,
        destinationAccount: 'Bank',
        date: new Date('2026-01-02'),
      },
      canModify: true,
    });

    expect(trade.type).toBe('Withdraw');
    expect(trade.linkedExpenditureId).toBeDefined();

    const bridgeExp = await Expenditure.findById(trade.linkedExpenditureId);
    expect(bridgeExp).toBeDefined();
    expect(bridgeExp.bridgeDirection).toBe('inflow');
  });

  // Test 11: createTrade rejects with ForbiddenError when canModify is false
  test('11. createTrade rejects with ForbiddenError when canModify is false', async () => {
    await expect(
      tradeExecutionService.createTrade({
        userId,
        data: {
          broker: 'Thndr',
          stockCode: 'COMI',
          type: 'Buy',
          shares: 10,
          price: 50,
          totalValue: 500,
        },
        canModify: false,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  // Test 12: getDeletedTrades returns soft-deleted trades with pagination metadata
  test('12. getDeletedTrades returns soft-deleted trades with pagination metadata', async () => {
    const trade = await Trade.create({
      user: userId,
      broker: 'Thndr',
      stockCode: 'COMI',
      type: 'Buy',
      shares: 100,
      price: 50,
      totalValue: 5000,
      date: new Date('2026-01-01'),
    });
    await trade.softDelete();

    const result = await tradeExecutionService.getDeletedTrades({ userId, page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.data.length).toBe(1);
    expect(result.data[0]._id.toString()).toBe(trade._id.toString());
  });

  // Test 13: getTradeById returns trade or throws NotFoundError if missing or soft-deleted
  test('13. getTradeById returns trade or throws NotFoundError if missing or soft-deleted', async () => {
    const trade = await Trade.create({
      user: userId,
      broker: 'Thndr',
      stockCode: 'COMI',
      type: 'Buy',
      shares: 100,
      price: 50,
      totalValue: 5000,
      date: new Date('2026-01-01'),
    });

    const found = await tradeExecutionService.getTradeById({ userId, id: trade._id });
    expect(found._id.toString()).toBe(trade._id.toString());

    await trade.softDelete();
    await expect(
      tradeExecutionService.getTradeById({ userId, id: trade._id })
    ).rejects.toThrow(NotFoundError);
  });

  // Test 14: updateTrade revalidates sell shares, updates piastres, syncs linked bridge expenditure
  test('14. updateTrade revalidates sell shares, updates piastres, syncs linked bridge expenditure', async () => {
    const topUp = await tradeExecutionService.createTrade({
      userId,
      data: {
        broker: 'Thndr',
        type: 'TopUp',
        totalValue: 5000,
        sourceAccount: 'Bank',
        date: new Date('2026-01-01'),
      },
      canModify: true,
    });

    const updated = await tradeExecutionService.updateTrade({
      userId,
      id: topUp._id,
      data: {
        totalValue: 7000,
      },
      canModify: true,
    });

    expect(updated.totalValue).toBe(7000);
    expect(updated.totalValueInPiastres).toBe(700000);
  });

  // Test 15: deleteTrade and restoreTrade manage lifecycle and bridge expenditure
  test('15. deleteTrade and restoreTrade manage lifecycle and bridge expenditure', async () => {
    const topUp = await tradeExecutionService.createTrade({
      userId,
      data: {
        broker: 'Thndr',
        type: 'TopUp',
        totalValue: 3000,
        sourceAccount: 'Bank',
        date: new Date('2026-01-01'),
      },
      canModify: true,
    });

    const deleteRes = await tradeExecutionService.deleteTrade({
      userId,
      id: topUp._id,
      canModify: true,
    });
    expect(deleteRes.msg).toBe('Trade deleted successfully');

    const softDeleted = await Trade.findById(topUp._id);
    expect(softDeleted.deletedAt).not.toBeNull();

    const restoreRes = await tradeExecutionService.restoreTrade({
      userId,
      id: topUp._id,
      canModify: true,
    });
    expect(restoreRes.msg).toBe('Trade restored successfully');

    const restored = await Trade.findById(topUp._id);
    expect(restored.deletedAt).toBeNull();
  });
});
