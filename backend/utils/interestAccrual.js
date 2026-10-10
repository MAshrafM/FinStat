// backend/utils/interestAccrual.js

/**
 * Calculates interest accrued on a certificate since the last payout (or since issue date).
 *
 * @param {Object} certificate
 * @param {Date|string} asOfDate
 * @returns {Object} { accruedInterestInPiastres, accruedInterest, daysElapsed, dailyRate, referenceDate }
 */
function calculateAccruedInterest(certificate, asOfDate = new Date()) {
  if (!certificate) {
    return {
      accruedInterestInPiastres: 0,
      accruedInterest: 0,
      daysElapsed: 0,
      dailyRate: 0,
      referenceDate: null,
    };
  }

  const currentDate = new Date(asOfDate);
  const rawRef = certificate.lastPayoutDate || certificate.startDate || certificate.issueDate || currentDate;
  const referenceDate = new Date(rawRef);

  // If certificate status is withdrawn and withdrawalDate exists, cap accrual calculation to withdrawalDate
  const calculationDate = (certificate.status === 'withdrawn' && certificate.withdrawalDate)
    ? new Date(certificate.withdrawalDate)
    : currentDate;

  const diffMs = calculationDate.getTime() - referenceDate.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const annualRate = Number(certificate.interest ?? certificate.interestRate ?? 0);
  const dailyRate = (annualRate / 100) / 365;

  const principal = Number(
    certificate.amount ??
    (certificate.amountInPiastres ? certificate.amountInPiastres / 100 : 0)
  );

  const rawInterest = principal * dailyRate * daysElapsed;
  const accruedInterestInPiastres = Math.round(rawInterest * 100);
  const accruedInterest = Number((accruedInterestInPiastres / 100).toFixed(2));

  return {
    accruedInterestInPiastres,
    accruedInterest,
    daysElapsed,
    dailyRate,
    referenceDate,
  };
}

/**
 * Determines the next scheduled payout date based on payout interval.
 *
 * @param {Object} certificate
 * @param {Date|string} asOfDate
 * @returns {Date|null}
 */
function calculateNextPayoutDate(certificate, asOfDate = new Date()) {
  if (!certificate) return null;

  const currentDate = new Date(asOfDate);
  const rawStart = certificate.lastPayoutDate || certificate.startDate || certificate.issueDate || currentDate;
  const startDate = new Date(rawStart);

  const intervalMonthsMap = {
    monthly: 1,
    quarterly: 3,
    annually: 12,
  };

  const interval = (certificate.payoutInterval || 'monthly').toLowerCase();
  const stepMonths = intervalMonthsMap[interval] || 1;

  let candidateDate = new Date(startDate);
  // Roll forward until after asOfDate
  while (candidateDate <= currentDate) {
    candidateDate.setMonth(candidateDate.getMonth() + stepMonths);
  }

  // Cap at maturityDate if defined
  let maturityDate = certificate.maturityDate ? new Date(certificate.maturityDate) : null;
  if (!maturityDate && certificate.startDate && certificate.period) {
    maturityDate = new Date(certificate.startDate);
    maturityDate.setMonth(maturityDate.getMonth() + Number(certificate.period));
  }

  if (maturityDate && candidateDate > maturityDate) {
    return maturityDate;
  }

  return candidateDate;
}

/**
 * Calculates total lifetime interest earned (historical paid + live accrued).
 *
 * @param {Object} certificate
 * @param {Date|string} asOfDate
 * @returns {Object}
 */
function calculateTotalInterestEarned(certificate, asOfDate = new Date()) {
  const accrual = calculateAccruedInterest(certificate, asOfDate);
  const paidInPiastres = Number(certificate?.totalInterestPaidInPiastres || 0);
  const totalEarnedInPiastres = paidInPiastres + accrual.accruedInterestInPiastres;

  return {
    totalInterestPaidInPiastres: paidInPiastres,
    totalInterestPaid: Number((paidInPiastres / 100).toFixed(2)),
    accruedInterestInPiastres: accrual.accruedInterestInPiastres,
    accruedInterest: accrual.accruedInterest,
    totalEarnedInPiastres,
    totalEarned: Number((totalEarnedInPiastres / 100).toFixed(2)),
  };
}

/**
 * Generates trajectory points for the dual-series chart:
 * - Actual Accrued series: solid line from startDate to today
 * - Projected Accrual series: dashed line from today to maturityDate
 *
 * @param {Object} certificate
 * @param {Date|string} asOfDate
 * @returns {Object} { labels, actualSeries, projectedSeries }
 */
function generateAccrualTrajectory(certificate, asOfDate = new Date()) {
  if (!certificate || !certificate.startDate) {
    return { labels: [], actualSeries: [], projectedSeries: [] };
  }

  const start = new Date(certificate.startDate);
  const now = new Date(asOfDate);
  const period = Number(certificate.period) || 12;

  let maturity = certificate.maturityDate ? new Date(certificate.maturityDate) : new Date(start);
  if (!certificate.maturityDate) {
    maturity.setMonth(maturity.getMonth() + period);
  }

  const annualRate = Number(certificate.interest ?? certificate.interestRate ?? 0);
  const principal = Number(certificate.amount ?? (certificate.amountInPiastres ? certificate.amountInPiastres / 100 : 0));
  const dailyRate = (annualRate / 100) / 365;

  const labels = [];
  const actualSeries = [];
  const projectedSeries = [];

  // Generate 8-12 monthly or periodic checkpoint intervals
  const totalDurationDays = Math.max(1, Math.floor((maturity - start) / (1000 * 60 * 60 * 24)));
  const steps = Math.min(24, Math.max(6, period));
  const stepDays = Math.max(1, Math.floor(totalDurationDays / steps));

  let cursor = new Date(start);
  let reachedToday = false;

  for (let i = 0; i <= steps; i++) {
    const pointDate = i === steps ? new Date(maturity) : new Date(cursor);
    const dateLabel = pointDate.toISOString().split('T')[0];
    labels.push(dateLabel);

    const elapsedDays = Math.max(0, Math.floor((pointDate - start) / (1000 * 60 * 60 * 24)));
    const interestVal = Number((principal * dailyRate * elapsedDays).toFixed(2));

    if (pointDate <= now) {
      actualSeries.push(interestVal);
      projectedSeries.push(null);
    } else {
      if (!reachedToday) {
        // Connect the bridge point so lines touch seamlessly
        const todayElapsedDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
        const bridgeVal = Number((principal * dailyRate * todayElapsedDays).toFixed(2));
        if (actualSeries.length > 0) {
          projectedSeries[actualSeries.length - 1] = actualSeries[actualSeries.length - 1];
        }
        reachedToday = true;
      }
      actualSeries.push(null);
      projectedSeries.push(interestVal);
    }

    cursor.setDate(cursor.getDate() + stepDays);
    if (cursor > maturity && i < steps - 1) break;
  }

  return { labels, actualSeries, projectedSeries };
}

/**
 * Derives the active display status for badges and filters.
 *
 * @param {Object} certificate
 * @param {Date|string} asOfDate
 * @returns {string} 'withdrawn' | 'matured' | 'maturing_soon' | 'active'
 */
function deriveCertificateStatus(certificate, asOfDate = new Date()) {
  if (!certificate) return 'active';
  if (certificate.status === 'withdrawn') return 'withdrawn';

  const now = new Date(asOfDate);
  const start = certificate.startDate ? new Date(certificate.startDate) : null;
  if (start && now < start) {
    return 'future';
  }

  let maturity = certificate.maturityDate ? new Date(certificate.maturityDate) : null;
  if (!maturity && certificate.startDate && certificate.period) {
    maturity = new Date(certificate.startDate);
    maturity.setMonth(maturity.getMonth() + Number(certificate.period));
  }

  if (maturity) {
    if (now >= maturity) {
      return 'matured';
    }
    const daysRemaining = Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 30 && daysRemaining > 0) {
      return 'maturing_soon';
    }
  }

  return certificate.status || 'active';
}

module.exports = {
  calculateAccruedInterest,
  calculateNextPayoutDate,
  calculateTotalInterestEarned,
  generateAccrualTrajectory,
  deriveCertificateStatus,
};
