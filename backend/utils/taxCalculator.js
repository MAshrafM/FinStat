// backend/utils/taxCalculator.js

/**
 * Calculates progressive income tax by slicing annual taxable base across tiered brackets
 * under Egyptian Tax Law (Law 91/2005 as amended by Law 175/2023 & Law 7/2024).
 * 
 * @param {number} annualTaxableBase - Net annual taxable base in EGP (Gross - SI - Exemption)
 * @param {Array} taxBrackets - Array of bracket objects [{ level, from, to, rate }]
 * @returns {Object} { annualTax, monthlyTax, bracketBreakdown, effectiveRate, matchedBracket }
 */
function calculateProgressiveTax(annualTaxableBase = 0, taxBrackets = []) {
  const base = Math.max(0, Number(annualTaxableBase) || 0);

  if (base === 0 || !Array.isArray(taxBrackets) || taxBrackets.length === 0) {
    const firstBracket = Array.isArray(taxBrackets) && taxBrackets.length > 0 ? taxBrackets[0] : null;
    return {
      annualTax: 0,
      monthlyTax: 0,
      bracketBreakdown: Array.isArray(taxBrackets) ? taxBrackets.map((b, i) => ({
        level: b.level || (i + 1),
        bracket: b.to === Infinity || Number(b.to) >= 1000000000
          ? `Above ${(Number(b.from) || 0).toLocaleString()} EGP/yr`
          : `${(Number(b.from) || 0).toLocaleString()} to ${(Number(b.to) || 0).toLocaleString()} EGP/yr`,
        from: Number(b.from) || 0,
        to: Number(b.to) || Infinity,
        rate: Number(b.rate) || 0,
        taxableAmount: 0,
        tax: 0,
        isMatched: i === 0,
      })) : [],
      effectiveRate: 0,
      matchedBracket: firstBracket ? {
        level: firstBracket.level || 1,
        rate: Number(firstBracket.rate) || 0,
        description: `${(Number(firstBracket.from) || 0).toLocaleString()} to ${(Number(firstBracket.to) || 0).toLocaleString()} EGP/yr`,
        from: Number(firstBracket.from) || 0,
        to: Number(firstBracket.to) || Infinity,
      } : null,
    };
  }

  // Sort brackets ascending by 'from'
  const sortedBrackets = [...taxBrackets].sort((a, b) => (Number(a.from) || 0) - (Number(b.from) || 0));

  let remaining = base;
  let totalAnnualTax = 0;
  const bracketBreakdown = [];
  let highestMatched = null;

  for (let i = 0; i < sortedBrackets.length; i++) {
    const b = sortedBrackets[i];
    const from = Number(b.from) || 0;
    const to = b.to !== undefined && b.to !== null && Number(b.to) < 1000000000
      ? Number(b.to)
      : Infinity;
    const rate = Number(b.rate) || 0;
    const rateFraction = rate > 1 ? rate / 100 : rate;
    const span = to === Infinity ? Infinity : Math.max(0, to - from);

    const taxableAmount = Math.max(0, Math.min(remaining, span));
    const tierTax = Math.round(taxableAmount * rateFraction * 100) / 100;

    remaining = Math.max(0, remaining - taxableAmount);
    totalAnnualTax += tierTax;

    const isMatched = taxableAmount > 0 || (i === 0 && base === 0);

    const bracketDescription = to === Infinity
      ? `Above ${from.toLocaleString()} EGP/yr`
      : `${from.toLocaleString()} to ${to.toLocaleString()} EGP/yr`;

    const breakdownItem = {
      level: b.level || (i + 1),
      bracket: bracketDescription,
      from,
      to,
      rate,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      tax: tierTax,
      isMatched,
    };

    bracketBreakdown.push(breakdownItem);

    if (taxableAmount > 0 || !highestMatched) {
      highestMatched = {
        level: breakdownItem.level,
        rate,
        description: bracketDescription,
        from,
        to,
      };
    }
  }

  totalAnnualTax = Math.round(totalAnnualTax * 100) / 100;
  const monthlyTax = Math.round((totalAnnualTax / 12) * 100) / 100;
  const effectiveRate = base > 0 ? Math.round((totalAnnualTax / base) * 10000) / 100 : 0;

  return {
    annualTax: totalAnnualTax,
    monthlyTax,
    bracketBreakdown,
    effectiveRate,
    matchedBracket: highestMatched,
  };
}

/**
 * Calculates payroll tax using either:
 * A) Statutory Progressive Tax Model (Law 175/2023 Annualized-Average Method for Regular Paychecks)
 * B) Company Cumulative Year-to-Date (YTD) Gross Tax Model (for specialized lump sums / bonuses)
 * 
 * @param {number} monthlyTaxableOrGross - Current paycheck gross in EGP
 * @param {Array} taxBrackets - Array of bracket objects [{ level, from, to, rate }]
 * @param {number} personalExemption - Annual personal exemption (20,000 EGP under Law 175/2023)
 * @param {Object} options - Options: { grossSalary, priorYtdGross, includeTax, includeMartyrsFund, taxModel, annualInsuranceContribution }
 * @returns {Object} Calculation result { monthlyTax, annualTax, appliedRate, matchedBracket, priorYtdGross, cumulativeYtdGross, bracketBreakdown, monthlyMartyrsFund, annualMartyrsFund }
 */
function calculateTax(
  monthlyTaxableOrGross = 0,
  taxBrackets = [],
  personalExemption = 0,
  options = {}
) {
  const currentGross = Math.max(0, Number(options.grossSalary ?? monthlyTaxableOrGross) || 0);
  const priorYtdGross = Math.max(0, Number(options.priorYtdGross) || 0);
  const cumulativeYtdGross = priorYtdGross + currentGross;
  const includeTax = options.includeTax !== false;
  const includeMartyrs = options.includeMartyrsFund !== false;

  // Martyrs Fund (0.05% of current gross wage under Law 4/2021)
  const monthlyMartyrsFund = includeMartyrs
    ? Math.round(currentGross * 0.0005 * 100) / 100
    : 0;
  const annualMartyrsFund = Math.round(monthlyMartyrsFund * 12 * 100) / 100;

  if (currentGross === 0 || !Array.isArray(taxBrackets) || taxBrackets.length === 0) {
    return {
      monthlyTax: 0,
      annualTax: 0,
      taxableAnnual: 0,
      appliedRate: 0,
      matchedBracket: null,
      priorYtdGross,
      cumulativeYtdGross,
      bracketBreakdown: [],
      monthlyMartyrsFund,
      annualMartyrsFund,
    };
  }

  // Determine calculation mode:
  // Statutory progressive mode applies if explicitly requested, or if annualInsuranceContribution is supplied,
  // or if personalExemption > 0 and taxModel is not explicitly 'cumulative'.
  const useProgressive = options.taxModel === 'progressive' ||
    (options.taxModel !== 'cumulative' && (options.annualInsuranceContribution !== undefined || personalExemption > 0));

  if (useProgressive) {
    const annualGross = currentGross * 12;
    const annualSI = Math.max(0, Number(options.annualInsuranceContribution) || 0);
    const exemption = Math.max(0, Number(personalExemption) || 0);

    // Statutory deduction order: Annual Gross - Annual SI - Personal Exemption
    const netTaxableBase = Math.max(0, annualGross - annualSI - exemption);

    let progressiveResult = {
      annualTax: 0,
      monthlyTax: 0,
      bracketBreakdown: [],
      effectiveRate: 0,
      matchedBracket: null,
    };

    if (includeTax && netTaxableBase > 0) {
      progressiveResult = calculateProgressiveTax(netTaxableBase, taxBrackets);
    }

    const monthlyTax = includeTax ? progressiveResult.monthlyTax : 0;
    const annualTax = includeTax ? progressiveResult.annualTax : 0;
    const appliedRate = progressiveResult.matchedBracket?.rate ?? progressiveResult.effectiveRate ?? 0;

    return {
      monthlyTax,
      annualTax,
      taxableAnnual: Math.round(netTaxableBase * 100) / 100,
      appliedRate,
      matchedBracket: progressiveResult.matchedBracket,
      priorYtdGross,
      cumulativeYtdGross,
      bracketBreakdown: progressiveResult.bracketBreakdown,
      monthlyMartyrsFund,
      annualMartyrsFund,
    };
  }

  // Cumulative YTD Gross Model (Legacy / Bonus Disbursements)
  const sortedBrackets = [...taxBrackets].sort((a, b) => (Number(a.from) || 0) - (Number(b.from) || 0));

  let matchedBracket = null;
  for (const b of sortedBrackets) {
    const from = Number(b.from) || 0;
    const to = b.to !== undefined && b.to !== null && Number(b.to) < 1000000000
      ? Number(b.to)
      : Infinity;

    if (cumulativeYtdGross >= from && (cumulativeYtdGross <= to || to === Infinity)) {
      matchedBracket = {
        ...b,
        from,
        to,
        rate: Number(b.rate) || 0,
      };
      break;
    }
  }

  if (!matchedBracket && sortedBrackets.length > 0) {
    const lastB = sortedBrackets[sortedBrackets.length - 1];
    matchedBracket = {
      ...lastB,
      from: Number(lastB.from) || 0,
      to: Number(lastB.to) || Infinity,
      rate: Number(lastB.rate) || 0,
    };
  }

  const rawRate = (includeTax && matchedBracket) ? matchedBracket.rate : 0;
  const rateFraction = rawRate > 1 ? rawRate / 100 : rawRate;

  const monthlyTax = includeTax ? Math.round(currentGross * rateFraction * 100) / 100 : 0;
  const annualTax = includeTax ? Math.round(cumulativeYtdGross * rateFraction * 100) / 100 : 0;

  const bracketDescription = matchedBracket?.to === Infinity
    ? `Above ${(matchedBracket?.from || 0).toLocaleString()} EGP/yr`
    : `${(matchedBracket?.from || 0).toLocaleString()} to ${(matchedBracket?.to || 0).toLocaleString()} EGP/yr`;

  const bracketBreakdown = [
    {
      level: matchedBracket?.level || 1,
      bracket: bracketDescription,
      from: matchedBracket?.from || 0,
      to: matchedBracket?.to || Infinity,
      rate: rawRate,
      taxableAmount: currentGross,
      tax: monthlyTax,
      cumulativeYtdGross,
      priorYtdGross,
      isMatched: true,
    },
  ];

  return {
    monthlyTax,
    annualTax,
    taxableAnnual: Math.round(cumulativeYtdGross * 100) / 100,
    appliedRate: rawRate,
    matchedBracket: {
      level: matchedBracket?.level,
      rate: rawRate,
      description: bracketDescription,
      from: matchedBracket?.from,
      to: matchedBracket?.to,
    },
    priorYtdGross,
    cumulativeYtdGross,
    bracketBreakdown,
    monthlyMartyrsFund,
    annualMartyrsFund,
  };
}

module.exports = {
  calculateProgressiveTax,
  calculateTax,
};
