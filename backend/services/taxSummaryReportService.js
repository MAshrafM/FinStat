// backend/services/taxSummaryReportService.js
const mongoose = require('mongoose');
const Paycheck = require('../models/Paycheck');
const TaxBracket = require('../models/TaxBracket');
const { calculateProgressiveTax } = require('../utils/taxCalculator');

/**
 * Validates year input for statutory tax summary.
 */
function validateTaxYear(year) {
  if (year === undefined || year === null || year === '') {
    const err = new Error('Year parameter is required.');
    err.statusCode = 400;
    throw err;
  }
  const parsedYear = Number(year);
  if (Number.isNaN(parsedYear) || !Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2200) {
    const err = new Error('Invalid year format. Year must be a valid integer.');
    err.statusCode = 400;
    throw err;
  }
  return parsedYear;
}

/**
 * Generates annual statutory Egyptian tax summary report per Law 175/2023 and Law 200/2020.
 */
async function generateTaxSummaryReport(userId, yearParam) {
  const year = validateTaxYear(yearParam);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Retrieve statutory tax brackets and personal exemption for requested year
  const taxConfig = await TaxBracket.findOne({ country: 'Egypt', year }).lean();
  if (!taxConfig) {
    const err = new Error(`No tax bracket configuration found for year ${year}`);
    err.statusCode = 404;
    throw err;
  }

  // 2. Query paychecks for user within the calendar year (supporting payDate and legacy date)
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const paychecks = await Paycheck.find({
    user: userObjectId,
    deletedAt: null,
    $or: [
      { payDate: { $gte: yearStart, $lte: yearEnd } },
      { date: { $gte: yearStart, $lte: yearEnd } },
    ],
  }).sort({ payDate: 1, date: 1 }).lean();

  let totalGrossSalary = 0;
  let totalActualTaxPaid = 0;
  let totalSocialInsurance = 0;
  let totalMartyrsPaid = 0;

  for (const p of paychecks) {
    const gross = Number(p.grossSalary) || Number(p.grossAmount) || (p.grossSalaryInPiastres ? p.grossSalaryInPiastres / 100 : 0) || (p.grossAmountInPiastres ? p.grossAmountInPiastres / 100 : 0) || 0;
    const tax = Number(p.taxDetails?.actualTax) || Number(p.taxDeduction) || (p.taxDeductionInPiastres ? p.taxDeductionInPiastres / 100 : 0) || 0;
    const ins = Number(p.insuranceDetails?.actualEmployeeShare) || Number(p.insuranceDeduction) || (p.insuranceDeductionInPiastres ? p.insuranceDeductionInPiastres / 100 : 0) || 0;
    const martyrs = Number(p.martyrsFund) || (p.martyrsFundInPiastres ? p.martyrsFundInPiastres / 100 : 0) || 0;

    totalGrossSalary += gross;
    totalActualTaxPaid += tax;
    totalSocialInsurance += ins;
    totalMartyrsPaid += martyrs;
  }

  totalGrossSalary = Math.round(totalGrossSalary * 100) / 100;
  totalActualTaxPaid = Math.round(totalActualTaxPaid * 100) / 100;
  totalSocialInsurance = Math.round(totalSocialInsurance * 100) / 100;
  totalMartyrsPaid = Math.round(totalMartyrsPaid * 100) / 100;

  // 3. Statutory deductions order: Annual Gross - Annual Social Insurance - Personal Exemption
  const personalExemption = Number(taxConfig.personalExemption) || 0;
  const netTaxableIncome = Math.max(0, Math.round((totalGrossSalary - totalSocialInsurance - personalExemption) * 100) / 100);

  // 4. Calculate statutory progressive bracket liability
  const statutoryTaxResult = netTaxableIncome > 0
    ? calculateProgressiveTax(netTaxableIncome, taxConfig.brackets || [])
    : { annualTax: 0, monthlyTax: 0, bracketBreakdown: [], effectiveRate: 0, matchedBracket: null };

  const calculatedAnnualTax = statutoryTaxResult.annualTax || 0;

  // 5. Martyrs Memorial Fund (0.05% of gross wage per Law 200/2020)
  const expectedMartyrsFund = Math.round(totalGrossSalary * 0.0005 * 100) / 100;

  // 6. Reconciliation Deltas
  const taxReconciliationDelta = Math.round((totalActualTaxPaid - calculatedAnnualTax) * 100) / 100;
  const martyrsReconciliationDelta = Math.round((totalMartyrsPaid - expectedMartyrsFund) * 100) / 100;

  let status = 'Reconciled';
  if (taxReconciliationDelta > 0) {
    status = 'Overpaid';
  } else if (taxReconciliationDelta < 0) {
    status = 'Underpaid';
  }

  return {
    meta: {
      userId: userId.toString(),
      year,
      generatedAt: new Date().toISOString(),
      statutoryLaw: 'Egyptian Tax Law 175/2023 & Law 200/2020',
    },
    payrollSummary: {
      paycheckCount: paychecks.length,
      totalGrossSalary,
      totalSocialInsurance,
      personalExemption,
      netTaxableIncome,
    },
    statutoryTax: {
      calculatedAnnualTax,
      actualTaxPaid: totalActualTaxPaid,
      reconciliationDelta: taxReconciliationDelta,
      status,
      effectiveRate: statutoryTaxResult.effectiveRate || 0,
    },
    martyrsFund: {
      calculatedAnnualMartyrsFund: expectedMartyrsFund,
      actualMartyrsFundPaid: totalMartyrsPaid,
      reconciliationDelta: martyrsReconciliationDelta,
    },
    bracketsBreakdown: statutoryTaxResult.bracketBreakdown || [],
  };
}

module.exports = {
  validateTaxYear,
  generateTaxSummaryReport,
};

