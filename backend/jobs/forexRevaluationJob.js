// backend/jobs/forexRevaluationJob.js
const Currency = require('../models/Currency');
const ForexRateHistory = require('../models/ForexRateHistory');
const { fetchLatestRates, revalueCurrencyHolding } = require('../utils/forexRevaluation');
const { invalidatePortfolioCache } = require('../utils/portfolioService');

/**
 * Runs the daily forex revaluation across all users with active currency holdings.
 * Stores a single consolidated snapshot in ForexRateHistory at UTC midnight.
 *
 * @returns {Promise<Object>} Execution summary
 */
async function runDailyForexRevaluation() {
  console.log('[ForexRevaluationJob] Starting daily forex revaluation run...');

  try {
    const activeUserIds = await Currency.distinct('user', { deletedAt: null });
    console.log(`[ForexRevaluationJob] Found ${activeUserIds.length} user(s) with active currency holdings.`);

    const { rates, rateSource, isStale } = await fetchLatestRates();
    let totalHoldingsUpdated = 0;

    for (const userId of activeUserIds) {
      try {
        const userHoldings = await Currency.find({ user: userId, deletedAt: null });
        for (const holding of userHoldings) {
          revalueCurrencyHolding(holding, rates, { rateSource, isStale });
          await holding.save();
          totalHoldingsUpdated++;
        }
        invalidatePortfolioCache(userId);
      } catch (userErr) {
        console.error(`[ForexRevaluationJob] Error processing user ${userId}:`, userErr.message);
      }
    }

    // Persist a single consolidated UTC midnight snapshot
    if (Object.keys(rates).length > 0) {
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
      console.log(`[ForexRevaluationJob] Stored daily rate snapshot for UTC date ${utcMidnight.toISOString().split('T')[0]}`);
    }

    console.log(
      `[ForexRevaluationJob] Completed. Users processed: ${activeUserIds.length}, Holdings updated: ${totalHoldingsUpdated}`
    );

    return {
      success: true,
      usersProcessed: activeUserIds.length,
      holdingsUpdated: totalHoldingsUpdated,
      rateSource,
      isStale,
      rates,
    };
  } catch (err) {
    console.error('[ForexRevaluationJob] Failed to execute forex revaluation:', err.message);
    throw err;
  }
}

module.exports = {
  runDailyForexRevaluation,
};
