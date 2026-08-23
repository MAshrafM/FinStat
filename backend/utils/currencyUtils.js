// backend/utils/currencyUtils.js

/**
 * Converts an EGP amount to integer piastres (1 EGP = 100 piastres) to avoid floating-point errors.
 * @param {number|string|null|undefined} egpAmount
 * @returns {number} Integer amount in piastres
 */
const toPiastres = (egpAmount) => {
  if (egpAmount === undefined || egpAmount === null || egpAmount === '') {
    return 0;
  }
  const num = Number(egpAmount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

/**
 * Converts an integer piastres amount back to an EGP decimal number.
 * @param {number|string|null|undefined} piastres
 * @returns {number} EGP amount as decimal number
 */
const fromPiastres = (piastres) => {
  if (piastres === undefined || piastres === null || piastres === '') {
    return 0;
  }
  const num = Number(piastres);
  if (isNaN(num)) return 0;
  return Number((num / 100).toFixed(2));
};

module.exports = {
  toPiastres,
  fromPiastres,
};
