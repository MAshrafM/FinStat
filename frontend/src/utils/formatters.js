// frontend/src/utils/formatters.js

/**
 * Formats a number as a US dollar currency string with comma separators.
 * Example: 1234.56 -> "$1,234.56"
 * @param {number} amount The number to format.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount) => {
  // Ensure we are working with a valid number, default to 0 if not.
  const number = typeof amount === 'number' ? amount : 0;

  // Use the built-in Intl.NumberFormat for robust, locale-aware formatting.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number);
};
