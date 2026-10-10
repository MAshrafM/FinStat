// backend/utils/forexRevaluation.js
const Currency = require('../models/Currency');
const ForexRateHistory = require('../models/ForexRateHistory');
const marketPriceService = require('./marketPriceService');
const { currencyMap } = require('./currencyMapHelper');
const { invalidatePortfolioCache } = require('./portfolioService');
const { BadRequestError } = require('./errors');

/**
 * Normalizes Currency names or symbols into standard ISO-4217 code (e.g. Dollar -> USD).
 */
function normalizeCurrencyCode(name) {
  if (!name) return 'USD';
  const trimmed = name.trim();
  return currencyMap[trimmed] || trimmed.toUpperCase();
}

/**
 * Fetches latest exchange rates from CIB API via marketPriceService with durable fallback.
 *
 * @returns {Promise<Object>} { rates, rateSource, isStale, timestamp }
 */
async function fetchLatestRates() {
  const ratesRes = await marketPriceService.getCurrencyRates({ forceRefresh: true });
  const rawData = ratesRes?.data;
  const ratesMap = {};

  if (Array.isArray(rawData)) {
    for (const item of rawData) {
      if (!item) continue;
      const code = item.currencyID || item.currency || item.code || item.symbol;
      const rate = Number(item.sellRate ?? item.buyRate ?? item.rate ?? item.price ?? 0);
      if (code && rate > 0) {
        ratesMap[code.toUpperCase()] = rate;
      }
    }
  } else if (rawData && typeof rawData === 'object') {
    const list = rawData.rates || rawData.data || rawData;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (!item) continue;
        const code = item.currencyID || item.currency || item.code || item.symbol;
        const rate = Number(item.sellRate ?? item.buyRate ?? item.rate ?? item.price ?? 0);
        if (code && rate > 0) {
          ratesMap[code.toUpperCase()] = rate;
        }
      }
    } else {
      for (const [k, v] of Object.entries(list)) {
        const rate = Number(v);
        if (!isNaN(rate) && rate > 0) {
          ratesMap[k.toUpperCase()] = rate;
        }
      }
    }
  }

  let rateSource = 'CIB';
  let isStale = Boolean(ratesRes?.isStale);

  // If no rates from market service, attempt latest ForexRateHistory snapshot
  if (Object.keys(ratesMap).length === 0) {
    try {
      const lastSnapshot = await ForexRateHistory.findOne().sort({ date: -1 });
      if (lastSnapshot && lastSnapshot.rates) {
        const snapshotRates = lastSnapshot.rates instanceof Map
          ? Object.fromEntries(lastSnapshot.rates)
          : lastSnapshot.rates;
        Object.assign(ratesMap, snapshotRates);
        rateSource = 'fallback';
        isStale = true;
      }
    } catch (e) {
      // Ignore DB read failure during test mocks
    }
  }

  // Check 24-hour age threshold
  const rateTimestamp = ratesRes?.timestamp || Date.now();
  if (Date.now() - rateTimestamp > 24 * 60 * 60 * 1000) {
    isStale = true;
    if (rateSource === 'CIB') {
      rateSource = 'fallback';
    }
  }

  if (Object.keys(ratesMap).length === 0) {
    throw new BadRequestError('Exchange rate feed is currently unavailable and no historical snapshot found.');
  }

  return {
    rates: ratesMap,
    rateSource,
    isStale,
    timestamp: rateTimestamp,
  };
}

/**
 * Revalues a single currency holding document with the latest rates or manual override.
 *
 * @param {Object} holding - Mongoose document or plain object
 * @param {Object} latestRates - Key-value map of currency rates
 * @param {Object} options - { rateSource, isStale, manualRate }
 * @returns {Object} Updated holding
 */
function revalueCurrencyHolding(holding, latestRates = {}, { rateSource = 'CIB', isStale = false, manualRate = null } = {}) {
  const code = holding.currencyCode || normalizeCurrencyCode(holding.name);
  const amount = Number(holding.amount || 0);

  let purchaseRate = Number(holding.purchaseRate);
  if (!purchaseRate || purchaseRate === 0) {
    purchaseRate = amount > 0 && holding.price ? Number((holding.price / amount).toFixed(4)) : 0;
  }

  let currentRate;
  let finalSource = rateSource;
  let finalStale = isStale;

  if (manualRate !== null && manualRate !== undefined && !isNaN(Number(manualRate))) {
    currentRate = Number(manualRate);
    finalSource = 'manual';
    finalStale = false;
  } else {
    currentRate = Number(latestRates[code] ?? holding.currentRate ?? purchaseRate);
    if (!latestRates[code]) {
      finalSource = 'fallback';
      finalStale = true;
    }
  }

  const currentValueInPiastres = Math.round(amount * currentRate * 100);
  const costBasisInPiastres = holding.priceInPiastres || Math.round(amount * purchaseRate * 100);
  const unrealizedForexGainLossInPiastres = currentValueInPiastres - costBasisInPiastres;

  holding.currencyCode = code;
  holding.purchaseRate = purchaseRate;
  holding.currentRate = currentRate;
  holding.currentValueInPiastres = currentValueInPiastres;
  holding.unrealizedForexGainLossInPiastres = unrealizedForexGainLossInPiastres;
  holding.lastRevaluationDate = new Date();
  holding.rateSource = finalSource;
  holding.isStale = finalStale;

  return holding;
}

/**
 * Revalues all active currency holdings for a user and optionally records a UTC midnight snapshot.
 *
 * @param {string|ObjectId} userId
 * @param {Object} options - { saveSnapshot: boolean }
 * @returns {Promise<Object>} { updated, rates, rateSource, isStale }
 */
async function revalueAllCurrencyHoldings(userId, { saveSnapshot = true } = {}) {
  const holdings = await Currency.find({ user: userId, deletedAt: null });

  const { rates, rateSource, isStale } = await fetchLatestRates();

  for (const holding of holdings) {
    revalueCurrencyHolding(holding, rates, { rateSource, isStale });
    await holding.save();
  }

  if (saveSnapshot && Object.keys(rates).length > 0) {
    try {
      const utcMidnight = new Date();
      utcMidnight.setUTCHours(0, 0, 0, 0);

      await ForexRateHistory.findOneAndUpdate(
        { baseCurrency: 'EGP', date: utcMidnight },
        {
          rates,
          source: rateSource,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      // Log or swallow snapshot upsert errors without failing user revaluation
      console.error('[ForexRevaluation] Snapshot upsert error:', err.message);
    }
  }

  if (userId) {
    invalidatePortfolioCache(userId);
  }

  return {
    updated: holdings.length,
    rates,
    rateSource,
    isStale,
  };
}

module.exports = {
  normalizeCurrencyCode,
  fetchLatestRates,
  revalueCurrencyHolding,
  revalueAllCurrencyHoldings,
};
