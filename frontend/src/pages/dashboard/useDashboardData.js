// frontend/src/pages/dashboard/useDashboardData.js
import { useEffect, useMemo, useState } from 'react';
import {
  FaChartLine,
  FaChartPie,
  FaExchangeAlt,
  FaGem,
  FaHandshake,
  FaHome,
  FaLandmark,
  FaUniversity,
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useGoldData } from '../../context/GoldContext';
import { useMFData } from '../../context/MFContext';
import { useCertData } from '../../context/CertContext';
import { useCurrData } from '../../context/CurrContext';
import { useBankData } from '../../context/BankContext';
import { useCreditData } from '../../context/CreditContext';
import { getRealEstates } from '../../services/realEstateService';
import { getBudgetProgress } from '../../services/budgetService';
import { getCertificates } from '../../services/certificateService';
import { getCurrency } from '../../services/currencyService';
import { getLendingSummary } from '../../services/lendingService';
import { formatCurrency } from '../../utils/formatters';
import { normDiv as helperNormDiv } from '../../utils/helper';

export const normDiv = (val, base) => {
  if (typeof helperNormDiv === 'function') {
    return helperNormDiv(val, base);
  }
  if (!base || Number.isNaN(base) || base <= 0) return 0;
  return (val || 0) / base;
};

export const changeBetween = (current, base) => {
  if (!base || base <= 0) return null;
  return ((current - base) / base) * 100;
};

export const safeArray = (data) => (Array.isArray(data) ? data : []);
export const safeNumber = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0);
export const safeObject = (obj) => (obj && typeof obj === 'object' ? obj : {});

const INIT_YEAR = 2022;
const CURRENT_YEAR = new Date().getFullYear();
const INVESTMENT_PERIOD = Math.max(CURRENT_YEAR - INIT_YEAR, 1);

export const useDashboardData = () => {
  const { user = null, canModify = false } = useAuth() || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState(null);
  const [budgetProgressList, setBudgetProgressList] = useState([]);
  const [savingsForexSummary, setSavingsForexSummary] = useState({
    totalCertValue: 0,
    activeCertCount: 0,
    totalForexValue: 0,
    totalForexGainLoss: 0,
    forexHoldingCount: 0,
  });

  const { summaryMetrics = {} } = useData() || {};
  const { overallTotalPaid = 0, goldtotalNow = 0 } = useGoldData() || {};
  const { overallTotals = {} } = useMFData() || {};
  const { certificateSummary = {} } = useCertData() || {};
  const { currencySummary = [] } = useCurrData() || {};
  const { bankAccountData = {} } = useBankData() || {};
  const { creditCardsSummary = {} } = useCreditData() || {};
  const [realEstates, setRealEstates] = useState([]);
  const [lendingSummary, setLendingSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getRealEstates({ status: 'Owned' })
      .then((data) => {
        if (isMounted) setRealEstates(data || []);
      })
      .catch((err) => console.error('Failed to load real estate for summary:', err));

    getLendingSummary()
      .then((res) => {
        if (!isMounted) return;
        if (res?.success) setLendingSummary(res.data);
      })
      .catch((err) => console.error('Failed to load lending summary for dashboard:', err));

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    getBudgetProgress({ period: 'monthly', year: currentYear, month: currentMonth })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.data || [];
        setBudgetProgressList(list);
      })
      .catch(() => {
        if (isMounted) setBudgetProgressList([]);
      });

    Promise.all([getCertificates().catch(() => []), getCurrency().catch(() => [])])
      .then(([certsRes, currRes]) => {
        if (!isMounted) return;
        const certs = Array.isArray(certsRes) ? certsRes : certsRes?.data || [];
        const currs = Array.isArray(currRes) ? currRes : currRes?.data || [];

        const now = new Date();
        const activeCerts = certs.filter((cert) => {
          if (cert.status === 'withdrawn' || cert.status === 'matured') return false;
          if (
            cert.displayStatus === 'withdrawn' ||
            cert.displayStatus === 'matured' ||
            cert.displayStatus === 'future'
          ) {
            return false;
          }

          const start = cert.startDate ? new Date(cert.startDate) : null;
          if (start && now < start) return false;

          let maturity = cert.maturityDate ? new Date(cert.maturityDate) : null;
          if (!maturity && start && cert.period) {
            maturity = new Date(start);
            maturity.setMonth(maturity.getMonth() + Number(cert.period));
          }
          if (maturity && now > maturity) return false;

          return true;
        });

        const totalCertValue = activeCerts.reduce((acc, cert) => acc + Number(cert.amount || 0), 0);
        const totalForexValue = currs.reduce(
          (acc, curr) =>
            acc +
            Number(
              curr.currentValue ||
                curr.amount * (curr.currentRate || curr.purchaseRate || 0) ||
                0
            ),
          0
        );
        const totalForexCost = currs.reduce(
          (acc, curr) => acc + Number(curr.costBasis || curr.price || 0),
          0
        );

        setSavingsForexSummary({
          totalCertValue,
          activeCertCount: activeCerts.length,
          totalForexValue,
          totalForexGainLoss: totalForexValue - totalForexCost,
          forexHoldingCount: currs.length,
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const safeCurrencySummary = useMemo(() => safeArray(currencySummary), [currencySummary]);

  const calculations = useMemo(() => {
    const currencyTotalPrice = safeCurrencySummary.reduce(
      (sum, item) => sum + safeNumber(item.totalPrice),
      0
    );
    const currencyCurrentValue = safeCurrencySummary.reduce(
      (sum, item) => sum + safeNumber(item.currentPrice) * safeNumber(item.totalAmount),
      0
    );

    const goldPaid = safeNumber(overallTotalPaid);
    const goldCurrent = safeNumber(goldtotalNow);

    const certAmount = safeNumber(safeObject(certificateSummary).totalActiveAmount);
    const certReturns = safeNumber(safeObject(certificateSummary).totalExpectedReturns);

    const mfAmount = safeNumber(safeObject(overallTotals).totalOfAllMF);
    const mfValue = safeNumber(safeObject(overallTotals).totalSellingValue);
    const mfProfit = safeObject(overallTotals).totalProfit;

    const stockAmount = safeNumber(safeObject(summaryMetrics).netDeposits);
    const stockProfit = safeNumber(safeObject(summaryMetrics).totalProfitNow);
    const stockCurrent = stockAmount + stockProfit;

    const bankBalance = safeNumber(safeObject(bankAccountData).bank);
    const creditAvailable = safeNumber(safeObject(creditCardsSummary).totalAvailable);
    const creditOutstanding = safeNumber(safeObject(creditCardsSummary).totalOutstanding);

    const realEstateTotalPaid = realEstates.reduce(
      (sum, item) => sum + safeNumber(item.purchasePrice),
      0
    );
    const realEstateTotalCurrent = realEstates.reduce(
      (sum, item) => sum + safeNumber(item.currentValuation),
      0
    );

    const lendingReceivables = safeNumber(lendingSummary?.totalOutstanding) / 100;

    const totalPaid =
      goldPaid +
      certAmount +
      mfAmount +
      stockAmount +
      bankBalance +
      currencyTotalPrice +
      realEstateTotalPaid +
      lendingReceivables;
    const totalCurrent =
      goldCurrent +
      certAmount +
      mfValue +
      stockCurrent +
      bankBalance +
      currencyCurrentValue +
      realEstateTotalCurrent +
      lendingReceivables;

    const goldCAGR =
      goldPaid > 0
        ? ((Math.pow(normDiv(goldCurrent, goldPaid), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;
    const certCAGR =
      certAmount > 0
        ? ((Math.pow(normDiv(certReturns, certAmount), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;
    const mfCAGR =
      mfAmount > 0
        ? ((Math.pow(normDiv(mfValue, mfAmount), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;
    const stockCAGR =
      stockAmount > 0
        ? ((Math.pow(normDiv(stockCurrent, stockAmount), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;

    const totalGain = totalCurrent - totalPaid;
    const totalGainPct = totalPaid > 0 ? (totalGain / totalPaid) * 100 : 0;

    return {
      goldPaid,
      goldCurrent,
      goldCAGR,
      certAmount,
      certReturns,
      certCAGR,
      mfAmount,
      mfValue,
      mfProfit,
      mfCAGR,
      stockAmount,
      stockCurrent,
      stockCAGR,
      bankBalance,
      creditAvailable,
      creditOutstanding,
      currencyTotalPrice,
      currencyCurrentValue,
      realEstateTotalPaid,
      realEstateTotalCurrent,
      realEstates,
      lendingReceivables,
      totalPaid,
      totalCurrent,
      totalGain,
      totalGainPct,
      netWorth: totalCurrent - creditOutstanding,
    };
  }, [
    overallTotalPaid,
    goldtotalNow,
    certificateSummary,
    overallTotals,
    summaryMetrics,
    bankAccountData,
    creditCardsSummary,
    safeCurrencySummary,
    realEstates,
    lendingSummary,
  ]);

  const holdings = useMemo(() => {
    const c = calculations;

    return [
      {
        key: 'gold',
        name: 'Gold',
        subtitle: 'Bullion & jewellery',
        icon: FaGem,
        tone: 'gold',
        color: '#f59e0b',
        current: c.goldCurrent,
        invested: c.goldPaid,
        metaLabel: 'Invested',
        metaValue: c.goldPaid,
        delta: changeBetween(c.goldCurrent, c.goldPaid),
        viewPath: '/gold-wallet',
        addPath: '/gold-wallet/new',
      },
      {
        key: 'certificates',
        name: 'Certificates',
        subtitle: 'Fixed-income deposits',
        icon: FaUniversity,
        tone: 'sky',
        color: '#38bdf8',
        current: c.certAmount,
        invested: c.certAmount,
        metaLabel: 'Expected returns',
        metaValue: c.certReturns,
        delta: changeBetween(c.certReturns, c.certAmount),
        viewPath: '/certificates',
        addPath: '/certificates/new',
      },
      {
        key: 'funds',
        name: 'Mutual Funds',
        subtitle: 'Managed portfolios',
        icon: FaChartPie,
        tone: 'violet',
        color: '#a78bfa',
        current: c.mfValue,
        invested: c.mfAmount,
        metaLabel: 'Invested',
        metaValue: c.mfAmount,
        delta: changeBetween(c.mfValue, c.mfAmount),
        viewPath: '/mutual-funds',
        addPath: '/mutual-funds/new',
      },
      {
        key: 'stocks',
        name: 'Stocks',
        subtitle: 'Trading portfolio',
        icon: FaChartLine,
        tone: 'emerald',
        color: '#34d399',
        current: c.stockCurrent,
        invested: c.stockAmount,
        metaLabel: 'Net deposits',
        metaValue: c.stockAmount,
        delta: changeBetween(c.stockCurrent, c.stockAmount),
        viewPath: '/trades',
        addPath: '/trades/add',
      },
      {
        key: 'bank',
        name: 'Bank & Credit',
        subtitle: 'Cash and card accounts',
        icon: FaLandmark,
        tone: 'cyan',
        color: '#22d3ee',
        current: c.bankBalance,
        invested: c.bankBalance,
        metaLabel: 'Credit available',
        metaValue: c.creditAvailable,
        delta: null,
        note: c.creditOutstanding > 0 ? `${formatCurrency(c.creditOutstanding)} due` : 'No balance due',
        viewPath: '/credit-cards',
        addPath: null,
      },
      {
        key: 'currency',
        name: 'Foreign Currency',
        subtitle: 'Multi-currency wallet',
        icon: FaExchangeAlt,
        tone: 'rose',
        color: '#fb7185',
        current: c.currencyCurrentValue,
        invested: c.currencyTotalPrice,
        metaLabel: 'Cost basis',
        metaValue: c.currencyTotalPrice,
        delta: changeBetween(c.currencyCurrentValue, c.currencyTotalPrice),
        viewPath: '/currency',
        addPath: '/currency/new',
      },
      {
        key: 'real-estate',
        name: 'Real Estate',
        subtitle: 'Property portfolio',
        icon: FaHome,
        tone: 'amber',
        color: '#fbbf24',
        current: c.realEstateTotalCurrent,
        invested: c.realEstateTotalPaid,
        metaLabel: 'Purchase price',
        metaValue: c.realEstateTotalPaid,
        delta: changeBetween(c.realEstateTotalCurrent, c.realEstateTotalPaid),
        viewPath: '/real-estate',
        addPath: '/real-estate/new',
      },
      {
        key: 'lending',
        name: 'Receivables',
        subtitle: 'Personal loans & tracking',
        icon: FaHandshake,
        tone: 'indigo',
        color: '#6366f1',
        current: c.lendingReceivables,
        invested: c.lendingReceivables,
        metaLabel: 'Total Borrowed',
        metaValue: safeNumber(lendingSummary?.totalBorrowed) / 100,
        delta: null,
        note: (lendingSummary?.activeLoansCount || 0) > 0 ? `${lendingSummary.activeLoansCount} active loans` : 'No active loans',
        viewPath: '/lending',
        addPath: '/lending',
      },
    ];
  }, [calculations, lendingSummary]);

  const activeAssetCount = useMemo(
    () => holdings.filter((asset) => asset.current > 0 || asset.invested > 0).length,
    [holdings]
  );

  const assetMix = useMemo(() => {
    const list = holdings.filter((asset) => asset.current > 0);
    return {
      list,
      total: list.reduce((sum, asset) => sum + asset.current, 0),
    };
  }, [holdings]);

  const budgetTotals = useMemo(() => {
    const budgeted = budgetProgressList.reduce(
      (sum, item) => sum + safeNumber(item.budgetedAmount),
      0
    );
    const spent = budgetProgressList.reduce((sum, item) => sum + safeNumber(item.spentAmount), 0);

    return {
      budgeted,
      spent,
      pct: budgeted > 0 ? (spent / budgeted) * 100 : 0,
    };
  }, [budgetProgressList]);

  useEffect(() => {
    const hasMinimumData =
      summaryMetrics &&
      overallTotalPaid !== undefined &&
      overallTotals &&
      certificateSummary &&
      safeCurrencySummary &&
      bankAccountData &&
      creditCardsSummary;

    if (hasMinimumData) {
      setIsLoading(false);
    }
  }, [
    summaryMetrics,
    overallTotalPaid,
    overallTotals,
    certificateSummary,
    safeCurrencySummary,
    bankAccountData,
    creditCardsSummary,
  ]);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return {
    isLoading,
    error,
    user,
    canModify,
    calculations,
    assetMix,
    holdings,
    budgetTotals,
    budgetProgressList,
    savingsForexSummary,
    realEstates,
    lendingSummary,
    activeAssetCount,
    monthLabel,
    dateLabel,
  };
};

export default useDashboardData;

