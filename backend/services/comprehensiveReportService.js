// backend/services/comprehensiveReportService.js
const mongoose = require('mongoose');
const Paycheck = require('../models/Paycheck');
const Expenditure = require('../models/Expenditure');
const CreditCard = require('../models/CreditCard');
const CardTransaction = require('../models/CardTransaction');
const Trade = require('../models/Trade');
const MutualFundTrade = require('../models/MutualFundTrade');
const Gold = require('../models/Gold');
const Certificate = require('../models/Certificate');
const Currency = require('../models/Currency');
const RealEstate = require('../models/RealEstate');
const Budget = require('../models/Budget');
const DebtPayoffPlan = require('../models/DebtPayoffPlan');
const CategorizationRule = require('../models/CategorizationRule');

/**
 * Validates and parses startYear / endYear query options.
 * Defaults to last 3 calendar years (currentYear - 2 to currentYear).
 */
function parseYearRange({ startYear, endYear }) {
  const currentYear = new Date().getFullYear();
  const parsedEnd = endYear !== undefined && endYear !== null && endYear !== '' ? Number(endYear) : currentYear;
  const parsedStart = startYear !== undefined && startYear !== null && startYear !== '' ? Number(startYear) : currentYear - 2;

  if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
    const err = new Error('Invalid year format. Years must be numeric integers.');
    err.statusCode = 400;
    throw err;
  }

  if (parsedStart > parsedEnd) {
    const err = new Error('startYear cannot be greater than endYear.');
    err.statusCode = 400;
    throw err;
  }

  if (parsedEnd - parsedStart > 5) {
    const err = new Error('Year range cannot exceed 5 years to protect execution limits.');
    err.statusCode = 400;
    throw err;
  }

  const periodStart = new Date(Date.UTC(parsedStart, 0, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(parsedEnd, 11, 31, 23, 59, 59, 999));

  return {
    startYear: parsedStart,
    endYear: parsedEnd,
    periodStart,
    periodEnd,
  };
}

/**
 * Aggregates financial data across all 12 modules sequentially to respect
 * Vercel single-connection limits (maxPoolSize: 1).
 */
async function generateComprehensiveReport(userId, options = {}) {
  const { startYear, endYear, periodStart, periodEnd } = parseYearRange(options);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Paychecks
  const paychecks = await Paycheck.find({
    user: userObjectId,
    payDate: { $gte: periodStart, $lte: periodEnd },
    deletedAt: null,
  }).sort({ payDate: 1 }).lean();

  let totalGrossSalary = 0;
  let totalNetPay = 0;
  let totalTax = 0;
  let totalInsurance = 0;
  let totalMartyrsFund = 0;
  const paycheckMonthlyMap = {};

  for (const p of paychecks) {
    const gross = Number(p.grossSalary) || 0;
    const net = Number(p.netPay) || 0;
    const tax = Number(p.taxDetails?.actualTax) || 0;
    const ins = Number(p.insuranceDetails?.actualEmployeeShare) || 0;
    const martyrs = Number(p.martyrsFund) || 0;

    totalGrossSalary += gross;
    totalNetPay += net;
    totalTax += tax;
    totalInsurance += ins;
    totalMartyrsFund += martyrs;

    if (p.payDate) {
      const ym = new Date(p.payDate).toISOString().substring(0, 7);
      if (!paycheckMonthlyMap[ym]) {
        paycheckMonthlyMap[ym] = { yearMonth: ym, grossSalary: 0, netPay: 0, tax: 0, insurance: 0 };
      }
      paycheckMonthlyMap[ym].grossSalary += gross;
      paycheckMonthlyMap[ym].netPay += net;
      paycheckMonthlyMap[ym].tax += tax;
      paycheckMonthlyMap[ym].insurance += ins;
    }
  }

  // 2. Expenditures
  const expenditures = await Expenditure.find({
    user: userObjectId,
    date: { $gte: periodStart, $lte: periodEnd },
    deletedAt: null,
  }).sort({ date: 1 }).lean();

  let totalSpent = 0;
  const expenditureMonthlyMap = {};

  for (const e of expenditures) {
    const val = Number(e.transactionValue) || 0;
    totalSpent += val;
    if (e.date) {
      const ym = new Date(e.date).toISOString().substring(0, 7);
      if (!expenditureMonthlyMap[ym]) {
        expenditureMonthlyMap[ym] = { yearMonth: ym, totalSpent: 0, count: 0 };
      }
      expenditureMonthlyMap[ym].totalSpent += val;
      expenditureMonthlyMap[ym].count += 1;
    }
  }

  const categoryAgg = await Expenditure.aggregate([
    {
      $match: {
        user: userObjectId,
        date: { $gte: periodStart, $lte: periodEnd },
        deletedAt: null,
      },
    },
    { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$categories', 'Uncategorized'] },
        totalSpent: { $sum: '$transactionValue' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
  ]);

  const spendByCategory = categoryAgg.map(c => ({
    category: c._id || 'Uncategorized',
    totalSpent: Number(c.totalSpent) || 0,
    count: c.count || 0,
  }));

  // 3. Credit Cards & Card Transactions
  const cards = await CreditCard.find({ user: userObjectId, deletedAt: null }).lean();
  const totalCreditLimit = cards.reduce((sum, c) => sum + (Number(c.limit) || 0), 0);
  const targetCardIds = cards.map(c => c._id);

  let totalOutstandingBalance = 0;
  if (targetCardIds.length > 0) {
    const cardBalances = await CardTransaction.aggregate([
      {
        $match: {
          card: { $in: targetCardIds },
          user: userObjectId,
          type: { $in: ['Purchase', 'Installment'] },
          status: { $in: ['Due', 'Partial'] },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] },
          },
        },
      },
    ]);
    if (cardBalances.length > 0) {
      totalOutstandingBalance = Number(cardBalances[0].total) || 0;
    }
  }

  const cardTransactions = await CardTransaction.find({
    user: userObjectId,
    date: { $gte: periodStart, $lte: periodEnd },
    deletedAt: null,
  }).lean();

  let totalCardCharged = 0;
  let totalCardPaid = 0;
  for (const ct of cardTransactions) {
    const amt = ct.amount !== undefined && ct.amount !== null ? Number(ct.amount) : (ct.amountInPiastres ? ct.amountInPiastres / 100 : 0);
    const paid = ct.paidAmount !== undefined && ct.paidAmount !== null ? Number(ct.paidAmount) : (ct.paidAmountInPiastres ? ct.paidAmountInPiastres / 100 : 0);
    totalCardCharged += amt;
    totalCardPaid += paid;
  }

  // 4. Stock Market Trades
  const trades = await Trade.find({
    user: userObjectId,
    date: { $gte: periodStart, $lte: periodEnd },
    deletedAt: null,
  }).sort({ date: 1 }).lean();

  const stockHoldings = {};
  let tradeRealizedGains = 0;
  let totalTradeBuyValue = 0;
  let totalTradeSellValue = 0;
  let totalDividendIncome = 0;

  for (const t of trades) {
    const code = t.stockCode || 'UNKNOWN';
    if (!stockHoldings[code]) stockHoldings[code] = { cumShares: 0, cumCost: 0 };
    const h = stockHoldings[code];
    const shares = Number(t.shares) || 0;
    const price = Number(t.price) || 0;
    const fees = Number(t.fees) || 0;

    if (t.type === 'Buy') {
      const buyVal = shares * price + fees;
      totalTradeBuyValue += buyVal;
      h.cumShares += shares;
      h.cumCost += buyVal;
    } else if (t.type === 'Sell') {
      const sellVal = shares * price - fees;
      totalTradeSellValue += sellVal;
      const avgBuyPrice = h.cumShares > 0 ? (h.cumCost / h.cumShares) : 0;
      const costBasis = avgBuyPrice * shares;
      tradeRealizedGains += (sellVal - costBasis);
      h.cumShares = Math.max(0, h.cumShares - shares);
      h.cumCost = Math.max(0, h.cumCost - costBasis);
    } else if (t.type === 'Dividend') {
      totalDividendIncome += price;
    }
  }

  // 5. Mutual Fund Trades
  const mfTrades = await MutualFundTrade.find({
    user: userObjectId,
    date: { $gte: periodStart, $lte: periodEnd },
    deletedAt: null,
  }).sort({ date: 1 }).lean();

  const mfHoldings = {};
  let mfRealizedGains = 0;
  let totalMfSubscriptions = 0;
  let totalMfRedemptions = 0;
  let totalCouponIncome = 0;

  for (const mt of mfTrades) {
    const code = mt.code || mt.name || 'UNKNOWN';
    if (!mfHoldings[code]) mfHoldings[code] = { cumUnits: 0, cumCost: 0 };
    const h = mfHoldings[code];
    const units = Number(mt.units) || 0;
    const price = Number(mt.price) || 0;
    const fees = Number(mt.fees) || 0;

    if (mt.type === 'Buy') {
      const subVal = units * price + fees;
      totalMfSubscriptions += subVal;
      h.cumUnits += units;
      h.cumCost += subVal;
    } else if (mt.type === 'Sell') {
      const redVal = units * price - fees;
      totalMfRedemptions += redVal;
      const avgPrice = h.cumUnits > 0 ? (h.cumCost / h.cumUnits) : 0;
      const costBasis = avgPrice * units;
      mfRealizedGains += (redVal - costBasis);
      h.cumUnits = Math.max(0, h.cumUnits - units);
      h.cumCost = Math.max(0, h.cumCost - costBasis);
    } else if (mt.type === 'Coupon') {
      totalCouponIncome += price;
    }
  }

  // 6. Gold Holdings
  const allGold = await Gold.find({ user: userObjectId, deletedAt: null }).lean();
  let endHoldingGrams = 0;
  let totalGoldPurchasesCost = 0;
  let periodGoldBoughtGrams = 0;
  let periodGoldSoldGrams = 0;

  for (const g of allGold) {
    const weight = Number(g.weight) || 0;
    const paid = Number(g.paid) || 0;
    const buyDate = g.date ? new Date(g.date) : null;
    const sellDate = g.sellingDate ? new Date(g.sellingDate) : null;

    if (buyDate && buyDate <= periodEnd) {
      endHoldingGrams += weight;
      totalGoldPurchasesCost += paid;
      if (buyDate >= periodStart) {
        periodGoldBoughtGrams += weight;
      }
    }
    if (sellDate && sellDate <= periodEnd) {
      endHoldingGrams = Math.max(0, endHoldingGrams - weight);
      if (sellDate >= periodStart) {
        periodGoldSoldGrams += weight;
      }
    }
  }

  // 7. Investment Certificates
  const certificates = await Certificate.find({
    user: userObjectId,
    startDate: { $lte: periodEnd },
    deletedAt: null,
    $and: [
      { $or: [{ maturityDate: null }, { maturityDate: { $gte: periodStart } }] },
      { $or: [{ status: { $ne: 'withdrawn' } }, { withdrawalDate: { $gte: periodStart } }] },
    ],
  }).lean();

  let totalCertificatesPrincipal = 0;
  let estimatedAccruedInterest = 0;

  for (const cert of certificates) {
    const principal = Number(cert.amount) || 0;
    const isActiveAtEnd = cert.status !== 'withdrawn' && (!cert.maturityDate || new Date(cert.maturityDate) >= periodEnd);
    if (isActiveAtEnd) {
      totalCertificatesPrincipal += principal;
    }
    const rate = Number(cert.interest || cert.annualInterestRate || cert.interestRate || 0) / 100;
    if (rate > 0 && principal > 0) {
      estimatedAccruedInterest += principal * rate;
    }
  }

  // 8. Foreign Currencies
  const currencies = await Currency.find({ user: userObjectId, deletedAt: null }).lean();
  let totalForexValuationEGP = 0;
  let periodForexCashFlow = 0;

  for (const curr of currencies) {
    const val = curr.currentValueInPiastres ? curr.currentValueInPiastres / 100 : (Number(curr.price) || 0);
    totalForexValuationEGP += val;
    if (curr.date && new Date(curr.date) >= periodStart && new Date(curr.date) <= periodEnd) {
      periodForexCashFlow += Number(curr.price) || 0;
    }
  }

  // 9. Real Estate
  const properties = await RealEstate.find({
    user: userObjectId,
    purchaseDate: { $lte: periodEnd },
    deletedAt: null,
    $or: [{ status: { $ne: 'Sold' } }, { sellingDate: { $gte: periodStart } }],
  }).lean();

  const totalRealEstateAcquisitionCost = properties.reduce((sum, p) => sum + (Number(p.purchasePrice) || 0), 0);
  const totalRealEstateMarketValue = properties.reduce((sum, p) => sum + (Number(p.currentValuation) || 0), 0);

  // 10. Budgets & Utilization
  const budgets = await Budget.find({ user: userObjectId, deletedAt: null }).lean();
  const budgetCategories = budgets.map(b => b.category).filter(Boolean);
  let budgetUtilization = [];

  if (budgetCategories.length > 0) {
    const spendByBudgetCategory = await Expenditure.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: periodStart, $lte: periodEnd },
          deletedAt: null,
        },
      },
      { $unwind: '$categories' },
      { $match: { categories: { $in: budgetCategories } } },
      {
        $group: {
          _id: '$categories',
          spent: { $sum: '$transactionValue' },
        },
      },
    ]);

    const spendMap = {};
    for (const s of spendByBudgetCategory) {
      spendMap[s._id] = Number(s.spent) || 0;
    }

    budgetUtilization = budgets.map(b => {
      const actual = spendMap[b.category] || 0;
      const budgetAmount = Number(b.amount) || 0;
      return {
        category: b.category,
        budgetedAmount: budgetAmount,
        actualSpent: actual,
        utilizationPercentage: budgetAmount > 0 ? Number(((actual / budgetAmount) * 100).toFixed(1)) : 0,
      };
    });
  }

  // 11. Debt Payoff Plan
  const debtPlan = await DebtPayoffPlan.findOne({ user: userObjectId, isActive: true, deletedAt: null }).lean();
  const debtSummary = debtPlan
    ? {
        hasActivePlan: true,
        strategy: debtPlan.strategy,
        projectedPayoffDate: debtPlan.projectedPayoffDate,
        monthlyBudget: Number(debtPlan.monthlyBudget) || 0,
        totalInterestSaved: debtPlan.totalInterestSavedInPiastres ? debtPlan.totalInterestSavedInPiastres / 100 : 0,
      }
    : {
        hasActivePlan: false,
        totalInterestSaved: 0,
      };

  // 12. Categorization Rules & Coverage
  const activeRulesCount = await CategorizationRule.countDocuments({
    user: userObjectId,
    isActive: true,
    deletedAt: null,
  });

  const totalPeriodExpenditures = expenditures.length;
  const categorizedCount = expenditures.filter(e => {
    const cats = e.categories || [];
    return cats.length > 0 && cats[0] !== 'Other' && cats[0] !== 'Uncategorized';
  }).length;

  const autoCategorizationCoverage = totalPeriodExpenditures > 0
    ? Number(((categorizedCount / totalPeriodExpenditures) * 100).toFixed(1))
    : 100;

  // Executive KPI Summary
  const investedAssets = totalTradeBuyValue + totalMfSubscriptions + totalGoldPurchasesCost + totalCertificatesPrincipal + totalRealEstateMarketValue;
  const liquidAssets = totalForexValuationEGP;
  const totalLiabilities = totalOutstandingBalance;
  const netWorth = liquidAssets + investedAssets - totalLiabilities;

  const totalGrossIncome = totalGrossSalary + totalDividendIncome + tradeRealizedGains + totalCouponIncome + mfRealizedGains;
  const totalExpenses = totalSpent + totalTax + totalInsurance + totalMartyrsFund;
  const savingsRate = totalGrossIncome > 0 ? Number(((totalGrossIncome - totalExpenses) / totalGrossIncome * 100).toFixed(1)) : 0;

  return {
    meta: {
      userId: userId.toString(),
      startYear,
      endYear,
      generatedAt: new Date().toISOString(),
    },
    kpi: {
      netWorth,
      liquidAssets,
      investedAssets,
      totalLiabilities,
      totalGrossIncome,
      totalExpenses,
      savingsRate,
    },
    payroll: {
      totalGrossSalary,
      totalNetPay,
      totalTax,
      totalInsurance,
      totalMartyrsFund,
      monthlyTrend: Object.values(paycheckMonthlyMap).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
    },
    expenditures: {
      totalSpent,
      spendByCategory,
      monthlyTrend: Object.values(expenditureMonthlyMap).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
    },
    creditCards: {
      totalLimit: totalCreditLimit,
      currentBalance: totalOutstandingBalance,
      periodCharged: totalCardCharged,
      periodPaid: totalCardPaid,
    },
    investments: {
      equities: {
        totalBuyValue: totalTradeBuyValue,
        totalSellValue: totalTradeSellValue,
        realizedGains: tradeRealizedGains,
        dividendIncome: totalDividendIncome,
      },
      mutualFunds: {
        totalSubscriptions: totalMfSubscriptions,
        totalRedemptions: totalMfRedemptions,
        realizedGains: mfRealizedGains,
        couponIncome: totalCouponIncome,
      },
      gold: {
        endHoldingGrams,
        totalCost: totalGoldPurchasesCost,
        periodBoughtGrams: periodGoldBoughtGrams,
        periodSoldGrams: periodGoldSoldGrams,
      },
      certificates: {
        totalPrincipalHeld: totalCertificatesPrincipal,
        estimatedAccruedInterest,
      },
      realEstate: {
        acquisitionCost: totalRealEstateAcquisitionCost,
        currentMarketValue: totalRealEstateMarketValue,
      },
    },
    currency: {
      totalForexValuationEGP,
      periodCashFlow: periodForexCashFlow,
    },
    budget: {
      categories: budgetUtilization,
    },
    debtPayoff: debtSummary,
    categorizationRules: {
      activeRulesCount,
      autoCategorizationCoverage,
    },
  };
}

module.exports = {
  parseYearRange,
  generateComprehensiveReport,
};
