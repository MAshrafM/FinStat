// backend/utils/performanceCalculator.js

const DAYS_IN_YEAR = 365.0;
const MAX_ITERATIONS = 100;
const TOLERANCE = 1e-7;

/**
 * Calculates the Net Present Value (NPV) and its derivative for a set of dated cash flows.
 */
function calculateNPVAndDerivative(rate, cashFlows, startDate) {
  let npv = 0;
  let dNpv = 0;

  for (let i = 0; i < cashFlows.length; i++) {
    const { amount, date } = cashFlows[i];
    const diffDays = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const fraction = diffDays / DAYS_IN_YEAR;
    const denominator = Math.pow(1 + rate, fraction);

    if (denominator === 0 || isNaN(denominator) || !isFinite(denominator)) {
      return { npv: NaN, dNpv: NaN };
    }

    npv += amount / denominator;
    if (fraction !== 0) {
      dNpv -= (fraction * amount) / (denominator * (1 + rate));
    }
  }

  return { npv, dNpv };
}

/**
 * Bisection solver fallback when Newton-Raphson encounters non-convergence.
 */
function bisectionXIRR(cashFlows, startDate, low = -0.99, high = 10.0, maxIter = 100) {
  let fLow = calculateNPVAndDerivative(low, cashFlows, startDate).npv;
  let fHigh = calculateNPVAndDerivative(high, cashFlows, startDate).npv;

  if (isNaN(fLow) || isNaN(fHigh) || fLow * fHigh > 0) {
    return null; // Cannot bracket root
  }

  let mid = (low + high) / 2;
  for (let i = 0; i < maxIter; i++) {
    mid = (low + high) / 2;
    const fMid = calculateNPVAndDerivative(mid, cashFlows, startDate).npv;

    if (Math.abs(fMid) < TOLERANCE || (high - low) / 2 < TOLERANCE) {
      return mid;
    }

    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return mid;
}

/**
 * Calculate XIRR (Extended Internal Rate of Return) for arbitrary dated cash flows.
 *
 * @param {Array<{ amount: number, date: Date | string }>} cashFlows
 * @param {number} [initialGuess=0.1]
 * @returns {{ xirr: number | null, rate: number | null, message: string | null }}
 */
function calculateXIRR(cashFlows, initialGuess = 0.1) {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2) {
    return {
      xirr: null,
      rate: null,
      message: 'XIRR requires at least two transactions (investment outflow and terminal valuation).',
    };
  }

  // Sanitize and convert dates
  const sanitized = cashFlows
    .map((cf) => ({
      amount: typeof cf.amount === 'number' && !isNaN(cf.amount) ? cf.amount : 0,
      date: cf.date instanceof Date ? cf.date : new Date(cf.date),
    }))
    .filter((cf) => Math.abs(cf.amount) > 0.0001 && !isNaN(cf.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sanitized.length < 2) {
    return {
      xirr: null,
      rate: null,
      message: 'Insufficient valid cash flow transactions.',
    };
  }

  const startDate = sanitized[0].date;
  const endDate = sanitized[sanitized.length - 1].date;

  if (endDate.getTime() <= startDate.getTime()) {
    return {
      xirr: null,
      rate: null,
      message: 'Transactions must span across distinct dates.',
    };
  }

  let hasNegative = false;
  let hasPositive = false;
  for (const cf of sanitized) {
    if (cf.amount < 0) hasNegative = true;
    if (cf.amount > 0) hasPositive = true;
  }

  if (!hasNegative || !hasPositive) {
    return {
      xirr: null,
      rate: null,
      message: 'XIRR requires both cash outflows (investments) and cash inflows/positive valuation.',
    };
  }

  // Newton-Raphson iteration
  let rate = initialGuess;
  let converged = false;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (rate <= -1) {
      rate = -0.99;
    }

    const { npv, dNpv } = calculateNPVAndDerivative(rate, sanitized, startDate);

    if (isNaN(npv) || isNaN(dNpv) || Math.abs(dNpv) < 1e-12) {
      break; // Derivative too small, try bisection
    }

    const nextRate = rate - npv / dNpv;

    if (Math.abs(nextRate - rate) < TOLERANCE && Math.abs(npv) < 1e-4) {
      rate = nextRate;
      converged = true;
      break;
    }

    rate = nextRate;

    // Guard extreme divergence
    if (rate < -0.999 || rate > 50.0) {
      break;
    }
  }

  // If Newton-Raphson didn't converge, try bounded bisection
  if (!converged || rate < -0.99 || rate > 20.0) {
    const bisectResult = bisectionXIRR(sanitized, startDate, -0.99, 10.0);
    if (bisectResult !== null) {
      rate = bisectResult;
      converged = true;
    }
  }

  if (!converged || isNaN(rate) || !isFinite(rate)) {
    return {
      xirr: null,
      rate: null,
      message: 'XIRR did not converge for the provided cash flows.',
    };
  }

  const roundedXirr = Number((rate * 100).toFixed(2));
  return {
    xirr: roundedXirr,
    rate,
    message: null,
  };
}

/**
 * Calculate Portfolio Total Return & ROI Percentage
 *
 * @param {number} totalInvested
 * @param {number} currentValue
 * @param {number} [realizedPnL=0]
 * @returns {{ roi: number, totalGain: number, unrealizedPnL: number, realizedPnL: number }}
 */
function calculateROI(totalInvested, currentValue, realizedPnL = 0) {
  const invested = typeof totalInvested === 'number' && !isNaN(totalInvested) ? Math.max(0, totalInvested) : 0;
  const current = typeof currentValue === 'number' && !isNaN(currentValue) ? currentValue : 0;
  const realized = typeof realizedPnL === 'number' && !isNaN(realizedPnL) ? realizedPnL : 0;

  const unrealizedPnL = current - invested;
  const totalGain = unrealizedPnL + realized;
  const roi = invested > 0 ? (totalGain / invested) * 100 : 0;

  return {
    roi: Number(roi.toFixed(2)),
    totalGain: Number(totalGain.toFixed(2)),
    unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
    realizedPnL: Number(realized.toFixed(2)),
  };
}

module.exports = {
  calculateXIRR,
  calculateROI,
  calculateNPVAndDerivative,
};
