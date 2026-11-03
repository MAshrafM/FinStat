// backend/tests/unit/comprehensiveReportService.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const {
  parseYearRange,
  generateComprehensiveReport,
} = require('../../services/comprehensiveReportService');

const Paycheck = require('../../models/Paycheck');
const Expenditure = require('../../models/Expenditure');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');
const Trade = require('../../models/Trade');
const MutualFundTrade = require('../../models/MutualFundTrade');
const Gold = require('../../models/Gold');
const Certificate = require('../../models/Certificate');
const Currency = require('../../models/Currency');
const RealEstate = require('../../models/RealEstate');
const Budget = require('../../models/Budget');
const DebtPayoffPlan = require('../../models/DebtPayoffPlan');
const CategorizationRule = require('../../models/CategorizationRule');

describe('Comprehensive Financial Report Service Unit Tests [FEAT-003]', () => {
  let userId;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    userId = new mongoose.Types.ObjectId();
  });

  test('Test 1 (Paycheck Aggregation): aggregates gross, net, tax, insurance, and martyrs fund accurately', async () => {
    await Paycheck.create([
      {
        user: userId,
        payDate: new Date('2025-01-15T12:00:00.000Z'),
        period: '2025-01',
        grossSalary: 50000,
        netPay: 40000,
        taxDetails: { actualTax: 6000 },
        insuranceDetails: { actualEmployeeShare: 3975 },
        martyrsFund: 25,
      },
      {
        user: userId,
        payDate: new Date('2025-02-15T12:00:00.000Z'),
        period: '2025-02',
        grossSalary: 52000,
        netPay: 41500,
        taxDetails: { actualTax: 6400 },
        insuranceDetails: { actualEmployeeShare: 4075 },
        martyrsFund: 25,
      },
    ]);

    const report = await generateComprehensiveReport(userId, { startYear: 2025, endYear: 2025 });

    expect(report.payroll.totalGrossSalary).toBe(102000);
    expect(report.payroll.totalNetPay).toBe(81500);
    expect(report.payroll.totalTax).toBe(12400);
    expect(report.payroll.totalInsurance).toBe(8050);
    expect(report.payroll.totalMartyrsFund).toBe(50);
    expect(report.payroll.monthlyTrend).toHaveLength(2);
    expect(report.payroll.monthlyTrend[0].yearMonth).toBe('2025-01');
  });

  test('Test 2 (Expenditure Aggregation & Uncategorized Fallback): handles unwinding categories and groups empty/null under Uncategorized', async () => {
    await Expenditure.create([
      {
        user: userId,
        date: new Date('2025-03-10'),
        transactionValue: 1200,
        transactionType: 'W',
        categories: ['Groceries', 'Household'],
      },
      {
        user: userId,
        date: new Date('2025-03-15'),
        transactionValue: 800,
        transactionType: 'W',
        categories: ['Groceries'],
      },
      {
        user: userId,
        date: new Date('2025-03-20'),
        transactionValue: 500,
        transactionType: 'W',
        categories: [],
      },
    ]);

    const report = await generateComprehensiveReport(userId, { startYear: 2025, endYear: 2025 });

    expect(report.expenditures.totalSpent).toBe(2500);

    const groceriesCat = report.expenditures.spendByCategory.find(c => c.category === 'Groceries');
    const householdCat = report.expenditures.spendByCategory.find(c => c.category === 'Household');
    const uncategorizedCat = report.expenditures.spendByCategory.find(c => c.category === 'Uncategorized');

    expect(groceriesCat).toBeDefined();
    expect(groceriesCat.totalSpent).toBe(2000);
    expect(householdCat).toBeDefined();
    expect(householdCat.totalSpent).toBe(1200);
    expect(uncategorizedCat).toBeDefined();
    expect(uncategorizedCat.totalSpent).toBe(500);
  });

  test('Test 3 (Investment Aggregation): verifies running average cost basis for equities & MF, gold net grams, and certificate principal', async () => {
    await Trade.create([
      {
        user: userId,
        date: new Date('2025-04-01'),
        stockCode: 'COMI',
        type: 'Buy',
        shares: 100,
        price: 20,
        totalValue: 2000,
        fees: 0,
      },
      {
        user: userId,
        date: new Date('2025-04-10'),
        stockCode: 'COMI',
        type: 'Buy',
        shares: 100,
        price: 30,
        totalValue: 3000,
        fees: 0,
      },
      {
        user: userId,
        date: new Date('2025-05-01'),
        stockCode: 'COMI',
        type: 'Sell',
        shares: 100,
        price: 35,
        totalValue: 3500,
        fees: 0,
      },
      {
        user: userId,
        date: new Date('2025-05-15'),
        stockCode: 'COMI',
        type: 'Dividend',
        price: 250,
        totalValue: 250,
      },
    ]);

    await MutualFundTrade.create([
      {
        user: userId,
        date: new Date('2025-04-05'),
        name: 'AZ Opportunity',
        code: 'AZO',
        type: 'Buy',
        units: 50,
        price: 10,
        totalValue: 500,
        fees: 0,
      },
      {
        user: userId,
        date: new Date('2025-05-10'),
        name: 'AZ Opportunity',
        code: 'AZO',
        type: 'Sell',
        units: 20,
        price: 15,
        totalValue: 300,
        fees: 0,
      },
    ]);

    await Gold.create({
      user: userId,
      item: 'Gold Bar 24k',
      karat: 24,
      weight: 20,
      price: 3500,
      paid: 70000,
      date: new Date('2025-02-01'),
      sellingDate: new Date('2025-06-01'),
    });

    await Certificate.create({
      user: userId,
      name: 'Platinum 3Y',
      amount: 100000,
      interest: 25,
      period: 36,
      startDate: new Date('2025-01-01'),
      maturityDate: new Date('2028-01-01'),
      status: 'active',
    });

    const report = await generateComprehensiveReport(userId, { startYear: 2025, endYear: 2025 });

    expect(report.investments.equities.realizedGains).toBe(1000);
    expect(report.investments.equities.dividendIncome).toBe(250);
    expect(report.investments.mutualFunds.realizedGains).toBe(100);
    expect(report.investments.certificates.totalPrincipalHeld).toBe(100000);
    expect(report.investments.certificates.estimatedAccruedInterest).toBe(25000);
  });

  test('Test 4 (Assets & Valuation Aggregation): verifies currency valuation in piastres and real estate metrics', async () => {
    await Currency.create({
      user: userId,
      name: 'US Dollar',
      currencyCode: 'USD',
      amount: 1000,
      price: 48000,
      currentValueInPiastres: 4950000,
      date: new Date('2025-03-01'),
    });

    await RealEstate.create({
      user: userId,
      name: 'Zayed Apartment',
      type: 'Residential',
      purchasePrice: 2500000,
      currentValuation: 3200000,
      purchaseDate: new Date('2024-06-01'),
      status: 'Owned',
    });

    const report = await generateComprehensiveReport(userId, { startYear: 2025, endYear: 2025 });

    expect(report.currency.totalForexValuationEGP).toBe(49500);
    expect(report.investments.realEstate.acquisitionCost).toBe(2500000);
    expect(report.investments.realEstate.currentMarketValue).toBe(3200000);
  });

  test('Test 5 (Debt & Budget Reconciliation): computes card balances, in-memory budget join, and payoff plan savings', async () => {
    const card = await CreditCard.create({
      user: userId,
      name: 'CIB Titanium',
      bank: 'CIB',
      billingCycleDay: 1,
      paymentDueDay: 25,
      limit: 50000,
      currentBalance: 12000,
    });

    await CardTransaction.create({
      user: userId,
      card: card._id,
      description: 'Dining expense',
      type: 'Purchase',
      amount: 4500,
      paidAmount: 2000,
      date: new Date('2025-04-10'),
    });

    await Budget.create({
      user: userId,
      category: 'Dining',
      amount: 5000,
      period: 'monthly',
      year: 2025,
      month: 4,
    });

    await Expenditure.create({
      user: userId,
      date: new Date('2025-04-15'),
      transactionValue: 3500,
      transactionType: 'W',
      categories: ['Dining'],
    });

    await DebtPayoffPlan.create({
      user: userId,
      strategy: 'snowball',
      monthlyBudget: 6000,
      monthlyBudgetInPiastres: 600000,
      cards: [{ cardId: card._id, balanceInPiastres: 1200000, minimumPaymentInPiastres: 60000, apr: 24 }],
      projectedPayoffDate: new Date('2026-08-01'),
      totalInterestSavedInPiastres: 450000,
      isActive: true,
    });

    const report = await generateComprehensiveReport(userId, { startYear: 2025, endYear: 2025 });

    expect(report.creditCards.totalLimit).toBe(50000);
    expect(report.creditCards.currentBalance).toBe(2500);
    expect(report.creditCards.periodCharged).toBe(4500);
    expect(report.creditCards.periodPaid).toBe(2000);

    expect(report.budget.categories).toHaveLength(1);
    expect(report.budget.categories[0].category).toBe('Dining');
    expect(report.budget.categories[0].actualSpent).toBe(3500);
    expect(report.budget.categories[0].utilizationPercentage).toBe(70);

    expect(report.debtPayoff.hasActivePlan).toBe(true);
    expect(report.debtPayoff.strategy).toBe('snowball');
    expect(report.debtPayoff.totalInterestSaved).toBe(4500);
  });

  test('Test 6 (Categorization Rules Coverage): computes active rules count and categorization percentage', async () => {
    await CategorizationRule.create([
      { user: userId, name: 'Uber Rule', category: 'Transportation', field: 'description', operator: 'contains', value: 'Uber', isActive: true },
      { user: userId, name: 'Carrefour Rule', category: 'Groceries', field: 'description', operator: 'contains', value: 'Carrefour', isActive: true },
      { user: userId, name: 'Inactive Rule', category: 'Other', field: 'description', operator: 'contains', value: 'Unknown', isActive: false },
    ]);

    await Expenditure.create([
      { user: userId, date: new Date('2025-05-01'), transactionValue: 300, transactionType: 'W', categories: ['Transportation'] },
      { user: userId, date: new Date('2025-05-02'), transactionValue: 400, transactionType: 'W', categories: ['Groceries'] },
      { user: userId, date: new Date('2025-05-03'), transactionValue: 150, transactionType: 'W', categories: ['Uncategorized'] },
      { user: userId, date: new Date('2025-05-04'), transactionValue: 200, transactionType: 'W', categories: ['Other'] },
    ]);

    const report = await generateComprehensiveReport(userId, { startYear: 2025, endYear: 2025 });

    expect(report.categorizationRules.activeRulesCount).toBe(2);
    expect(report.categorizationRules.autoCategorizationCoverage).toBe(50);
  });

  test('Test 7 (Sliding Window & Date Boundaries): strictly filters by periodStart and periodEnd', async () => {
    await Paycheck.create({
      user: userId,
      payDate: new Date('2025-06-01'),
      period: '2025-06',
      grossSalary: 20000,
      netPay: 18000,
    });
    await Paycheck.create([
      { user: userId, payDate: new Date('2024-12-31'), period: '2024-12', grossSalary: 15000, netPay: 13000 },
      { user: userId, payDate: new Date('2026-01-01'), period: '2026-01', grossSalary: 25000, netPay: 22000 },
    ]);

    const report = await generateComprehensiveReport(userId, { startYear: 2025, endYear: 2025 });

    expect(report.payroll.totalGrossSalary).toBe(20000);
    expect(report.payroll.totalNetPay).toBe(18000);
    expect(report.payroll.monthlyTrend).toHaveLength(1);
    expect(report.payroll.monthlyTrend[0].yearMonth).toBe('2025-06');
  });
});
