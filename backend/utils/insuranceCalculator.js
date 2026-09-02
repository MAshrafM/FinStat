// backend/utils/insuranceCalculator.js

/**
 * Calculates social insurance contributions for employee and employer.
 * 
 * @param {number} monthlyInsurableIncome - The insurable monthly income in EGP
 * @param {Object} insuranceConfig - Config object containing { employeeShare, employerShare, minInsurableIncome, maxInsurableIncome }
 * @returns {Object} { insurableIncome, cappedInsurableIncome, employeeContribution, employerContribution, employeeShareRate, employerShareRate }
 */
function calculateInsurance(monthlyInsurableIncome = 0, insuranceConfig = {}) {
  const rawIncome = Math.max(0, Number(monthlyInsurableIncome) || 0);

  if (rawIncome === 0) {
    return {
      insurableIncome: 0,
      cappedInsurableIncome: 0,
      employeeContribution: 0,
      employerContribution: 0,
      employeeShareRate: Number(insuranceConfig.employeeShare) || 11,
      employerShareRate: Number(insuranceConfig.employerShare) || 18.75,
    };
  }

  const minCap = Math.max(0, Number(insuranceConfig.minInsurableIncome) || 0);
  const maxCap = insuranceConfig.maxInsurableIncome !== undefined && insuranceConfig.maxInsurableIncome !== null
    ? Number(insuranceConfig.maxInsurableIncome)
    : Infinity;

  // Apply floor and ceiling
  let capped = rawIncome;
  if (minCap > 0 && capped < minCap) {
    capped = minCap;
  }
  if (maxCap > 0 && capped > maxCap) {
    capped = maxCap;
  }

  const rawEmpShare = Number(insuranceConfig.employeeShare) !== undefined && !isNaN(insuranceConfig.employeeShare)
    ? Number(insuranceConfig.employeeShare)
    : 11;
  const rawEmprShare = Number(insuranceConfig.employerShare) !== undefined && !isNaN(insuranceConfig.employerShare)
    ? Number(insuranceConfig.employerShare)
    : 18.75;

  const empFraction = rawEmpShare > 1 ? rawEmpShare / 100 : rawEmpShare;
  const emprFraction = rawEmprShare > 1 ? rawEmprShare / 100 : rawEmprShare;

  const employeeContribution = Math.round(capped * empFraction * 100) / 100;
  const employerContribution = Math.round(capped * emprFraction * 100) / 100;

  return {
    insurableIncome: Math.round(rawIncome * 100) / 100,
    cappedInsurableIncome: Math.round(capped * 100) / 100,
    employeeContribution,
    employerContribution,
    employeeShareRate: rawEmpShare,
    employerShareRate: rawEmprShare,
  };
}

module.exports = {
  calculateInsurance,
};
