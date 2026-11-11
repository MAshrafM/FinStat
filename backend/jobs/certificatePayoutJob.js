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
  console.log(`[CertificatePayoutJob] Running daily payout scan as of ${currentDate.toISOString()}...`);

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

        // Determine reference date: lastPayoutDate if already paid, else startDate
        const referenceDate = cert.lastPayoutDate ? new Date(cert.lastPayoutDate) : new Date(cert.startDate);

        // Next due date is referenceDate + stepMonths
        let nextDue = addMonthsClamped(referenceDate, stepMonths);

        // For certificates with no prior lastPayoutDate that may have started multiple cycles ago,
        // fast-forward to find the latest cycle due up to currentDate to avoid flooding past transactions
        if (!cert.lastPayoutDate) {
          while (addMonthsClamped(nextDue, stepMonths) <= currentDate) {
            nextDue = addMonthsClamped(nextDue, stepMonths);
          }
        }

        // If next due payout date is on or before currentDate, process payout
        if (nextDue <= currentDate) {
          // If past maturityDate, check if it reached maturity
          const maturityDate = cert.maturityDate ? new Date(cert.maturityDate) : null;
          if (maturityDate && nextDue > maturityDate) {
            // Certificate reached maturity, skip periodic interest
            cert.status = 'matured';
            await cert.save();
            continue;
          }

          const interestAmount = calculatePeriodicInterest(cert);
          if (interestAmount <= 0) {
            continue;
          }

          console.log(
            `[CertificatePayoutJob] Disbursing payout for cert "${cert.name}" (${cert._id}): ${interestAmount} EGP (due: ${nextDue.toISOString()})`
          );

          const expenditure = await createExpenditureFromCertificateInterest({
            certificate: cert,
            interestAmount,
            payoutDate: nextDue,
            destinationAccount: 'Bank',
            user: cert.user,
          });

          if (expenditure) {
            cert.lastPayoutDate = nextDue;
            const piastres = Math.round(interestAmount * 100);
            cert.totalInterestPaidInPiastres = (cert.totalInterestPaidInPiastres || 0) + piastres;
            await cert.save();

            invalidatePortfolioCache(cert.user);

            results.processedCount += 1;
            results.totalDisbursedEgp = Number((results.totalDisbursedEgp + interestAmount).toFixed(2));
            results.payouts.push({
              certificateId: cert._id,
              certificateName: cert.name,
              amount: interestAmount,
              payoutDate: nextDue,
              expenditureId: expenditure._id,
            });
          }
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
};

