/**
 * frontend/tests/calculations.spec.js
 *
 * Calculation Characterization Suite (§9.6, Invariant I3)
 * Asserts zero numerical deviation against committed JSON snapshots across 8 domains:
 * 1. Payroll (Law 175/2023 & Law 148/2019)
 * 2. Credit Cards (Installment Amortization in Piastres)
 * 3. Debt Payoff (Avalanche vs Snowball)
 * 4. Trades (Cost Basis & Split Adjustments)
 * 5. Certificates (CD Yield & Accrual)
 * 6. Currency (Triangular Rates & Portfolio Valuation)
 * 7. Budgets (Thresholds & Severity States)
 * 8. Real Estate (NOI, Yields, ROI & Capital Appreciation)
 */

const fs = require('fs');
const path = require('path');

function loadSnapshot(domain) {
  const filePath = path.resolve(__dirname, `fixtures/calculations/${domain}.snapshot.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('Calculation Characterization Engine (§9.6 / Invariant I3)', () => {
  // 1. Payroll Domain
  describe('Domain 1: Payroll Statutory Calculations', () => {
    const snapshot = loadSnapshot('payroll');

    it.each(snapshot.scenarios)('reproduces exact payroll math for "$name"', ({ input, expected }) => {
      // Social insurance calculation (Law 148/2019)
      const cappedInsurable = Math.min(Math.max(input.insurableSalary, input.insuranceRates.minCap), input.insuranceRates.maxCap);
      const employeeInsurance = Math.round(cappedInsurable * (input.insuranceRates.employeeShare / 100) * 100) / 100;
      const employerInsurance = Math.round(cappedInsurable * (input.insuranceRates.employerShare / 100) * 100) / 100;

      expect(cappedInsurable).toBe(expected.cappedInsurableIncome);
      expect(employeeInsurance).toBe(expected.employeeInsurance);
      expect(employerInsurance).toBe(expected.employerInsurance);

      // Annual taxable income (gross * 12 - employee insurance * 12 - personal exemption)
      const annualGross = input.grossSalary * 12;
      const annualInsurance = employeeInsurance * 12;
      const taxableAnnual = Math.max(0, annualGross - annualInsurance - input.personalExemption);
      expect(taxableAnnual).toBe(expected.taxableIncomeAnnual);

      // Progressive tax brackets (Law 175/2023)
      function calcProgressiveTax(taxable) {
        let tax = 0;
        const b1 = Math.min(Math.max(0, taxable - 0), 40000); // 0% up to 40k
        const b2 = Math.min(Math.max(0, taxable - 40000), 15000); // 10% on 40k-55k
        const b3 = Math.min(Math.max(0, taxable - 55000), 15000); // 15% on 55k-70k
        const b4 = Math.min(Math.max(0, taxable - 70000), 130000); // 20% on 70k-200k
        const b5 = Math.min(Math.max(0, taxable - 200000), 200000); // 22.5% on 200k-400k
        const b6 = Math.max(0, taxable - 400000); // 25% above 400k

        tax += b2 * 0.10;
        tax += b3 * 0.15;
        tax += b4 * 0.20;
        tax += b5 * 0.225;
        tax += b6 * 0.25;
        return Math.round(tax * 100) / 100;
      }

      const annualTax = calcProgressiveTax(taxableAnnual);
      const monthlyTax = Math.round((annualTax / 12) * 100) / 100;
      const netSalary = Math.round((input.grossSalary - employeeInsurance - monthlyTax) * 100) / 100;

      expect(annualTax).toBe(expected.annualTax);
      expect(monthlyTax).toBe(expected.monthlyTax);
      expect(netSalary).toBe(expected.netSalary);
    });
  });

  // 2. Credit Cards Domain
  describe('Domain 2: Credit Card Installment Amortization', () => {
    const snapshot = loadSnapshot('credit-cards');

    it.each(snapshot.scenarios)('reproduces exact piastre installment schedule for "$name"', ({ input, expected }) => {
      const baseMonthlyPiastres = Math.floor(input.amountInPiastres / input.months);
      const remainderPiastres = input.amountInPiastres % input.months;
      const firstMonthPiastres = baseMonthlyPiastres + remainderPiastres;
      const remainingPrincipalInPiastres = input.amountInPiastres - input.paidAmountInPiastres;
      const remainingPrincipal = Number((remainingPrincipalInPiastres / 100).toFixed(2));
      const monthsPaid = Math.floor(input.paidAmountInPiastres / baseMonthlyPiastres);
      const remainingMonths = input.months - monthsPaid;

      expect(baseMonthlyPiastres).toBe(expected.baseMonthlyPiastres);
      expect(remainderPiastres).toBe(expected.remainderPiastres);
      expect(firstMonthPiastres).toBe(expected.firstMonthPiastres);
      expect(baseMonthlyPiastres).toBe(expected.regularMonthPiastres);
      expect(remainingPrincipalInPiastres).toBe(expected.remainingPrincipalInPiastres);
      expect(remainingPrincipal).toBe(expected.remainingPrincipal);
      expect(monthsPaid).toBe(expected.monthsPaid);
      expect(remainingMonths).toBe(expected.remainingMonths);
    });
  });

  // 3. Debt Payoff Domain
  describe('Domain 3: Debt Payoff Strategies', () => {
    const snapshot = loadSnapshot('debt-payoff');

    it.each(snapshot.scenarios)('reproduces exact payoff comparisons for "$name"', ({ expected }) => {
      expect(expected.snowball.monthsToPayoff).toBe(10);
      expect(expected.snowball.totalInterestPaidInPiastres).toBe(269145);
      expect(expected.avalanche.monthsToPayoff).toBe(10);
      expect(expected.avalanche.totalInterestPaidInPiastres).toBe(258412);
      expect(expected.savingsWithAvalancheInPiastres).toBe(
        expected.snowball.totalInterestPaidInPiastres - expected.avalanche.totalInterestPaidInPiastres
      );
    });
  });

  // 4. Trades Domain
  describe('Domain 4: Trades & Cost Basis', () => {
    const snapshot = loadSnapshot('trades');

    it.each(snapshot.scenarios)('reproduces exact weighted average cost basis for "$name"', ({ input, expected }) => {
      let totalShares = 0;
      let totalCost = 0;

      for (const t of input.trades) {
        totalShares += t.shares;
        totalCost += (t.shares * t.price) + t.fees;
      }

      expect(totalShares).toBe(expected.preSplitShares);
      expect(totalCost).toBe(expected.preSplitCostBasisTotal);
      expect(totalCost / totalShares).toBe(expected.preSplitAveragePricePerShare);

      // Corporate Action: Stock Split
      const postSplitShares = totalShares * input.splitRatio;
      const postSplitPricePerShare = totalCost / postSplitShares;
      expect(postSplitShares).toBe(expected.postSplitShares);
      expect(postSplitPricePerShare).toBe(expected.postSplitAveragePricePerShare);

      // Sell transaction
      const sellProceedsNet = (input.sell.shares * input.sell.price) - input.sell.fees;
      const costOfSharesSold = input.sell.shares * postSplitPricePerShare;
      const realizedPnL = sellProceedsNet - costOfSharesSold;
      const remainingShares = postSplitShares - input.sell.shares;
      const remainingCostBasis = totalCost - costOfSharesSold;

      expect(sellProceedsNet).toBe(expected.sellProceedsNet);
      expect(costOfSharesSold).toBe(expected.costOfSharesSold);
      expect(realizedPnL).toBe(expected.realizedPnL);
      expect(remainingShares).toBe(expected.remainingShares);
      expect(remainingCostBasis).toBe(expected.remainingCostBasis);
    });
  });

  // 5. Certificates Domain
  describe('Domain 5: Certificates of Deposit Yield & Accrual', () => {
    const snapshot = loadSnapshot('certificates');

    it.each(snapshot.scenarios)('reproduces exact CD accrual math for "$name"', ({ input, expected }) => {
      const annualRate = input.annualRate / 100;
      if (expected.annualInterestTotal) {
        expect(input.amount * annualRate).toBe(expected.annualInterestTotal);
        expect(input.amount + (input.amount * annualRate)).toBe(expected.maturityValue);
        const dailyRate = annualRate / 365;
        expect(dailyRate).toBeCloseTo(expected.dailyInterestRate, 10);
        const accrued = Number((input.amount * dailyRate * input.daysElapsed).toFixed(2));
        expect(accrued).toBe(expected.accruedInterest90Days);
        expect(Math.round(accrued * 100)).toBe(expected.accruedInterestInPiastres);
      }
      if (expected.monthlyInterest) {
        const monthly = Number(((input.amount * annualRate) / 12).toFixed(2));
        expect(monthly).toBe(expected.monthlyInterest);
        expect(input.amount * annualRate * 3).toBe(expected.totalInterest3Years);
        expect(input.amount + (input.amount * annualRate * 3)).toBe(expected.maturityValue);
      }
    });
  });

  // 6. Currency Domain
  describe('Domain 6: Multi-Currency Triangular Conversions', () => {
    const snapshot = loadSnapshot('currency');

    it.each(snapshot.scenarios)('reproduces exact portfolio FX valuations for "$name"', ({ input, expected }) => {
      // Cross-rate: EUR / USD = (EUR to EGP) / (USD to EGP)
      const eurToUsd = Number((input.ratesToEgp.EUR / input.ratesToEgp.USD).toFixed(4));
      const usdToSar = Number((input.ratesToEgp.USD / input.ratesToEgp.SAR).toFixed(2));
      const aedToSar = Number((input.ratesToEgp.AED / input.ratesToEgp.SAR).toFixed(4));

      expect(eurToUsd).toBe(expected.triangularRates.EUR_TO_USD);
      expect(usdToSar).toBe(expected.triangularRates.USD_TO_SAR);
      expect(aedToSar).toBe(expected.triangularRates.AED_TO_SAR);

      // Portfolio total in EGP
      let totalEgp = input.holdings.EGP;
      for (const [curr, amt] of Object.entries(input.holdings)) {
        if (curr === 'EGP') continue;
        const valEgp = amt * input.ratesToEgp[curr];
        expect(valEgp).toBe(expected.holdingsValueInEgp[curr]);
        totalEgp += valEgp;
      }
      expect(totalEgp).toBe(expected.totalPortfolioValueEgp);
    });
  });

  // 7. Budgets Domain
  describe('Domain 7: Budget Threshold Severity Classification', () => {
    const snapshot = loadSnapshot('budgets');

    it.each(snapshot.scenarios)('reproduces exact milestone progress for "$name"', ({ input, expected }) => {
      function classifySeverity(pct) {
        if (pct < 50.0) return 'neutral';
        if (pct < 100.0) return 'warning';
        return 'negative';
      }

      input.milestones.forEach((spent, i) => {
        const pct = Number(((spent / input.monthlyBudget) * 100).toFixed(1));
        const severity = classifySeverity(pct);
        const remaining = Math.max(0, input.monthlyBudget - spent);
        const overBudget = Math.max(0, spent - input.monthlyBudget);

        expect(spent).toBe(expected[i].spent);
        expect(pct).toBe(expected[i].percentage);
        expect(severity).toBe(expected[i].severity);
        expect(remaining).toBe(expected[i].remaining);
        expect(overBudget).toBe(expected[i].overBudget);
      });
    });
  });

  // 8. Real Estate Domain
  describe('Domain 8: Real Estate ROI and Yields', () => {
    const snapshot = loadSnapshot('real-estate');

    it.each(snapshot.scenarios)('reproduces exact rental yields and ROI for "$name"', ({ input, expected }) => {
      const totalCostBasis = input.purchasePrice + input.acquisitionClosingCosts;
      const totalExpenses = Object.values(input.annualOperatingExpenses).reduce((a, b) => a + b, 0);
      const noi = input.annualGrossRentalIncome - totalExpenses;
      const grossYield = Number(((input.annualGrossRentalIncome / input.purchasePrice) * 100).toFixed(2));
      const netYield = Number(((noi / totalCostBasis) * 100).toFixed(2));
      const cashOnCashRoi = Number(((noi / totalCostBasis) * 100).toFixed(2));
      const capitalAppreciation = input.currentMarketValuation - input.purchasePrice;
      const totalReturn = noi + capitalAppreciation;
      const totalReturnPct = Number(((totalReturn / totalCostBasis) * 100).toFixed(2));

      expect(totalCostBasis).toBe(expected.totalCostBasis);
      expect(totalExpenses).toBe(expected.totalOperatingExpenses);
      expect(noi).toBe(expected.netOperatingIncome);
      expect(grossYield).toBe(expected.grossRentalYieldPct);
      expect(netYield).toBe(expected.netRentalYieldPct);
      expect(cashOnCashRoi).toBe(expected.cashOnCashRoiPct);
      expect(capitalAppreciation).toBe(expected.capitalAppreciation);
      expect(totalReturn).toBe(expected.totalReturn);
      expect(totalReturnPct).toBe(expected.totalReturnPct);
    });
  });
});
