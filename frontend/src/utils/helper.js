// Helper functions for various calculations and formatting
// frontend/src/utils/helper.js

// Safe percentage calculation helper
export const safePercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0.00';
    return (((numerator / denominator) - 1) * 100).toFixed(2);
};

export const safePercet = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0.00';
    return (((numerator / denominator) - 1)).toFixed(2);
};

export const safeDivision = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0.00';
    return ((numerator / denominator) * 100).toFixed(2);
};

export const normDiv = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0.00';
    return (numerator / denominator);
}

/**
 * Generic table sorting utility
 * @param {Array} data - The array of objects to sort
 * @param {Object} sortConfig - { key: string|null, direction: 'asc'|'desc' }
 * @param {Function} getSortValue - function(item, key) => any
 * @returns {Array} - Sorted data
 */
export function sortData(data, sortConfig, getSortValue) {
  if (!sortConfig.key) return data;

  const sortableData = [...data];

  return sortableData.sort((a, b) => {
    const aValue = getSortValue(a, sortConfig.key);
    const bValue = getSortValue(b, sortConfig.key);

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Simple toggle for sort direction
 */
export function getNextSortConfig(currentConfig, key) {
  let direction = 'asc';
  if (currentConfig.key === key && currentConfig.direction === 'asc') {
    direction = 'desc';
  }
  return { key, direction };
}