// Helper functions for various calculations and formatting
// frontend/src/utils/helper.js

// Safe percentage calculation helper
export const safePercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0.00';
    return (((numerator / denominator) - 1) * 100).toFixed(2);
};

export const safeDivision = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0.00';
    return ((numerator / denominator) * 100).toFixed(2);
};

export const normDiv = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0.00';
    return (numerator / denominator);
}