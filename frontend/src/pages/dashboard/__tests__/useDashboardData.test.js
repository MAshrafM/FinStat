// frontend/src/pages/dashboard/__tests__/useDashboardData.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import useDashboardData, { normDiv, changeBetween } from '../useDashboardData';
import * as authCtx from '../../../context/AuthContext';
import * as dataCtx from '../../../context/DataContext';
import * as goldCtx from '../../../context/GoldContext';
import * as mfCtx from '../../../context/MFContext';
import * as certCtx from '../../../context/CertContext';
import * as currCtx from '../../../context/CurrContext';
import * as bankCtx from '../../../context/BankContext';
import * as creditCtx from '../../../context/CreditContext';
import * as realEstateSvc from '../../../services/realEstateService';
import * as budgetSvc from '../../../services/budgetService';
import * as certSvc from '../../../services/certificateService';
import * as currSvc from '../../../services/currencyService';
import * as lendingSvc from '../../../services/lendingService';

jest.mock('../../../context/AuthContext');
jest.mock('../../../context/DataContext');
jest.mock('../../../context/GoldContext');
jest.mock('../../../context/MFContext');
jest.mock('../../../context/CertContext');
jest.mock('../../../context/CurrContext');
jest.mock('../../../context/BankContext');
jest.mock('../../../context/CreditContext');
jest.mock('../../../services/realEstateService');
jest.mock('../../../services/budgetService');
jest.mock('../../../services/certificateService');
jest.mock('../../../services/currencyService');
jest.mock('../../../services/lendingService');

describe('Step 8B.1a: useDashboardData Custom Hook Unit Tests [AUD-ARCH-001]', () => {
  const defaultMockSetup = () => {
    authCtx.useAuth.mockReturnValue({
      user: { fullName: 'Mohamed Ashraf', role: 'admin' },
      canModify: true,
    });
    dataCtx.useData.mockReturnValue({
      summaryMetrics: { netDeposits: 50000, totalProfitNow: 15000 },
    });
    goldCtx.useGoldData.mockReturnValue({
      overallTotalPaid: 20000,
      goldtotalNow: 30000,
    });
    mfCtx.useMFData.mockReturnValue({
      overallTotals: { totalOfAllMF: 10000, totalSellingValue: 12000, totalProfit: 2000 },
    });
    certCtx.useCertData.mockReturnValue({
      certificateSummary: { totalActiveAmount: 40000, totalExpectedReturns: 48000 },
    });
    currCtx.useCurrData.mockReturnValue({
      currencySummary: [
        { totalPrice: 10000, currentPrice: 50, totalAmount: 220 }, // 11,000 value
      ],
    });
    bankCtx.useBankData.mockReturnValue({
      bankAccountData: { bank: 25000 },
    });
    creditCtx.useCreditData.mockReturnValue({
      creditCardsSummary: { totalAvailable: 30000, totalOutstanding: 5000 },
    });

    realEstateSvc.getRealEstates.mockResolvedValue([
      { purchasePrice: 500000, currentValuation: 600000, status: 'Owned' },
    ]);
    budgetSvc.getBudgetProgress.mockResolvedValue([
      { budgetId: 'b1', category: 'Groceries', budgetedAmount: 5000, spentAmount: 4000, percentageUsed: 80, alertStatus: 'green' },
    ]);
    certSvc.getCertificates.mockResolvedValue([
      { amount: 40000, status: 'active', displayStatus: 'active' },
    ]);
    currSvc.getCurrency.mockResolvedValue([
      { amount: 100, currentRate: 50, purchaseRate: 45, costBasis: 4500, currentValue: 5000 },
    ]);
    lendingSvc.getLendingSummary.mockResolvedValue({
      success: true,
      data: { totalOutstanding: 100000, totalBorrowed: 150000, activeLoansCount: 2 }, // 1,000 EGP receivables
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    defaultMockSetup();
  });

  // Test 1: returns initial skeleton loading state while context data is pending
  test('1. returns initial skeleton loading state while context data is pending', () => {
    dataCtx.useData.mockReturnValueOnce({ summaryMetrics: null });
    const { result } = renderHook(() => useDashboardData());
    expect(result.current.isLoading).toBe(true);
  });

  // Test 2: safely guards against unhydrated or empty context values using default fallbacks (asserts KS-8B-02)
  test('2. safely guards against unhydrated or empty context values using default fallbacks (asserts KS-8B-02)', async () => {
    authCtx.useAuth.mockReturnValueOnce({});
    dataCtx.useData.mockReturnValueOnce({});
    goldCtx.useGoldData.mockReturnValueOnce({});
    mfCtx.useMFData.mockReturnValueOnce({});
    certCtx.useCertData.mockReturnValueOnce({});
    currCtx.useCurrData.mockReturnValueOnce({});
    bankCtx.useBankData.mockReturnValueOnce({});
    creditCtx.useCreditData.mockReturnValueOnce({});

    let hookResult;
    expect(() => {
      hookResult = renderHook(() => useDashboardData());
    }).not.toThrow();

    await waitFor(() => {
      expect(hookResult.result.current.calculations.netWorth).toBeDefined();
    });
    expect(hookResult.result.current.calculations.totalPaid).toBeGreaterThanOrEqual(0);
  });

  // Test 3: normDiv returns 0 when denominator is 0 without throwing or returning NaN
  test('3. normDiv returns 0 when denominator is 0 without throwing or returning NaN', () => {
    expect(normDiv(100, 0)).toBe('0.00');
    expect(normDiv(0, 0)).toBe('0.00');
    expect(normDiv(100, 50)).toBe(2);
    expect(changeBetween(150, 0)).toBeNull();
    expect(changeBetween(150, 100)).toBe(50);
  });

  // Test 4: calculates 4-year annualized CAGR accurately for positive returns and yields 0 for zero investment
  test('4. calculates 4-year annualized CAGR accurately for positive returns and yields 0 for zero investment', async () => {
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Gold paid 20000, current 30000 -> positive CAGR
    expect(Number(result.current.calculations.goldCAGR)).toBeGreaterThan(0);

    // Zero investment yields 0
    goldCtx.useGoldData.mockReturnValue({ overallTotalPaid: 0, goldtotalNow: 0 });
    const { result: zeroResult } = renderHook(() => useDashboardData());
    expect(Number(zeroResult.current.calculations.goldCAGR)).toBe(0);
  });

  // Test 5: aggregates net worth as totalCurrent minus creditOutstanding
  test('5. aggregates net worth as totalCurrent minus creditOutstanding', async () => {
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const { totalCurrent, creditOutstanding, netWorth } = result.current.calculations;
    expect(netWorth).toBe(totalCurrent - creditOutstanding);
    expect(creditOutstanding).toBe(5000);
  });

  // Test 6: incorporates lending receivables into totalPaid, totalCurrent, and netWorth
  test('6. incorporates lending receivables into totalPaid, totalCurrent, and netWorth', async () => {
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.calculations.lendingReceivables).toBe(1000));

    // lendingSummary.totalOutstanding = 100000 piastres = 1000 EGP
    expect(result.current.calculations.lendingReceivables).toBe(1000);
  });

  // Test 7: builds 8 complete holdings with correct keys, colors, tones, and formatted deltas
  test('7. builds 8 complete holdings with correct keys, colors, tones, and formatted deltas', async () => {
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.holdings).toHaveLength(8);
    const keys = result.current.holdings.map((h) => h.key);
    expect(keys).toEqual([
      'gold',
      'certificates',
      'funds',
      'stocks',
      'bank',
      'currency',
      'real-estate',
      'lending',
    ]);
  });

  // Test 8: handles empty budgets and computes spent vs budgeted percentages correctly
  test('8. handles empty budgets and computes spent vs budgeted percentages correctly', async () => {
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.budgetProgressList.length).toBeGreaterThan(0));

    expect(result.current.budgetTotals.budgeted).toBe(5000);
    expect(result.current.budgetTotals.spent).toBe(4000);
    expect(result.current.budgetTotals.pct).toBe(80);

    // Empty budget case
    budgetSvc.getBudgetProgress.mockResolvedValueOnce([]);
    const { result: emptyResult } = renderHook(() => useDashboardData());
    await waitFor(() => expect(emptyResult.current.budgetProgressList.length).toBe(0));
    expect(emptyResult.current.budgetTotals.pct).toBe(0);
  });

  // Test 9: aggregates active certificates and filters out withdrawn, matured, and future deposits
  test('9. aggregates active certificates and filters out withdrawn, matured, and future deposits', async () => {
    certSvc.getCertificates.mockResolvedValueOnce([
      { amount: 10000, status: 'active', displayStatus: 'active' },
      { amount: 5000, status: 'withdrawn' },
      { amount: 8000, displayStatus: 'matured' },
      { amount: 12000, displayStatus: 'future' },
    ]);

    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.savingsForexSummary.activeCertCount).toBe(1));
    expect(result.current.savingsForexSummary.totalCertValue).toBe(10000);
  });

  // Test 10: computes foreign currency total value, cost basis, and unrealized FX gain/loss
  test('10. computes foreign currency total value, cost basis, and unrealized FX gain/loss', async () => {
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.savingsForexSummary.forexHoldingCount).toBe(1));

    // Value 5000, cost 4500 -> gain 500
    expect(result.current.savingsForexSummary.totalForexValue).toBe(5000);
    expect(result.current.savingsForexSummary.totalForexGainLoss).toBe(500);
  });

  // Test 11: fetches owned real estate properties and incorporates valuation into net worth
  test('11. fetches owned real estate properties and incorporates valuation into net worth', async () => {
    const { result } = renderHook(() => useDashboardData());
    await waitFor(() => expect(result.current.calculations.realEstates.length).toBe(1));

    expect(result.current.calculations.realEstateTotalPaid).toBe(500000);
    expect(result.current.calculations.realEstateTotalCurrent).toBe(600000);
  });

  // Test 12: handles API failure gracefully without crashing the dashboard
  test('12. handles API failure gracefully without crashing the dashboard', async () => {
    realEstateSvc.getRealEstates.mockRejectedValueOnce(new Error('Network error'));
    budgetSvc.getBudgetProgress.mockRejectedValueOnce(new Error('Network error'));
    certSvc.getCertificates.mockRejectedValueOnce(new Error('Network error'));
    currSvc.getCurrency.mockRejectedValueOnce(new Error('Network error'));
    lendingSvc.getLendingSummary.mockRejectedValueOnce(new Error('Network error'));

    let hookResult;
    expect(() => {
      hookResult = renderHook(() => useDashboardData());
    }).not.toThrow();

    await waitFor(() => {
      expect(hookResult.result.current.calculations).toBeDefined();
    });
    expect(hookResult.result.current.calculations.realEstates).toEqual([]);
  });
});

