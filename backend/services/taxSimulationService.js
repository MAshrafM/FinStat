// backend/services/taxSimulationService.js
const TaxBracket = require('../models/TaxBracket');
const SocialInsurance = require('../models/SocialInsurance');
const { calculateProgressiveTax } = require('../utils/taxCalculator');
const { calculateInsurance } = require('../utils/insuranceCalculator');
const { defaultTaxBrackets, defaultSocialInsurance } = require('../utils/seedTaxAndInsurance');

/**
 * Pure simulation sandbox service for Egyptian Statutory Payroll (Law 175/2023 & Law 148/2019).
 * Guaranteed ZERO database persistence.
 *
 * @param {Object} params
 * @param {number} params.grossSalary - Monthly gross salary in EGP
 * @param {number} [params.year] - Target statutory year (defaults to current year)
 * @param {number} [params.customPersonalExemption] - Optional exemption override
 * @param {boolean} [params.includeInsurance=true] - Whether to deduct social insurance
 * @param {boolean} [params.includeMartyrsFund=true] - Whether to deduct martyrs fund
 * @returns {Promise<Object>} Complete simulation breakdown
 */
async function simulateSalaryScenario(params = {}) {
  const targetYear = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  let isFallbackConfig = false;

  // 1. Resolve Tax Bracket configuration
  let taxConfig = null;
  try {
    taxConfig = await TaxBracket.findOne({ year: targetYear, isActive: true }).lean();
    if (!taxConfig) {
      taxConfig = await TaxBracket.findOne({ isActive: true }).sort({ year: -1 }).lean();
    }
  } catch (err) {
    // Database query error handled gracefully
  }

  if (!taxConfig || !Array.isArray(taxConfig.brackets) || taxConfig.brackets.length === 0) {
    const seeded = defaultTaxBrackets.find((t) => t.year === targetYear) || defaultTaxBrackets[0];
    taxConfig = {
      country: 'Egypt',
      year: targetYear,
      personalExemption: seeded?.personalExemption ?? 20000,
      brackets: seeded?.brackets || [],
    };
    isFallbackConfig = true;
  }

  // 2. Resolve Social Insurance configuration
  let siConfig = null;
  try {
    siConfig = await SocialInsurance.findOne({ year: targetYear, isActive: true }).lean();
    if (!siConfig) {
      siConfig = await SocialInsurance.findOne({ isActive: true }).sort({ year: -1 }).lean();
    }
  } catch (err) {
    // Database query error handled gracefully
  }

  if (!siConfig) {
    const seededSI = defaultSocialInsurance.find((s) => s.year === targetYear) || defaultSocialInsurance[0];
    siConfig = {
      country: 'Egypt',
      year: targetYear,
      employeeShare: seededSI?.employeeShare ?? 11,
      employerShare: seededSI?.employerShare ?? 18.75,
      minInsurableIncome: seededSI?.minInsurableIncome ?? 2000,
      maxInsurableIncome: seededSI?.maxInsurableIncome ?? 12600,
    };
  }

  // 3. Compute Gross salary
  const monthlyGross = Math.max(0, Number(params.grossSalary) || 0);
  const annualGross = Math.round(monthlyGross * 12 * 100) / 100;

  // 4. Compute Social Insurance contributions
  const applyInsurance = params.includeInsurance !== false;
  const siCalc = calculateInsurance(monthlyGross, siConfig);
  const monthlyEmployeeSI = applyInsurance ? siCalc.employeeContribution : 0;
  const monthlyEmployerSI = applyInsurance ? siCalc.employerContribution : 0;
  const annualEmployeeSI = Math.round(monthlyEmployeeSI * 12 * 100) / 100;
  const annualEmployerSI = Math.round(monthlyEmployerSI * 12 * 100) / 100;

  // 5. Personal Exemption
  const annualPersonalExemption = params.customPersonalExemption !== undefined
    ? Math.max(0, Number(params.customPersonalExemption) || 0)
    : Number(taxConfig.personalExemption || 20000);
  const monthlyPersonalExemption = Math.round((annualPersonalExemption / 12) * 100) / 100;

  // 6. Net Taxable Base
  const annualNetTaxableBase = Math.max(0, Math.round((annualGross - annualEmployeeSI - annualPersonalExemption) * 100) / 100);
  const monthlyNetTaxableBase = Math.round((annualNetTaxableBase / 12) * 100) / 100;

  // 7. Progressive Tax Slicing
  const taxResult = calculateProgressiveTax(annualNetTaxableBase, taxConfig.brackets);
  const annualIncomeTax = taxResult.annualTax;
  const monthlyIncomeTax = taxResult.monthlyTax;
  const effectiveTaxRate = annualGross > 0 ? Number(((annualIncomeTax / annualGross) * 100).toFixed(2)) : 0;
  const marginalTaxRate = taxResult.matchedBracket ? Number(taxResult.matchedBracket.rate || 0) : 0;

  // 8. Martyrs' Families Fund (Law 4/2021: 0.05% of gross wage)
  const applyMartyrs = params.includeMartyrsFund !== false;
  const monthlyMartyrsFund = applyMartyrs ? Math.round(monthlyGross * 0.0005 * 100) / 100 : 0;
  const annualMartyrsFund = Math.round(monthlyMartyrsFund * 12 * 100) / 100;

  // 9. Monthly Net Take-Home Pay
  const totalMonthlyDeductions = Math.round((monthlyEmployeeSI + monthlyIncomeTax + monthlyMartyrsFund) * 100) / 100;
  const monthlyNetPay = Math.round((monthlyGross - totalMonthlyDeductions) * 100) / 100;
  const annualNetPay = Math.round(monthlyNetPay * 12 * 100) / 100;
  const netToGrossRatio = monthlyGross > 0 ? Number(((monthlyNetPay / monthlyGross) * 100).toFixed(2)) : 0;
  const totalEmployerCost = Math.round((monthlyGross + monthlyEmployerSI) * 100) / 100;

  return {
    success: true,
    appliedYear: targetYear,
    isFallbackConfig,
    effectiveTaxRate,
    marginalTaxRate,
    netToGrossRatio,
    monthly: {
      grossSalary: monthlyGross,
      netPay: monthlyNetPay,
      employeeSI: monthlyEmployeeSI,
      employerSI: monthlyEmployerSI,
      incomeTax: monthlyIncomeTax,
      martyrsFund: monthlyMartyrsFund,
      totalDeductions: totalMonthlyDeductions,
      totalEmployerCost,
      netTaxableBase: monthlyNetTaxableBase,
    },
    annual: {
      grossSalary: annualGross,
      netPay: annualNetPay,
      employeeSI: annualEmployeeSI,
      employerSI: annualEmployerSI,
      incomeTax: annualIncomeTax,
      martyrsFund: annualMartyrsFund,
      totalDeductions: Math.round(totalMonthlyDeductions * 12 * 100) / 100,
      netTaxableBase: annualNetTaxableBase,
    },
    deductions: {
      socialInsurance: {
        rawBase: siCalc.insurableIncome,
        cappedBase: siCalc.cappedInsurableIncome,
        employeeRate: siCalc.employeeShareRate,
        employerRate: siCalc.employerShareRate,
        isCapped: monthlyGross >= (siConfig.maxInsurableIncome || 12600),
        minCap: siConfig.minInsurableIncome || 2000,
        maxCap: siConfig.maxInsurableIncome || 12600,
      },
      personalExemption: {
        annual: annualPersonalExemption,
        monthly: monthlyPersonalExemption,
      },
      martyrsFund: {
        rate: 0.05,
        monthly: monthlyMartyrsFund,
        annual: annualMartyrsFund,
      },
    },
    bracketSlices: taxResult.bracketBreakdown || [],
  };
}

module.exports = {
  simulateSalaryScenario,
};

