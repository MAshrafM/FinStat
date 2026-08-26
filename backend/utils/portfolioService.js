// backend/utils/portfolioService.js
const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const MutualFundTrade = require('../models/MutualFundTrade');
const Gold = require('../models/Gold');
const Certificate = require('../models/Certificate');
const Currency = require('../models/Currency');
const RealEstate = require('../models/RealEstate');

const marketPriceService = require('./marketPriceService');
const { calculateXIRR, calculateROI } = require('./performanceCalculator');
const { currencyMap } = require('./currencyMapHelper');

// In-memory user portfolio cache (5-minute TTL per user)
const userPortfolioCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Invalidate portfolio cache for a specific user or all users
 */
function invalidatePortfolioCache(userId = null) {
  if (userId) {
    userPortfolioCache.delete(userId.toString());
  } else {
    userPortfolioCache.clear();
  }
}

/**
 * Normalizes Currency Names to standard codes (e.g. Dollar -> USD)
 */
function getNormalizedCurrencyCode(name) {
  if (!name) return 'EGP';
  const trimmed = name.trim();
  return currencyMap[trimmed] || trimmed.toUpperCase();
}

/**
 * Gathers and normalizes all open holdings across all asset classes for a user.
 */
async function getAllHoldings(effectiveUserId, { forceRefresh = false } = {}) {
  const userObjectId = new mongoose.Types.ObjectId(effectiveUserId);
  const holdings = [];

  // Fetch prices in parallel using marketPriceService
  const [stockPricesRes, goldPricesRes, currencyRatesRes] = await Promise.all([
    marketPriceService.getStockPrices({ forceRefresh }),
    marketPriceService.getGoldPrices({ forceRefresh }),
    marketPriceService.getCurrencyRates({ forceRefresh }),
  ]);

  const stockPrices = Array.isArray(stockPricesRes.data)
    ? stockPricesRes.data.reduce((acc, item) => {
        if (item && item.symbol) acc[item.symbol] = Number(item.price) || 0;
        return acc;
      }, {})
    : {};

  const goldPrices = goldPricesRes.data || { '24': 0, '21': 0, '18': 0 };
  const currencyRates = Array.isArray(currencyRatesRes.data) ? currencyRatesRes.data : [];

  // ----------------------------------------------------
  // 1. STOCKS (Equities)
  // ----------------------------------------------------
  const stockSummary = await Trade.aggregate([
    { $match: { user: userObjectId, deletedAt: null } },
    {
      $group: {
        _id: { broker: '$broker', stockCode: '$stockCode', iteration: '$iteration' },
        totalBuyValue: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalValue', 0] } },
        totalSellValue: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$totalValue', 0] } },
        totalSharesBought: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$shares', 0] } },
        totalSharesSold: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$shares', 0] } },
        totalSharesDividend: { $sum: { $cond: [{ $eq: ['$type', 'Dividend'] }, '$shares', 0] } },
        totalFees: { $sum: '$fees' },
      },
    },
    {
      $addFields: {
        currentShares: {
          $subtract: [{ $add: ['$totalSharesBought', '$totalSharesDividend'] }, '$totalSharesSold'],
        },
        avgBuyPrice: {
          $cond: [{ $gt: ['$totalSharesBought', 0] }, { $divide: ['$totalBuyValue', '$totalSharesBought'] }, 0],
        },
      },
    },
    { $match: { currentShares: { $gt: 0 }, '_id.stockCode': { $ne: null } } },
  ]);

  for (const item of stockSummary) {
    const symbol = item._id.stockCode;
    const shares = item.currentShares;
    const avgBuyPrice = item.avgBuyPrice;
    const totalCost = shares * avgBuyPrice;

    let currentPrice = stockPrices[symbol];
    let priceStatus = 'live';

    if (currentPrice && currentPrice > 0) {
      priceStatus = stockPricesRes.isStale ? 'stale' : 'live';
    } else {
      currentPrice = avgBuyPrice;
      priceStatus = 'stale';
    }

    const currentValue = shares * currentPrice;
    const unrealizedPnL = currentValue - totalCost;
    const unrealizedPnLPercentage = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    holdings.push({
      id: `stock_${symbol}_${item._id.broker}_${item._id.iteration || 0}`,
      name: `${symbol} (${item._id.broker})`,
      symbol,
      assetType: 'Stock',
      category: 'Equities',
      quantity: shares,
      unitLabel: 'Shares',
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      currentPrice: Number(currentPrice.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      unrealizedPnLPercentage: Number(unrealizedPnLPercentage.toFixed(2)),
      priceStatus,
      sourceUrl: '/trade-summary',
      updatedAt: new Date(stockPricesRes.timestamp),
    });
  }

  // ----------------------------------------------------
  // 2. MUTUAL FUNDS
  // ----------------------------------------------------
  const mfSummary = await MutualFundTrade.aggregate([
    { $match: { user: userObjectId, deletedAt: null } },
    {
      $group: {
        _id: { code: '$code', name: '$name' },
        totalBuyValue: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalValue', 0] } },
        totalCouponValue: { $sum: { $cond: [{ $eq: ['$type', 'Coupon'] }, '$totalValue', 0] } },
        totalUnitsBought: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$units', 0] } },
        totalUnitsSold: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$units', 0] } },
      },
    },
    {
      $addFields: {
        currentUnits: { $subtract: ['$totalUnitsBought', '$totalUnitsSold'] },
        netInvested: { $subtract: ['$totalBuyValue', '$totalCouponValue'] },
      },
    },
    { $match: { currentUnits: { $gt: 0 } } },
  ]);

  for (const item of mfSummary) {
    const fundName = item._id.name;
    const code = item._id.code;
    const units = item.currentUnits;
    const netInvested = item.netInvested;
    const avgBuyPrice = units > 0 ? netInvested / units : 0;

    let currentPrice = 0;
    let priceStatus = 'stale';

    const fundPriceRes = await marketPriceService.getFundPrice(fundName, { forceRefresh });
    if (fundPriceRes.data && Array.isArray(fundPriceRes.data.rows)) {
      const fundRow = fundPriceRes.data.rows.find((f) => f.name === fundName);
      if (fundRow && fundRow.price > 0) {
        currentPrice = fundRow.price;
        priceStatus = fundPriceRes.isStale ? 'stale' : 'live';
      }
    }

    if (currentPrice <= 0) {
      currentPrice = avgBuyPrice;
      priceStatus = 'stale';
    }

    const currentValue = units * currentPrice;
    const unrealizedPnL = currentValue - netInvested;
    const unrealizedPnLPercentage = netInvested > 0 ? (unrealizedPnL / netInvested) * 100 : 0;

    holdings.push({
      id: `mf_${code}`,
      name: fundName,
      symbol: code,
      assetType: 'Mutual Fund',
      category: 'Mutual Funds',
      quantity: units,
      unitLabel: 'Units',
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      currentPrice: Number(currentPrice.toFixed(2)),
      totalCost: Number(netInvested.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      unrealizedPnLPercentage: Number(unrealizedPnLPercentage.toFixed(2)),
      priceStatus,
      sourceUrl: '/mutual-funds/summary',
      updatedAt: new Date(fundPriceRes.timestamp),
    });
  }

  // ----------------------------------------------------
  // 3. GOLD (Precious Metals)
  // ----------------------------------------------------
  const goldHoldings = await Gold.aggregate([
    { $match: { user: userObjectId, deletedAt: null, status: 'hold' } },
    {
      $group: {
        _id: '$karat',
        totalWeight: { $sum: '$weight' },
        totalPaid: { $sum: '$paid' },
      },
    },
  ]);

  for (const item of goldHoldings) {
    const karat = item._id;
    const weight = item.totalWeight;
    const totalCost = item.totalPaid;
    const avgBuyPrice = weight > 0 ? totalCost / weight : 0;

    let currentPricePerGram = goldPrices[karat] || 0;
    let priceStatus = 'live';

    if (currentPricePerGram > 0) {
      priceStatus = goldPricesRes.isStale ? 'stale' : 'live';
    } else {
      currentPricePerGram = avgBuyPrice;
      priceStatus = 'stale';
    }

    const currentValue = weight * currentPricePerGram;
    const unrealizedPnL = currentValue - totalCost;
    const unrealizedPnLPercentage = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    holdings.push({
      id: `gold_${karat}k`,
      name: `Gold ${karat}K`,
      symbol: `${karat}K Gold`,
      assetType: 'Gold',
      category: 'Precious Metals',
      quantity: weight,
      unitLabel: 'Grams',
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      currentPrice: Number(currentPricePerGram.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      unrealizedPnLPercentage: Number(unrealizedPnLPercentage.toFixed(2)),
      priceStatus,
      sourceUrl: '/gold-wallet/summary',
      updatedAt: new Date(goldPricesRes.timestamp),
    });
  }

  // ----------------------------------------------------
  // 4. BANK CERTIFICATES
  // ----------------------------------------------------
  const certificates = await Certificate.find({ user: userObjectId, deletedAt: null });
  const safeCertificates = Array.isArray(certificates) ? certificates : [];
  for (const cert of safeCertificates) {
    const totalCost = cert.amount;
    const currentValue = cert.amount; // Book principal value
    const annualInterest = cert.interest || 0;
    const periodMonths = cert.period || 12;
    const expectedReturn = totalCost * (1 + (annualInterest / 100) * (periodMonths / 12));

    holdings.push({
      id: `cert_${cert._id}`,
      name: `${cert.name} (${cert.interest}% - ${cert.period}m)`,
      symbol: cert.name,
      assetType: 'Certificate',
      category: 'Fixed Income',
      quantity: 1,
      unitLabel: 'Certificate',
      avgBuyPrice: Number(totalCost.toFixed(2)),
      currentPrice: Number(totalCost.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      unrealizedPnL: Number((expectedReturn - totalCost).toFixed(2)), // Expected maturity yield
      unrealizedPnLPercentage: Number(annualInterest.toFixed(2)),
      priceStatus: 'fixed',
      sourceUrl: '/certificates',
      updatedAt: cert.updatedAt || new Date(),
    });
  }

  // ----------------------------------------------------
  // 5. FOREIGN CURRENCY WALLET
  // ----------------------------------------------------
  const currencyHoldings = await Currency.aggregate([
    { $match: { user: userObjectId, deletedAt: null } },
    {
      $group: {
        _id: '$name',
        totalAmount: { $sum: '$amount' },
        totalPrice: { $sum: '$price' },
      },
    },
    { $match: { totalAmount: { $gt: 0 } } },
  ]);

  for (const curr of currencyHoldings) {
    const currencyName = curr._id;
    const currencyCode = getNormalizedCurrencyCode(currencyName);
    const amount = curr.totalAmount;
    const totalCost = curr.totalPrice;
    const avgBuyPrice = amount > 0 ? totalCost / amount : 0;

    let currentRate = 0;
    let priceStatus = 'live';

    const rateObj = currencyRates.find((r) => r.currencyID === currencyCode);
    if (rateObj && rateObj.sellRate > 0) {
      currentRate = rateObj.sellRate;
      priceStatus = currencyRatesRes.isStale ? 'stale' : 'live';
    } else {
      currentRate = avgBuyPrice;
      priceStatus = 'stale';
    }

    const currentValue = amount * currentRate;
    const unrealizedPnL = currentValue - totalCost;
    const unrealizedPnLPercentage = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    holdings.push({
      id: `currency_${currencyCode}`,
      name: `${currencyName} (${currencyCode})`,
      symbol: currencyCode,
      assetType: 'Currency',
      category: 'Foreign Exchange',
      quantity: amount,
      unitLabel: currencyCode,
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      currentPrice: Number(currentRate.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      unrealizedPnLPercentage: Number(unrealizedPnLPercentage.toFixed(2)),
      priceStatus,
      sourceUrl: '/currency',
      updatedAt: new Date(currencyRatesRes.timestamp),
    });
  }

  // ----------------------------------------------------
  // 6. REAL ESTATE (Manual Valuation Model)
  // ----------------------------------------------------
  const properties = await RealEstate.find({ user: userObjectId, deletedAt: null, status: 'Owned' });
  const safeProperties = Array.isArray(properties) ? properties : [];

  for (const prop of safeProperties) {
    const totalCost = prop.purchasePrice || 0;
    const currentValue = prop.currentValuation || 0;
    const unrealizedPnL = currentValue - totalCost;
    const unrealizedPnLPercentage = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
    const quantity = prop.area > 0 ? prop.area : 1;
    const unitLabel = prop.area > 0 ? 'm²' : 'Property';
    const avgBuyPrice = quantity > 0 ? totalCost / quantity : totalCost;
    const currentPrice = quantity > 0 ? currentValue / quantity : currentValue;

    holdings.push({
      id: `re_${prop._id}`,
      name: `${prop.name}${prop.location ? ` (${prop.location})` : ''}`,
      symbol: prop.type || 'Real Estate',
      assetType: 'Real Estate',
      category: 'Real Estate',
      quantity,
      unitLabel,
      avgBuyPrice: Number(avgBuyPrice.toFixed(2)),
      currentPrice: Number(currentPrice.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      unrealizedPnLPercentage: Number(unrealizedPnLPercentage.toFixed(2)),
      priceStatus: 'manual',
      sourceUrl: '/real-estate',
      updatedAt: prop.updatedAt || new Date(),
    });
  }

  return holdings;
}

/**
 * Extracts dated cash flows from historical transactions across all assets
 * to feed into the XIRR engine.
 */
async function getPortfolioCashFlows(effectiveUserId, totalTerminalValue = 0) {
  const userObjectId = new mongoose.Types.ObjectId(effectiveUserId);
  const cashFlows = [];

  // 1. Trades
  const trades = await Trade.find({ user: userObjectId, deletedAt: null }).select('date type totalValue totalValueInPiastres');
  for (const t of trades) {
    if (t.type === 'Buy' || t.type === 'TopUp') {
      cashFlows.push({ amount: -Math.abs(t.totalValue), date: new Date(t.date) });
    } else if (t.type === 'Sell' || t.type === 'Dividend' || t.type === 'Withdraw') {
      cashFlows.push({ amount: Math.abs(t.totalValue), date: new Date(t.date) });
    }
  }

  // 2. Mutual Funds
  const mfTrades = await MutualFundTrade.find({ user: userObjectId, deletedAt: null }).select('date type totalValue');
  for (const mf of mfTrades) {
    if (mf.type === 'Buy') {
      cashFlows.push({ amount: -Math.abs(mf.totalValue), date: new Date(mf.date) });
    } else if (mf.type === 'Sell' || mf.type === 'Coupon') {
      cashFlows.push({ amount: Math.abs(mf.totalValue), date: new Date(mf.date) });
    }
  }

  // 3. Gold
  const goldLogs = await Gold.find({ user: userObjectId, deletedAt: null }).select('date paid sellingPrice sellingDate status weight');
  for (const g of goldLogs) {
    if (g.paid > 0) {
      cashFlows.push({ amount: -Math.abs(g.paid), date: new Date(g.date) });
    }
    if (g.status === 'sold' && g.sellingPrice > 0 && g.sellingDate) {
      const soldTotal = g.sellingPrice * (g.weight || 1);
      cashFlows.push({ amount: Math.abs(soldTotal), date: new Date(g.sellingDate) });
    }
  }

  // 4. Certificates
  const certs = await Certificate.find({ user: userObjectId, deletedAt: null }).select('startDate amount');
  for (const c of certs) {
    if (c.amount > 0 && c.startDate) {
      cashFlows.push({ amount: -Math.abs(c.amount), date: new Date(c.startDate) });
    }
  }

  // 5. Currency
  const currencies = await Currency.find({ user: userObjectId, deletedAt: null }).select('date price');
  const safeCurrencies = Array.isArray(currencies) ? currencies : [];
  for (const cur of safeCurrencies) {
    if (cur.price > 0 && cur.date) {
      cashFlows.push({ amount: -Math.abs(cur.price), date: new Date(cur.date) });
    }
  }

  // 6. Real Estate
  const realEstates = await RealEstate.find({ user: userObjectId, deletedAt: null }).select('purchaseDate purchasePrice sellingPrice sellingDate status');
  const safeRealEstates = Array.isArray(realEstates) ? realEstates : [];
  for (const re of safeRealEstates) {
    if (re.purchasePrice > 0 && re.purchaseDate) {
      cashFlows.push({ amount: -Math.abs(re.purchasePrice), date: new Date(re.purchaseDate) });
    }
    if (re.status === 'Sold' && re.sellingPrice > 0 && re.sellingDate) {
      cashFlows.push({ amount: Math.abs(re.sellingPrice), date: new Date(re.sellingDate) });
    }
  }

  // 7. Terminal Portfolio Valuation (Today's positive valuation)
  if (totalTerminalValue > 0) {
    cashFlows.push({
      amount: totalTerminalValue,
      date: new Date(),
    });
  }

  return cashFlows;
}

/**
 * Calculates Realized P&L from historical closed trades, sold gold, and sold real estate
 */
async function getRealizedPnL(effectiveUserId) {
  const userObjectId = new mongoose.Types.ObjectId(effectiveUserId);

  // Closed stock positions
  const stockSummary = await Trade.aggregate([
    { $match: { user: userObjectId, deletedAt: null } },
    {
      $group: {
        _id: { broker: '$broker', stockCode: '$stockCode', iteration: '$iteration' },
        totalBuyValue: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalValue', 0] } },
        totalSellValue: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$totalValue', 0] } },
        totalDividendValue: { $sum: { $cond: [{ $eq: ['$type', 'Dividend'] }, '$totalValue', 0] } },
        totalFees: { $sum: '$fees' },
        totalSharesBought: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$shares', 0] } },
        totalSharesSold: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$shares', 0] } },
        totalSharesDividend: { $sum: { $cond: [{ $eq: ['$type', 'Dividend'] }, '$shares', 0] } },
      },
    },
    {
      $addFields: {
        currentShares: {
          $subtract: [{ $add: ['$totalSharesBought', '$totalSharesDividend'] }, '$totalSharesSold'],
        },
        avgBuyPrice: {
          $cond: [{ $gt: ['$totalSharesBought', 0] }, { $divide: ['$totalBuyValue', '$totalSharesBought'] }, 0],
        },
      },
    },
  ]);

  let stockRealizedPnL = 0;
  for (const item of (stockSummary || [])) {
    if (item.totalSharesSold > 0) {
      const costOfSharesSold = item.totalSharesSold * item.avgBuyPrice;
      const realized = item.totalSellValue + item.totalDividendValue - costOfSharesSold - item.totalFees;
      stockRealizedPnL += realized;
    }
  }

  // Sold gold profit
  const goldSold = await Gold.aggregate([
    { $match: { user: userObjectId, deletedAt: null, status: 'sold' } },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$paid' },
        totalSell: { $sum: { $multiply: ['$sellingPrice', '$weight'] } },
      },
    },
  ]);

  const goldRealizedPnL =
    goldSold && goldSold.length > 0 && goldSold[0].totalSell ? goldSold[0].totalSell - goldSold[0].totalPaid : 0;

  // Sold real estate profit
  const realEstateSold = await RealEstate.aggregate([
    { $match: { user: userObjectId, deletedAt: null, status: 'Sold' } },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: '$purchasePrice' },
        totalSell: { $sum: '$sellingPrice' },
      },
    },
  ]);

  const realEstateRealizedPnL =
    realEstateSold && realEstateSold.length > 0 && realEstateSold[0].totalSell
      ? realEstateSold[0].totalSell - realEstateSold[0].totalPaid
      : 0;

  return Number((stockRealizedPnL + goldRealizedPnL + realEstateRealizedPnL).toFixed(2));
}

/**
 * Calculates net stock top ups (total top ups minus withdraws)
 */
async function getStockNetTopUps(effectiveUserId) {
  const userObjectId = new mongoose.Types.ObjectId(effectiveUserId);
  const tradeAgg = await Trade.aggregate([
    { $match: { user: userObjectId, deletedAt: null } },
    {
      $group: {
        _id: null,
        topUps: { $sum: { $cond: [{ $eq: ['$type', 'TopUp'] }, '$totalValue', 0] } },
        withdraws: { $sum: { $cond: [{ $eq: ['$type', 'Withdraw'] }, '$totalValue', 0] } },
      },
    },
  ]);

  if (tradeAgg && tradeAgg.length > 0) {
    const net = tradeAgg[0].topUps - (tradeAgg[0].withdraws || 0);
    return net > 0 ? net : (tradeAgg[0].topUps > 0 ? tradeAgg[0].topUps : 0);
  }
  return 0;
}

/**
 * Calculates Asset Allocation Breakdown (Invested vs Current Valuation)
 * Uses total stock top-up for Stock invested capital if available.
 */
function calculateAssetAllocation(holdings, { stockTopUps = 0 } = {}) {
  const allocationMap = {};
  let totalInvested = 0;
  let totalCurrentValue = 0;

  for (const h of holdings) {
    const type = h.assetType || 'Other';
    if (!allocationMap[type]) {
      allocationMap[type] = {
        assetType: type,
        investedAmount: 0,
        currentValue: 0,
        count: 0,
      };
    }
    allocationMap[type].investedAmount += h.totalCost || 0;
    allocationMap[type].currentValue += h.currentValue || 0;
    allocationMap[type].count += 1;

    totalCurrentValue += h.currentValue || 0;
  }

  // If stockTopUps is provided and > 0, set Stock invested capital to total stock top-up
  if (stockTopUps > 0) {
    if (allocationMap['Stock']) {
      allocationMap['Stock'].investedAmount = stockTopUps;
    } else {
      allocationMap['Stock'] = {
        assetType: 'Stock',
        investedAmount: stockTopUps,
        currentValue: 0,
        count: 0,
      };
    }
  }

  // Compute totalInvested across all asset classes
  for (const key of Object.keys(allocationMap)) {
    totalInvested += allocationMap[key].investedAmount;
  }

  const allocationList = Object.values(allocationMap).map((item) => ({
    assetType: item.assetType,
    investedAmount: Number(item.investedAmount.toFixed(2)),
    currentValue: Number(item.currentValue.toFixed(2)),
    count: item.count,
    investedPercentage:
      totalInvested > 0 ? Number(((item.investedAmount / totalInvested) * 100).toFixed(1)) : 0,
    currentPercentage:
      totalCurrentValue > 0 ? Number(((item.currentValue / totalCurrentValue) * 100).toFixed(1)) : 0,
  }));

  return {
    allocations: allocationList,
    totalInvested: Number(totalInvested.toFixed(2)),
    totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
  };
}

/**
 * High-level unified portfolio summary with caching.
 */
async function getPortfolioSummary(effectiveUserId, { forceRefresh = false } = {}) {
  const cacheKey = effectiveUserId.toString();
  const cached = userPortfolioCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.data, isCached: true };
  }

  const holdings = await getAllHoldings(effectiveUserId, { forceRefresh });
  const realizedPnL = await getRealizedPnL(effectiveUserId);
  const stockTopUps = await getStockNetTopUps(effectiveUserId);
  const allocationData = calculateAssetAllocation(holdings, { stockTopUps });

  const totalInvested = allocationData.totalInvested;
  const totalCurrentValue = allocationData.totalCurrentValue;

  const roiData = calculateROI(totalInvested, totalCurrentValue, realizedPnL);
  const cashFlows = await getPortfolioCashFlows(effectiveUserId, totalCurrentValue);
  const xirrData = calculateXIRR(cashFlows);

  // Determine overall price health status
  const hasStale = holdings.some((h) => h.priceStatus === 'stale');
  const priceHealth = hasStale ? 'stale' : 'live';

  const summary = {
    totalInvested,
    totalCurrentValue,
    unrealizedPnL: roiData.unrealizedPnL,
    realizedPnL,
    totalPnL: roiData.totalGain,
    roiPercentage: roiData.roi,
    xirr: xirrData.xirr,
    xirrMessage: xirrData.message,
    priceHealth,
    holdingsCount: holdings.length,
    allocations: allocationData.allocations,
    lastCalculatedAt: new Date(),
  };

  userPortfolioCache.set(cacheKey, { data: summary, timestamp: Date.now() });

  return { ...summary, isCached: false };
}

module.exports = {
  getAllHoldings,
  getPortfolioSummary,
  getPortfolioCashFlows,
  getRealizedPnL,
  calculateAssetAllocation,
  getStockNetTopUps,
  invalidatePortfolioCache,
};
