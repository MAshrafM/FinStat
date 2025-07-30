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

/**
 * Formats a date string or Date object into DD/MM/YYYY format.
 * @param {string | Date} dateInput - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  // Get UTC parts to avoid timezone issues
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date for use in an HTML date input (YYYY-MM-DD).
 * @param {string | Date} dateInput - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDateForInput = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toISOString().split('T')[0];
};