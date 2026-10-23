// backend/utils/exchangeRateResolver.js
const ForexRateHistory = require('../models/ForexRateHistory');
const { fetchLatestRates } = require('./forexRevaluation');
const { BadRequestError } = require('./errors');

/**
 * Resolves the exchange rate for a transaction:
 * - Base currency (EGP) always returns 1.
 * - Admin override rate is respected if provided.
 * - Historical snapshot within 7 days is prioritized.
 * - Fallback to live rates if transaction is recent (<= 1 day old).
 * - Otherwise throws BadRequestError.
 *
 * @param {string} currency
 * @param {string|Date} dateInput
 * @param {number|null} clientRate
 * @param {string} userRole
 * @returns {Promise<{ rate: number, source: string, snapshotDate?: Date }>}
 */
async function resolveExchangeRate(currency, dateInput, clientRate, userRole) {
  const code = (currency || 'EGP').trim().toUpperCase();
  if (code === 'EGP') {
    return { rate: 1, source: 'base' };
  }

  // Admin override takes precedence if supplied
  if (userRole === 'admin' && clientRate && Number(clientRate) > 0) {
    return { rate: Number(clientRate), source: 'admin_override' };
  }

  const targetDate = dateInput ? new Date(dateInput) : new Date();

  // 1. Check historical ForexRateHistory snapshots (date <= targetDate, descending)
  const snapshot = await ForexRateHistory.findOne({
    date: { $lte: targetDate },
  }).sort({ date: -1 });

  if (snapshot && snapshot.rates) {
    const daysDiff = Math.abs((targetDate.getTime() - new Date(snapshot.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      const rateVal = snapshot.rates instanceof Map ? snapshot.rates.get(code) : snapshot.rates?.[code];
      const rate = Number(rateVal);
      if (rate && rate > 0) {
        return { rate, source: 'historical_snapshot', snapshotDate: snapshot.date };
      }
    }
  }

  // 2. Fallback to live rate if recent transaction (<= 1 day old)
  const daysOld = (Date.now() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld <= 1) {
    try {
      const latest = await fetchLatestRates();
      const ratesMap = latest?.rates || latest;
      const liveRate = Number(ratesMap?.[code]);
      if (liveRate && liveRate > 0) {
        return { rate: liveRate, source: 'live_market' };
      }
    } catch (e) {
      // live fetch error, handled below
    }
  }

  const dateStr = targetDate.toISOString().slice(0, 10);
  throw new BadRequestError(`No exchange rate snapshot available for ${code} on ${dateStr}. Please provide an exchange rate override or ensure exchange rate history is recorded.`);
}

module.exports = {
  resolveExchangeRate,
};
