// backend/utils/salaryCalculator.js
const { calculateTax } = require('./taxCalculator');
const { calculateInsurance } = require('./insuranceCalculator');

/**
 * Calculates salary preview using the Company Cumulative YTD Gross Model & Special Disbursement Types.
 * 
 * @param {Array} components - Array of component objects [{ name, type, value, calculationBasis, category, isTaxable, isInsurable, isActive }]
 * @param {Object} taxConfig - Object with { brackets, personalExemption }
 * @param {Object} insuranceConfig - Object with { employeeShare, employerShare, minInsurableIncome, maxInsurableIncome }
 * @param {Object} options - Options: { disbursementType, multiplier, unitRate, priorYtdGross, includeTax, includeInsurance, includeMartyrsFund }
 * @returns {Object} Structured salary calculation breakdown
 */
function calculatePreview(components = [], taxConfig = {}, insuranceConfig = {}, options = {}) {
  const disbursementType = options.disbursementType || 'Regular';
  const multiplier = Number(options.multiplier) > 0 ? Number(options.multiplier) : 1;
  const unitRate = Number(options.unitRate) || 0;
  const priorYtdGross = Math.max(0, Number(options.priorYtdGross) || 0);

  // Set preset default deduction rules based on disbursement type if not explicitly overridden
  let defaultIncludeTax = true;
  let defaultIncludeInsurance = true;
  let defaultIncludeMartyrsFund = true;

  if (disbursementType === 'Bond Distribution' || disbursementType === 'End of Year Bonus' || disbursementType === 'Prepaid') {
    defaultIncludeTax = false;
    defaultIncludeInsurance = false;
    defaultIncludeMartyrsFund = false;
  } else if (
    disbursementType === 'Basic Months' ||
    disbursementType === 'Basic Production' ||
    disbursementType === 'Sector Bonus' ||
    disbursementType === 'Individual Bonus' ||
    disbursementType === 'Surplus'
  ) {
    defaultIncludeTax = true;
    defaultIncludeInsurance = false;
    defaultIncludeMartyrsFund = false;
  }

  const includeTax = options.includeTax !== undefined ? Boolean(options.includeTax) : defaultIncludeTax;
  const includeInsurance = options.includeInsurance !== undefined ? Boolean(options.includeInsurance) : defaultIncludeInsurance;
  const includeMartyrsFund = options.includeMartyrsFund !== undefined ? Boolean(options.includeMartyrsFund) : defaultIncludeMartyrsFund;

  const activeComponents = Array.isArray(components)
    ? components.filter(c => c && c.isActive !== false)
    : [];

  // Determine basic salary and production component from components
  const basicSalarySum = activeComponents
    .filter(c => c.category === 'basic')
    .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

  const basicProductionSum = activeComponents
    .filter(c => c.name && c.name.toLowerCase().includes('production'))
    .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

  let evaluatedComponents = [];
  let grossSalary = 0;

  // Compute gross salary based on disbursement type
  if (disbursementType === 'Basic Months') {
    const base = unitRate > 0 ? unitRate : (basicSalarySum > 0 ? basicSalarySum : 0);
    grossSalary = Math.round(base * multiplier * 100) / 100;
    evaluatedComponents = [
      {
        name: `Basic Salary (${multiplier} Month${multiplier !== 1 ? 's' : ''})`,
        category: 'basic',
        type: 'fixed',
        value: grossSalary,
        evaluatedAmount: grossSalary,
        isTaxable: true,
        isInsurable: false,
      },
      ...activeComponents.filter(c => c.category === 'deduction').map(c => ({
        ...c,
        evaluatedAmount: Number(c.value) || 0,
      })),
    ];
  } else if (disbursementType === 'Basic Production') {
    const prodBase = unitRate > 0 ? unitRate : (basicProductionSum > 0 ? basicProductionSum : basicSalarySum);
    grossSalary = Math.round(prodBase * multiplier * 100) / 100;
    evaluatedComponents = [
      {
        name: `Basic Production (${multiplier}x)`,
        category: 'bonus',
        type: 'fixed',
        value: grossSalary,
        evaluatedAmount: grossSalary,
        isTaxable: true,
        isInsurable: false,
      },
      ...activeComponents.filter(c => c.category === 'deduction').map(c => ({
        ...c,
        evaluatedAmount: Number(c.value) || 0,
      })),
    ];
  } else if (disbursementType === 'Bond Distribution') {
    const rate = unitRate > 0 ? unitRate : 0;
    grossSalary = Math.round(rate * multiplier * 100) / 100;
    evaluatedComponents = [
      {
        name: `Bond Distribution (${multiplier} bonds @ ${rate} EGP)`,
        category: 'other',
        type: 'fixed',
        value: grossSalary,
        evaluatedAmount: grossSalary,
        isTaxable: false,
        isInsurable: false,
      },
    ];
  } else if (
    disbursementType === 'Sector Bonus' ||
    disbursementType === 'Individual Bonus' ||
    disbursementType === 'Surplus' ||
    disbursementType === 'End of Year Bonus'
  ) {
    const lumpSum = unitRate > 0 ? unitRate : activeComponents
      .filter(c => c.category !== 'deduction')
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    grossSalary = Math.round(lumpSum * 100) / 100;
    evaluatedComponents = [
      {
        name: disbursementType,
        category: 'bonus',
        type: 'fixed',
        value: grossSalary,
        evaluatedAmount: grossSalary,
        isTaxable: includeTax,
        isInsurable: false,
      },
      ...activeComponents.filter(c => c.category === 'deduction').map(c => ({
        ...c,
        evaluatedAmount: Number(c.value) || 0,
      })),
    ];
  } else {
    // Regular paycheck flow: evaluate components
    let fixedEarningsSum = 0;
    for (const c of activeComponents) {
      if (c.category !== 'deduction') {
        if (c.type === 'fixed' || !c.type) {
          fixedEarningsSum += (Number(c.value) || 0);
        }
      }
    }

    evaluatedComponents = activeComponents.map(c => {
      const rawVal = Number(c.value) || 0;
      let evaluatedAmount = rawVal;

      if (c.type === 'percentage') {
        const basis = c.calculationBasis === 'basic' ? basicSalarySum : fixedEarningsSum;
        evaluatedAmount = (basis * rawVal) / 100;
      }

      return {
        ...c,
        name: c.name || 'Unnamed',
        category: c.category || 'other',
        type: c.type || 'fixed',
        value: rawVal,
        calculationBasis: c.calculationBasis || 'gross',
        isTaxable: c.isTaxable !== false,
        isInsurable: c.isInsurable !== false,
        evaluatedAmount: Math.round(evaluatedAmount * 100) / 100,
      };
    });

    grossSalary = evaluatedComponents
      .filter(c => c.category !== 'deduction')
      .reduce((sum, c) => sum + c.evaluatedAmount, 0);
  }

  // Taxable and Insurable Income
  const taxableIncome = evaluatedComponents
    .filter(c => c.category !== 'deduction' && c.isTaxable)
    .reduce((sum, c) => sum + c.evaluatedAmount, 0);

  const insurableIncome = evaluatedComponents
    .filter(c => c.category !== 'deduction' && c.isInsurable)
    .reduce((sum, c) => sum + c.evaluatedAmount, 0);

  // Cumulative YTD Tax Bracket Calculation
  const taxResult = calculateTax(
    grossSalary,
    taxConfig.brackets || [],
    taxConfig.personalExemption || 0,
    {
      grossSalary,
      priorYtdGross,
      includeTax,
      includeMartyrsFund,
    }
  );

  // Social Insurance Calculation
  let insuranceResult = {
    insurableIncome: 0,
    cappedInsurableIncome: 0,
    employeeContribution: 0,
    employerContribution: 0,
    employeeShareRate: Number(insuranceConfig?.employeeShare) || 11,
    employerShareRate: Number(insuranceConfig?.employerShare) || 18.75,
    isEnabled: includeInsurance,
  };

  if (includeInsurance && insurableIncome > 0) {
    insuranceResult = {
      ...calculateInsurance(insurableIncome, insuranceConfig || {}),
      isEnabled: true,
    };
  }

  // Martyrs Fund
  const martyrsFund = includeMartyrsFund ? taxResult.monthlyMartyrsFund : 0;

  // Custom Deductions sum
  const customDeductions = evaluatedComponents
    .filter(c => c.category === 'deduction')
    .reduce((sum, c) => sum + c.evaluatedAmount, 0);

  // Total Deductions & Net Pay
  const totalDeductions = Math.round(
    ((includeTax ? taxResult.monthlyTax : 0) +
     (includeInsurance ? insuranceResult.employeeContribution : 0) +
     martyrsFund +
     customDeductions) * 100
  ) / 100;

  const netPay = Math.round((grossSalary - totalDeductions) * 100) / 100;

  return {
    disbursementType,
    multiplier,
    unitRate,
    grossSalary: Math.round(grossSalary * 100) / 100,
    basicSalary: Math.round(basicSalarySum * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    insurableIncome: Math.round(insurableIncome * 100) / 100,
    priorYtdGross,
    cumulativeYtdGross: taxResult.cumulativeYtdGross,
    appliedTaxRate: taxResult.appliedRate,
    matchedBracket: taxResult.matchedBracket,
    includeTax,
    expectedTax: includeTax ? taxResult.monthlyTax : 0,
    expectedAnnualTax: includeTax ? taxResult.annualTax : 0,
    taxDetails: taxResult,
    includeInsurance,
    expectedInsurance: includeInsurance ? insuranceResult.employeeContribution : 0,
    expectedEmployerInsurance: includeInsurance ? insuranceResult.employerContribution : 0,
    insuranceDetails: insuranceResult,
    includeMartyrsFund,
    martyrsFund,
    customDeductions: Math.round(customDeductions * 100) / 100,
    totalDeductions,
    netPay,
    evaluatedComponents,
  };
}

module.exports = {
  calculatePreview,
};
