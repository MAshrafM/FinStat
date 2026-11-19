// backend/jobs/certificatePayoutJob.js
const Certificate = require('../models/Certificate');
const { createExpenditureFromCertificateInterest } = require('../utils/incomeBridge');
const { addMonthsClamped } = require('../utils/interestAccrual');
const { invalidatePortfolioCache } = require('../utils/portfolioService');

/**
 * Calculates periodic interest amount for a certificate based on its payoutInterval.
 *
 * @param {Object} certificate
 * @returns {number} Periodic interest amount in EGP rounded to 2 decimal places
 */
function calculatePeriodicInterest(certificate) {
  const principal = Number(
    certificate.amount ??
    (certificate.amountInPiastres ? certificate.amountInPiastres / 100 : 0)
  );
  const annualRate = Number(certificate.interest ?? certificate.interestRate ?? 0);
  const interval = (certificate.payoutInterval || 'monthly').toLowerCase();

  const divisorMap = {
    monthly: 12,
    quarterly: 4,
    annually: 1,
  };
  const divisor = divisorMap[interval] || 12;

  const rawInterest = (principal * (annualRate / 100)) / divisor;
  return Number(rawInterest.toFixed(2));
}

/**
 * Computes next scheduled payout date and interval step for a certificate.
 *
 * @param {Object} cert
 * @returns {{ nextDue: Date, stepMonths: number, interval: string }}
 */
function calculateNextDuePayout(cert) {
  if (!cert) return { nextDue: null, stepMonths: 1, interval: 'monthly' };

  const intervalMonthsMap = {
    monthly: 1,
    quarterly: 3,
    annually: 12,
  };
  const interval = (cert.payoutInterval || cert.payoutFrequency || 'monthly').toLowerCase();
  const stepMonths = intervalMonthsMap[interval] || 1;

  if (cert.status === 'withdrawn' || cert.status === 'matured') {
    return { nextDue: null, stepMonths, interval };
  }

  const rawRef = cert.lastPayoutDate || cert.startDate || cert.issueDate;
  if (!rawRef) {
    return { nextDue: null, stepMonths, interval };
  }

  const referenceDate = new Date(rawRef);
  if (isNaN(referenceDate.getTime())) {
    return { nextDue: null, stepMonths, interval };
  }

  const nextDue = addMonthsClamped(referenceDate, stepMonths);
  return { nextDue, stepMonths, interval };
}

/**
 * Disburses a periodic interest payout for a single certificate:
 * creates the inflow expenditure, advances lastPayoutDate,
 * increments totalInterestPaidInPiastres, marks matured if past maturity,
 * and invalidates portfolio cache.
 *
 * @param {Object} cert - Mongoose Certificate document
 * @param {Object} [options={}]
 * @param {Date|string} [options.payoutDate] - Explicit payout date (defaults to nextDue date or today)
 * @param {number} [options.amount] - Explicit amount (defaults to calculatePeriodicInterest(cert))
 * @param {string} [options.destinationAccount='Bank'] - Target account ('Bank' | 'Cash' | 'Prepaid')
 * @returns {Promise<Object>}
 */
async function disburseCertificatePayout(cert, options = {}) {
  const { nextDue } = calculateNextDuePayout(cert);
  const payoutDate = options.payoutDate ? new Date(options.payoutDate) : nextDue;
  const interestAmount = options.amount !== undefined ? Number(options.amount) : calculatePeriodicInterest(cert);

  if (interestAmount <= 0) {
    throw new Error('Periodic interest amount must be greater than zero');
  }

  const destinationAccount = options.destinationAccount || 'Bank';

  console.log(
    `[CertificatePayoutJob] Disbursing payout for cert "${cert.name}" (${cert._id}): ${interestAmount} EGP (payoutDate: ${payoutDate.toISOString()}, account: ${destinationAccount})`
  );

  const expenditure = await createExpenditureFromCertificateInterest({
    certificate: cert,
    interestAmount,
    payoutDate,
    destinationAccount,
    user: cert.user,
  });

  if (!expenditure) {
    throw new Error('Failed to create ledger entry for certificate interest payout');
  }

  cert.lastPayoutDate = payoutDate;
  const piastres = Math.round(interestAmount * 100);
  cert.totalInterestPaidInPiastres = (cert.totalInterestPaidInPiastres || 0) + piastres;

  // Check if reached maturity
  const maturityDate = cert.maturityDate ? new Date(cert.maturityDate) : null;
  if (maturityDate && payoutDate >= maturityDate) {
    cert.status = 'matured';
  }

  await cert.save();
  invalidatePortfolioCache(cert.user);

  return {
    certificateId: cert._id,
    certificateName: cert.name,
    amount: interestAmount,
    payoutDate,
    destinationAccount,
    expenditureId: expenditure._id,
  };
}

/**
 * Runs the daily certificate interest payout scanner across all active certificates.
 * Identifies certificates whose payout date is due (nextPayoutDate <= asOfDate),
 * creates the inflow ledger deposit via createExpenditureFromCertificateInterest,
 * advances certificate.lastPayoutDate, and updates totalInterestPaidInPiastres.
 *
 * @param {Date|string} [asOfDate=new Date()]
 * @returns {Promise<{ processedCount: number, totalDisbursedEgp: number, payouts: Array, errors: Array }>}
 */
async function runDailyCertificatePayouts(asOfDate = new Date()) {
  const currentDate = new Date(asOfDate);
  // Normalize comparison to end of day in UTC to avoid midnight hour/timezone clipping
  const endOfCurrentDate = new Date(currentDate);
  endOfCurrentDate.setUTCHours(23, 59, 59, 999);

  console.log(`[CertificatePayoutJob] Running daily payout scan as of ${currentDate.toISOString()} (boundary: ${endOfCurrentDate.toISOString()})...`);

  const results = {
    processedCount: 0,
    totalDisbursedEgp: 0,
    payouts: [],
    errors: [],
  };

  try {
    // Only query active, non-deleted certificates where autoReinvest is not true
    const activeCertificates = await Certificate.find({
      status: 'active',
      deletedAt: null,
      autoReinvest: { $ne: true },
    });

    console.log(`[CertificatePayoutJob] Found ${activeCertificates.length} active certificates to evaluate`);

    const intervalMonthsMap = {
      monthly: 1,
      quarterly: 3,
      annually: 12,
    };

    for (const cert of activeCertificates) {
      try {
        const interval = (cert.payoutInterval || 'monthly').toLowerCase();
        const stepMonths = intervalMonthsMap[interval] || 1;

        // Determine reference date: lastPayoutDate if already paid, else startDate / issueDate
        const rawRef = cert.lastPayoutDate || cert.startDate || cert.issueDate;
        if (!rawRef) {
          console.warn(`[CertificatePayoutJob] Skipping cert "${cert.name}" (${cert._id}): missing reference date`);
          continue;
        }
        const referenceDate = new Date(rawRef);
        if (isNaN(referenceDate.getTime())) {
          console.warn(`[CertificatePayoutJob] Skipping cert "${cert.name}" (${cert._id}): invalid reference date`);
          continue;
        }

        // Next due date is referenceDate + stepMonths
        let nextDue = addMonthsClamped(referenceDate, stepMonths);

        // For certificates with no prior lastPayoutDate that may have started multiple cycles ago,
        // fast-forward to find the latest cycle due up to currentDate to avoid flooding past transactions
        if (!cert.lastPayoutDate) {
          while (addMonthsClamped(nextDue, stepMonths) <= endOfCurrentDate) {
            nextDue = addMonthsClamped(nextDue, stepMonths);
          }
        }

        // If next due payout date is on or before end of currentDate, process payout
        if (nextDue <= endOfCurrentDate) {
          // If past maturityDate, check if it reached maturity
          const maturityDate = cert.maturityDate ? new Date(cert.maturityDate) : null;
          if (maturityDate && nextDue > maturityDate) {
            // Certificate reached maturity, skip periodic interest
            cert.status = 'matured';
            await cert.save();
            continue;
          }

          const payout = await disburseCertificatePayout(cert, { payoutDate: nextDue });
          results.processedCount += 1;
          results.totalDisbursedEgp = Number((results.totalDisbursedEgp + payout.amount).toFixed(2));
          results.payouts.push(payout);
        }
      } catch (certErr) {
        console.error(`[CertificatePayoutJob] Error processing certificate ${cert._id}:`, certErr);
        results.errors.push({
          certificateId: cert._id,
          message: certErr.message,
        });
      }
    }

    console.log(
      `[CertificatePayoutJob] Payout scan completed: ${results.processedCount} payouts processed, total disbursed: ${results.totalDisbursedEgp} EGP`
    );
  } catch (err) {
    console.error('[CertificatePayoutJob] Fatal error in daily payout job:', err);
    throw err;
  }

  return results;
}

module.exports = {
  runDailyCertificatePayouts,
  calculatePeriodicInterest,
  calculateNextDuePayout,
  disburseCertificatePayout,
};
