// backend/utils/installmentAmortization.js

/**
 * Calculates exact amortization breakdown for a credit card installment transaction.
 * Uses integer piastres to eliminate fractional penny / piastre drift.
 *
 * @param {Object} transaction
 * @returns {Object} Amortization breakdown
 */
function calculateInstallmentSchedule(transaction) {
  if (!transaction) return null;

  const totalInPiastres = transaction.amountInPiastres ??
    (transaction.amount != null ? Math.round(transaction.amount * 100) : 0);

  const paidInPiastres = transaction.paidAmountInPiastres ??
    (transaction.paidAmount != null ? Math.round(transaction.paidAmount * 100) : 0);

  const totalMonths = transaction.installmentDetails?.months || 1;

  // Remainder allocation in piastres:
  const baseMonthlyPiastres = Math.floor(totalInPiastres / totalMonths);
  const remainderPiastres = totalInPiastres % totalMonths;

  // Schedule of monthly payments (piastres and EGP)
  const schedule = [];
  for (let m = 1; m <= totalMonths; m++) {
    const monthlyPiastres = m === 1 ? baseMonthlyPiastres + remainderPiastres : baseMonthlyPiastres;
    schedule.push({
      month: m,
      amountInPiastres: monthlyPiastres,
      amount: Number((monthlyPiastres / 100).toFixed(2)),
    });
  }

  // Monthly principal in piastres
  const monthlyInPiastres = transaction.installmentDetails?.monthlyPrincipalInPiastres ??
    (transaction.installmentDetails?.monthlyPrincipal != null
      ? Math.round(transaction.installmentDetails.monthlyPrincipal * 100)
      : (schedule[0]?.amountInPiastres || 0));

  const remainingPrincipalInPiastres = Math.max(0, totalInPiastres - paidInPiastres);
  const remainingPrincipal = Number((remainingPrincipalInPiastres / 100).toFixed(2));

  // Term-based months paid:
  const monthsPaid = monthlyInPiastres > 0
    ? Math.min(totalMonths, Math.floor(paidInPiastres / monthlyInPiastres))
    : 0;
  const remainingMonths = Math.max(0, totalMonths - monthsPaid);

  // Cycle payment status:
  const cyclePaidInPiastres = transaction.installmentDetails?.cyclePaidInPiastres ?? 0;
  const isCycleSatisfied = cyclePaidInPiastres >= monthlyInPiastres;

  // Projected completion date
  let projectedCompletionDate = null;
  if (transaction.date && remainingMonths > 0) {
    const startDate = new Date(transaction.date);
    projectedCompletionDate = new Date(startDate.getFullYear(), startDate.getMonth() + totalMonths, startDate.getDate());
  }

  return {
    totalInPiastres,
    totalAmount: Number((totalInPiastres / 100).toFixed(2)),
    paidInPiastres,
    paidAmount: Number((paidInPiastres / 100).toFixed(2)),
    remainingPrincipalInPiastres,
    remainingPrincipal,
    totalMonths,
    monthsPaid,
    remainingMonths,
    monthlyPrincipalInPiastres: monthlyInPiastres,
    monthlyPrincipal: Number((monthlyInPiastres / 100).toFixed(2)),
    cyclePaidInPiastres,
    isCycleSatisfied,
    schedule,
    projectedCompletionDate,
  };
}

module.exports = { calculateInstallmentSchedule };
