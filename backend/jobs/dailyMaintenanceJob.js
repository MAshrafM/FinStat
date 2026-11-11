// backend/jobs/dailyMaintenanceJob.js
const { runDailyRecurringScan } = require('./recurringJob');
const { runDailyCertificatePayouts } = require('./certificatePayoutJob');

/**
 * Executes all 02:00 AM daily maintenance tasks in sequence:
 * 1. Scans expenditures and updates recurring expense suggestions.
 * 2. Checks active certificates and settles due interest payouts into Bank accounts.
 *
 * Designed to run under a single Vercel Cron invocation (0 2 * * *) to strictly
 * comply with Vercel Hobby plan's 2-cron-job limitation.
 *
 * @param {Date|string} [asOfDate=new Date()]
 * @returns {Promise<{ success: boolean, timestamp: string, recurring: Object, certificatePayouts: Object }>}
 */
async function runDailyMaintenance(asOfDate = new Date()) {
  const runTimestamp = new Date(asOfDate);
  console.log(`[DailyMaintenance] Starting combined maintenance run at ${runTimestamp.toISOString()}...`);

  // 1. Run Recurring Expense Detection
  const recurringResult = { processed: 0, error: null };
  try {
    const scanCount = await runDailyRecurringScan();
    recurringResult.processed = typeof scanCount === 'number' ? scanCount : 0;
  } catch (err) {
    console.error('[DailyMaintenance] Error during recurring scan:', err);
    recurringResult.error = err.message;
  }

  // 2. Run Certificate Interest Payouts
  let certificateResult = { processedCount: 0, totalDisbursedEgp: 0, payouts: [], errors: [] };
  try {
    certificateResult = await runDailyCertificatePayouts(runTimestamp);
  } catch (err) {
    console.error('[DailyMaintenance] Error during certificate payouts:', err);
    certificateResult.errors.push({ fatal: err.message });
  }

  console.log('[DailyMaintenance] Finished combined maintenance run:', {
    recurringProcessed: recurringResult.processed,
    certificatesProcessed: certificateResult.processedCount,
    totalDisbursedEgp: certificateResult.totalDisbursedEgp,
  });

  return {
    success: true,
    timestamp: runTimestamp.toISOString(),
    recurring: recurringResult,
    certificatePayouts: certificateResult,
  };
}

module.exports = {
  runDailyMaintenance,
};

