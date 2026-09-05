// backend/jobs/recurringJob.js
const cron = require('node-cron');
const Expenditure = require('../models/Expenditure');
const { detectRecurring } = require('../utils/recurringDetector');

let recurringTask = null;

/**
 * Runs the recurring detection scan across active users who created/modified expenditures in the last 90 days.
 */
async function runDailyRecurringScan() {
  console.log('[RecurringJob] Starting daily recurring expense detection scan...');
  try {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const activeUserIds = await Expenditure.distinct('user', {
      date: { $gte: cutoffDate },
      deletedAt: null,
    });

    console.log(`[RecurringJob] Found ${activeUserIds.length} active users to process`);

    let totalSuggestionsGenerated = 0;
    for (const userId of activeUserIds) {
      try {
        const suggestions = await detectRecurring(userId);
        totalSuggestionsGenerated += suggestions.length;
      } catch (userErr) {
        console.error(`[RecurringJob] Error processing user ${userId}:`, userErr.message);
      }
    }

    console.log(
      `[RecurringJob] Completed daily recurring scan. Total suggestions processed: ${totalSuggestionsGenerated}`
    );
  } catch (err) {
    console.error('[RecurringJob] Failed to execute recurring expense scan:', err);
  }
}

/**
 * Initializes the daily cron job at 2:00 AM.
 */
function initRecurringCron() {
  if (process.env.NODE_ENV === 'test') {
    return null; // Skip scheduling during automated test runs
  }

  // 0 2 * * * = Every day at 02:00 AM
  recurringTask = cron.schedule('0 2 * * *', async () => {
    await runDailyRecurringScan();
  });

  console.log('[RecurringJob] Scheduled recurring expense detection job (Daily at 2:00 AM)');
  return recurringTask;
}

/**
 * Stops the scheduled cron job.
 */
function stopRecurringCron() {
  if (recurringTask) {
    recurringTask.stop();
    recurringTask = null;
  }
}

module.exports = {
  initRecurringCron,
  stopRecurringCron,
  runDailyRecurringScan,
};
