// backend/utils/splitValidator.js

/**
 * Validates a list of split allocations against the transaction value.
 * @param {number} transactionValue
 * @param {Array<{ category: string, amount: number, description?: string }>} [splits]
 * @returns {{ isValid: boolean, error: string | null }}
 */
function validateSplits(transactionValue, splits) {
  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    return { isValid: true, error: null };
  }

  if (typeof transactionValue !== 'number' || isNaN(transactionValue) || transactionValue <= 0) {
    return { isValid: false, error: 'Transaction value must be a positive number' };
  }

  let totalSplitAmount = 0;

  for (let i = 0; i < splits.length; i++) {
    const item = splits[i];

    if (!item || typeof item !== 'object') {
      return { isValid: false, error: `Split item at index ${i} is invalid` };
    }

    if (!item.category || typeof item.category !== 'string' || item.category.trim() === '') {
      return { isValid: false, error: `Split item at index ${i} must have a valid non-empty category` };
    }

    if (typeof item.amount !== 'number' || isNaN(item.amount) || item.amount <= 0) {
      return { isValid: false, error: `Split item for category "${item.category}" must have a positive amount` };
    }

    totalSplitAmount += item.amount;
  }

  // Floating-point difference tolerance (0.01 EGP)
  const difference = Math.abs(totalSplitAmount - transactionValue);
  if (difference > 0.01) {
    return {
      isValid: false,
      error: `Sum of split amounts (${totalSplitAmount.toFixed(2)}) must equal total transaction value (${transactionValue.toFixed(2)})`,
    };
  }

  return { isValid: true, error: null };
}

module.exports = {
  validateSplits,
};
