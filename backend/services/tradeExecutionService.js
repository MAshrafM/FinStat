// backend/services/tradeExecutionService.js
const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const User = require('../models/User');
const CorporateAction = require('../models/CorporateAction');
const { calculateCostBasis } = require('../utils/costBasisEngine');
const { applyCorporateActions, createSplitWizard } = require('../utils/corporateActionEngine');
const marketPriceService = require('../utils/marketPriceService');
const { invalidatePortfolioCache } = require('../utils/portfolioService');
const { validateAvailableShares } = require('../utils/tradeValidator');
const {
  createExpenditureFromBrokerTopUp,
  createExpenditureFromBrokerWithdraw,
  reverseIncomeExpenditure,
  syncBrokerTradeExpenditure,
} = require('../utils/incomeBridge');
const { toPiastres } = require('../utils/currencyUtils');
const { escapeRegex } = require('../utils/requestHelpers');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

/**
 * Retrieves paginated list of active trades for user with optional filters.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Object} [params.query]
 * @returns {Promise<{ data: Array, totalPages: number, page: number }>}
 */
const listTrades = async ({ userId, query = {} }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 25;
  const skip = (page - 1) * limit;

  const mongoQuery = { user: userId, deletedAt: null };
  if (query.broker && query.broker !== 'TopUp') {
    mongoQuery.broker = query.broker;
  } else if (query.broker === 'TopUp') {
    mongoQuery.type = 'TopUp';
  }

  if (query.search && query.search.trim()) {
    const safeSearch = escapeRegex(query.search).slice(0, 100);
    mongoQuery.stockCode = { $regex: safeSearch, $options: 'i' };
  }

  const trades = await Trade.find(mongoQuery)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Trade.countDocuments(mongoQuery);

  return {
    data: trades,
    totalPages: Math.ceil(total / limit),
    page,
  };
};

/**
 * Retrieves all active trades without pagination (clamped to 1000 lean docs).
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} [params.requestedLimit]
 * @returns {Promise<{ trades: Array, truncated: boolean }>}
 */
const getAllTrades = async ({ userId, requestedLimit }) => {
  const parsedLimit = parseInt(requestedLimit, 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 1000) : 1000;

  const raw = await Trade.find({ user: userId, deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const truncated = raw.length > limit;
  if (truncated) raw.pop();

  return { trades: raw, truncated };
};

/**
 * Generates portfolio summary grouped by broker, stock, and iteration with cost-basis calculations.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @returns {Promise<Array>}
 */
const getPortfolioSummary = async ({ userId }) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const userDoc = await User.findById(userObjectId).select('costBasisMethod');
  const costBasisMethod = userDoc?.costBasisMethod || 'average';

  const [corporateActions, rawTrades] = await Promise.all([
    CorporateAction.find({ user: userObjectId, deletedAt: null }),
    Trade.find({ user: userObjectId, deletedAt: null }).sort({ date: 1, createdAt: 1 }),
  ]);

  const adjustedTrades = applyCorporateActions(rawTrades, corporateActions);

  // Group by broker, stockCode, iteration
  const groupMap = new Map();
  for (const t of adjustedTrades) {
    if (!t.stockCode) continue;
    const iter = t.iteration !== undefined && t.iteration !== null ? t.iteration : 0;
    const key = `${t.broker}_${t.stockCode}_${iter}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        broker: t.broker,
        stockCode: t.stockCode,
        iteration: iter,
        trades: [],
      });
    }
    groupMap.get(key).trades.push(t);
  }

  const summary = [];
  for (const group of groupMap.values()) {
    const iterTrades = group.trades;
    const costResult = calculateCostBasis(iterTrades, costBasisMethod);

    const firstTradeDate = iterTrades[0]?.date || null;
    const lastTradeDate = iterTrades[iterTrades.length - 1]?.date || null;
    const tradeCount = iterTrades.length;

    summary.push({
      _id: {
        broker: group.broker,
        stockCode: group.stockCode,
        iteration: group.iteration,
      },
      costBasisMethod,
      totalBuyValue: costResult.totalBuyValue,
      totalSellValue: costResult.totalSellValue,
      totalDividendValue: costResult.totalDividendValue,
      totalSharesBought: costResult.totalSharesBought,
      totalSharesSold: costResult.totalSharesSold,
      totalSharesDividend: costResult.totalSharesDividend,
      totalFees: costResult.totalFees,
      tradeCount,
      firstTradeDate,
      lastTradeDate,
      currentShares: costResult.currentShares,
      averageBuyPrice: costResult.averageBuyPrice,
      adjustedAvgPrice: costResult.adjustedAvgPrice,
      costOfSoldShares: costResult.costOfSoldShares,
      netBreakEvenPrice: costResult.netBreakEvenPrice,
      tradingPL: costResult.tradingPL,
      dividendIncome: costResult.totalDividendValue,
      totalRealizedReturn: costResult.totalRealizedReturn,
      totDeals: Number((costResult.totalBuyValue - (costResult.totalSellValue + costResult.totalDividendValue)).toFixed(2)),
      investedAmountRemaining: costResult.remainingCostBasis,
      status: costResult.currentShares === 0 ? 'Closed' : 'Open',
    });
  }

  // Sort summary
  summary.sort((a, b) => {
    if (a._id.stockCode < b._id.stockCode) return -1;
    if (a._id.stockCode > b._id.stockCode) return 1;
    return new Date(b.lastTradeDate) - new Date(a.lastTradeDate);
  });

  return summary;
};

/**
 * Logs a stock split trade + corporate action record via wizard.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {string} params.ticker
 * @param {string} params.broker
 * @param {number} params.splitRatio
 * @param {Date|string} params.splitDate
 * @param {boolean} params.canModify
 * @returns {Promise<Object>}
 */
const executeStockSplit = async ({ userId, ticker, broker, splitRatio, splitDate, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  return createSplitWizard(userId, {
    stockCode: ticker,
    broker,
    type: 'split',
    ratio: splitRatio || 1,
    effectiveDate: splitDate,
    notes: 'Logged via Trade Split entry',
    logTrade: true,
  });
};

/**
 * Applies corporate action wizard retroactively.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Object} params.data
 * @param {boolean} params.canModify
 * @returns {Promise<Object>}
 */
const executeCorporateAction = async ({ userId, data, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  return createSplitWizard(userId, data);
};

/**
 * Retrieves market prices from price service.
 * @param {Object} [params]
 * @param {boolean} [params.forceRefresh]
 * @returns {Promise<Object>}
 */
const getMarketPrices = async ({ forceRefresh = false } = {}) => {
  const result = await marketPriceService.getStockPrices({ forceRefresh });
  return result.data;
};

/**
 * Creates a new trade and manages bridge expenditures and cache invalidation.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Object} params.data
 * @param {boolean} params.canModify
 * @returns {Promise<Trade>}
 */
const createTrade = async ({ userId, data, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  if (data.type === 'Sell') {
    const validation = await validateAvailableShares(
      userId,
      data.broker,
      data.stockCode,
      data.shares
    );
    if (!validation.valid) {
      throw new BadRequestError(validation.message);
    }
  }

  const newTrade = new Trade({
    ...data,
    user: userId,
    priceInPiastres: toPiastres(data.price),
    feesInPiastres: toPiastres(data.fees),
    totalValueInPiastres: toPiastres(data.totalValue),
  });
  await newTrade.save();

  if (newTrade.type === 'TopUp') {
    await createExpenditureFromBrokerTopUp({
      trade: newTrade,
      sourceAccount: data.sourceAccount,
      user: userId,
    });
  } else if (newTrade.type === 'Withdraw') {
    await createExpenditureFromBrokerWithdraw({
      trade: newTrade,
      destinationAccount: data.destinationAccount,
      user: userId,
    });
  }

  invalidatePortfolioCache(userId);
  return newTrade;
};

/**
 * Retrieves paginated soft-deleted trades.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=25]
 * @returns {Promise<{ data: Array, total: number, page: number, totalPages: number }>}
 */
const getDeletedTrades = async ({ userId, page = 1, limit = 25 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
  const skip = (parsedPage - 1) * parsedLimit;

  const query = { user: userId, deletedAt: { $ne: null } };
  const total = await Trade.countDocuments(query);
  const trades = await Trade.find(query)
    .sort({ deletedAt: -1, _id: -1 })
    .skip(skip)
    .limit(parsedLimit);

  return {
    data: trades,
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit),
  };
};

/**
 * Retrieves a single active trade by ID.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @returns {Promise<Trade>}
 */
const getTradeById = async ({ userId, id }) => {
  const trade = await Trade.findOne({ _id: id, user: userId, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }
  return trade;
};

/**
 * Updates a trade with available shares validation and bridge sync.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {Object} params.data
 * @param {boolean} params.canModify
 * @returns {Promise<Trade>}
 */
const updateTrade = async ({ userId, id, data, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  let trade = await Trade.findOne({ _id: id, user: userId, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }

  const targetType = data.type !== undefined ? data.type : trade.type;
  if (targetType === 'Sell') {
    const targetBroker = data.broker || trade.broker;
    const targetStock = data.stockCode || trade.stockCode;
    const targetShares = data.shares !== undefined ? data.shares : trade.shares;

    const validation = await validateAvailableShares(
      userId,
      targetBroker,
      targetStock,
      targetShares,
      trade._id
    );
    if (!validation.valid) {
      throw new BadRequestError(validation.message);
    }
  }

  const updateData = { ...data };
  if (data.price !== undefined) {
    updateData.priceInPiastres = toPiastres(data.price);
  }
  if (data.fees !== undefined) {
    updateData.feesInPiastres = toPiastres(data.fees);
  }
  if (data.totalValue !== undefined) {
    updateData.totalValueInPiastres = toPiastres(data.totalValue);
  }

  trade = await Trade.findOneAndUpdate(
    { _id: id, user: userId, deletedAt: null },
    updateData,
    { new: true, runValidators: true }
  );

  if (trade.linkedExpenditureId) {
    await syncBrokerTradeExpenditure({
      trade,
      updateData: data,
      user: userId,
    });
  }

  invalidatePortfolioCache(userId);
  return trade;
};

/**
 * Soft deletes a trade, reverses linked bridge expenditure, and invalidates cache.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string }>}
 */
const deleteTrade = async ({ userId, id, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const trade = await Trade.findOne({ _id: id, user: userId, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }

  if (trade.linkedExpenditureId) {
    await reverseIncomeExpenditure(trade.linkedExpenditureId, userId);
  }

  await trade.softDelete();
  invalidatePortfolioCache(userId);
  return { msg: 'Trade deleted successfully' };
};

/**
 * Restores a soft-deleted trade, restores bridge expenditure, and invalidates cache.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string, trade: Trade }>}
 */
const restoreTrade = async ({ userId, id, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const trade = await Trade.findOne({ _id: id, user: userId, deletedAt: { $ne: null } });
  if (!trade) {
    throw new NotFoundError('Soft-deleted trade not found');
  }

  await trade.restore();

  if (trade.type === 'TopUp') {
    await createExpenditureFromBrokerTopUp({
      trade,
      sourceAccount: trade.sourceAccount,
      user: userId,
    });
  } else if (trade.type === 'Withdraw') {
    await createExpenditureFromBrokerWithdraw({
      trade,
      destinationAccount: trade.destinationAccount,
      user: userId,
    });
  }

  invalidatePortfolioCache(userId);
  return { msg: 'Trade restored successfully', trade };
};

module.exports = {
  listTrades,
  getAllTrades,
  getPortfolioSummary,
  executeStockSplit,
  executeCorporateAction,
  getMarketPrices,
  createTrade,
  getDeletedTrades,
  getTradeById,
  updateTrade,
  deleteTrade,
  restoreTrade,
};
