// backend/utils/taxCalculator.js

/**
 * Calculates payroll tax using the Company Cumulative Year-to-Date (YTD) Gross Tax Model:
 * 1. Tracks cumulative gross income earned so far in the calendar year:
 *    cumulativeYtdGross = priorYtdGross + currentGross
 * 2. Matches cumulativeYtdGross against the annual tax bracket schedule [from, to]
 *    (e.g., 0-40k @ 0%, 40k-55k @ 10%, 55k-70k @ 15%, 70k-200k @ 20%, 200k-400k @ 22.5%, 400k-1.2M @ 25%, >1.2M @ 27.5%)
 * 3. Applies the matched single bracket rate (R%) directly to this paycheck's gross amount:
 *    paycheckTax = currentGross * (R / 100)
 * 4. At the start of the year (cumulative gross <= 40k), rate is 0%. As cumulative gross increases,
 *    subsequent paychecks advance to higher bracket percentages.
 * 
 * @param {number} monthlyTaxableOrGross - Current paycheck gross in EGP
 * @param {Array} taxBrackets - Array of bracket objects [{ level, from, to, rate }]
 * @param {number} personalExemption - Optional personal exemption
 * @param {Object} options - Options: { grossSalary, priorYtdGross, includeTax, includeMartyrsFund }
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
      taxableAnnual: cumulativeYtdGross,
      appliedRate: 0,
      matchedBracket: null,
      priorYtdGross,
      cumulativeYtdGross,
      bracketBreakdown: [],
      monthlyMartyrsFund,
      annualMartyrsFund,
    };
  }

  // Sort brackets ascending by 'from'
  const sortedBrackets = [...taxBrackets].sort((a, b) => (Number(a.from) || 0) - (Number(b.from) || 0));

  // Find matching bracket where cumulativeYtdGross falls
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

  // Fallback to highest bracket if exceeding top
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

  // Apply matched percentage to this paycheck's gross
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
  calculateTax,
};
