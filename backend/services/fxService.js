// backend/services/fxService.js
const portfolioService = require('../utils/portfolioService');
const marketPriceService = require('../utils/marketPriceService');
const forexRevaluation = require('../utils/forexRevaluation');
const Expenditure = require('../models/Expenditure');
const Currency = require('../models/Currency');
const ForexRateHistory = require('../models/ForexRateHistory');

/**
 * Calculates current purchasing power in 24K gold grams and USD,
 * compiles a historical timeline of purchasing power,
 * and provides mark-to-market valuations for foreign currency positions.
 *
 * @param {string|ObjectId} userId - User or managed tenant ID
 * @param {Object} options - { forceRefresh, limit }
 * @returns {Promise<Object>} { current, timeline, currencyHoldings }
 */
async function calculatePurchasingPower(userId, options = {}) {
  // 1. Portfolio summary (invested capital and broker cash)
  let portfolioSummary = { totalCurrentValue: 0, netBrokerCash: 0 };
  try {
    portfolioSummary = await portfolioService.getPortfolioSummary(userId, {
      forceRefresh: Boolean(options.forceRefresh),
    });
  } catch (err) {
    // If portfolio calculation fails or has no holdings, default to zero
  }

  // 2. Liquid bank & cash balances from latest active Expenditure
  const latestExp = await Expenditure.findOne({ user: userId, deletedAt: null })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const liquidBalances = latestExp?.runningBalancesInPiastres
    ? ((latestExp.runningBalancesInPiastres.bank || 0) +
       (latestExp.runningBalancesInPiastres.cash || 0) +
       (latestExp.runningBalancesInPiastres.prepaid || 0)) / 100
    : 0;

  const totalCurrentInvested = Number(portfolioSummary?.totalCurrentValue || 0);
  const totalBrokerCash = Number(portfolioSummary?.netBrokerCash || 0);
  const netWorthEgp = Number((totalCurrentInvested + totalBrokerCash + liquidBalances).toFixed(2));

  // 3. Current 24K Gold Price per gram
  let price24k = 0;
  let goldPriceStatus = 'live';
  let goldPriceSource = 'unknown';
  try {
    const goldRes = await marketPriceService.getGoldPrices({
      forceRefresh: Boolean(options.forceRefresh),
    });
    price24k = Number(goldRes?.data?.['24'] || 0);
    goldPriceStatus = goldRes?.isStale ? 'stale' : 'live';
    goldPriceSource = goldRes?.source || 'market-price-service';
  } catch (err) {
    goldPriceStatus = 'stale';
  }

  // 4. Current Exchange Rates (USD & other currencies)
  let usdRate = 0;
  let usdRateStatus = 'live';
  let forexSource = 'CIB';
  let ratesMap = {};
  try {
    const ratesRes = await forexRevaluation.fetchLatestRates();
    ratesMap = ratesRes?.rates || {};
    usdRate = Number(ratesMap['USD'] || 0);
    usdRateStatus = ratesRes?.isStale ? 'stale' : 'live';
    forexSource = ratesRes?.rateSource || 'CIB';
  } catch (err) {
    usdRateStatus = 'stale';
  }

  // 5. Purchasing Power calculations (zero-safe, non-NaN)
  const purchasingPowerGoldGrams = price24k > 0 ? Number((netWorthEgp / price24k).toFixed(2)) : 0;
  const purchasingPowerUsd = usdRate > 0 ? Number((netWorthEgp / usdRate).toFixed(2)) : 0;

  // 6. Historical timeline (latest 90 snapshots, reversed for chronological order)
  const limit = Math.min(365, Math.max(1, parseInt(options.limit, 10) || 90));
  const rawSnapshots = await ForexRateHistory.find({ baseCurrency: 'EGP' })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  const chronologicalSnapshots = rawSnapshots.reverse();
  const timeline = chronologicalSnapshots.map((s) => {
    const snapRates = s.rates instanceof Map ? Object.fromEntries(s.rates) : (s.rates || {});
    const rateUsd = Number(snapRates['USD'] || 0);

    // Dynamic historical gold estimate: parity with current gold / USD ratio
    const histGold24k = (usdRate > 0 && rateUsd > 0 && price24k > 0)
      ? Number((price24k * (rateUsd / usdRate)).toFixed(2))
      : price24k;

    const pGold = histGold24k > 0 ? Number((netWorthEgp / histGold24k).toFixed(2)) : 0;
    const pUsd = rateUsd > 0 ? Number((netWorthEgp / rateUsd).toFixed(2)) : 0;

    return {
      date: s.date,
      usdRate: rateUsd,
      goldPrice24k: histGold24k,
      purchasingPowerGoldGrams: pGold,
      purchasingPowerUsd: pUsd,
      netWorthEgp,
    };
  });

  // 7. Mark-to-Market Foreign Currency Holdings (GAP-014)
  const activeCurrencies = await Currency.find({ user: userId, deletedAt: null })
    .sort({ date: -1 })
    .lean();

  const currencyHoldings = activeCurrencies.map((c) => {
    const code = (c.currencyCode || c.name || '').toUpperCase().trim();
    const currentRate = Number(ratesMap[code] || c.currentRate || c.purchaseRate || 0);
    const amount = Number(c.amount || 0);
    const purchaseRate = Number(c.purchaseRate || (amount > 0 && c.price ? c.price / amount : 0));
    const costBasisEgp = Number(
      (c.priceInPiastres ? c.priceInPiastres / 100 : c.price || amount * purchaseRate).toFixed(2)
    );
    const currentValueEgp = Number((amount * currentRate).toFixed(2));
    const currentValueUsd = usdRate > 0 ? Number((currentValueEgp / usdRate).toFixed(2)) : (code === 'USD' ? amount : 0);
    const unrealizedGainLossEgp = Number((currentValueEgp - costBasisEgp).toFixed(2));
    const unrealizedGainLossPercentage =
      costBasisEgp > 0 ? Number(((unrealizedGainLossEgp / costBasisEgp) * 100).toFixed(2)) : 0;

    return {
      _id: c._id,
      name: c.name,
      currencyCode: code,
      amount,
      purchaseRate,
      currentRate,
      costBasisEgp,
      currentValueEgp,
      currentValueUsd,
      unrealizedGainLossEgp,
      unrealizedGainLossPercentage,
      date: c.date,
    };
  });

  return {
    current: {
      netWorthEgp,
      goldPrice24k: price24k,
      usdRate,
      purchasingPowerGoldGrams,
      purchasingPowerUsd,
      goldPriceStatus,
      goldPriceSource,
      usdRateStatus,
      forexSource,
    },
    timeline,
    currencyHoldings,
  };
}

module.exports = {
  calculatePurchasingPower,
};

