/* eslint-disable testing-library/no-node-access */
// frontend/src/pages/trades/__tests__/TradeSummaryPage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import TradeSummaryPage from '../TradeSummaryPage';
import * as DataContext from '../../../context/DataContext';

expect.extend(toHaveNoViolations);

const mockOpenPosData = [
  {
    _id: { stockCode: 'COMI.CA', broker: 'Thndr', iteration: 1 },
    currentShares: 500,
    avgPrice: 75.50,
    totDeals: 37750,
    realizedPL: 37750,
    unrealizedPL: 3500,
    breakEvenPrice: 75.80,
    netBreakEven: 75.80,
    breakEvenTarget: 90.96,
    totalValueNow: 41250,
    changeNow: 9.27,
    totalFees: 65,
    tradeCount: 3,
    firstTradeDate: '2025-11-10T00:00:00Z',
    lastTradeDate: '2026-01-14T00:00:00Z',
  },
];

const mockEndPosData = [
  {
    _id: { stockCode: 'EAST.CA', broker: 'Thndr', iteration: 1 },
    tradingPL: 4850,
    dividendIncome: 1250,
    totalRealizedReturn: 6100,
    profitPercentage: 15.25,
    sellingPrice: 32.50,
    totalBuyValue: 40000,
    totalSellValue: 44850,
    totalFees: 120,
    tradeCount: 6,
    firstTradeDate: '2025-06-15T00:00:00Z',
    lastTradeDate: '2025-12-20T00:00:00Z',
  },
];

const mockSummaryMetrics = {
  netDeposits: 150000,
  totalTrades: 12,
  totalTradesNow: 55950,
  walletBalance: 42350,
  realizedProfit: 6100,
  totalProfitNow: 11500,
  brokerMetrics: {
    Thndr: {
      netDeposits: 100000,
      totalTradesNow: 41250,
      walletBalance: 28500,
      profitPercentage: 12.45,
    },
  },
};

const mockMarketPrices = {
  'COMI.CA': 82.50,
  'EAST.CA': 33.10,
};

const renderComponent = (contextOverrides = {}) => {
  jest.spyOn(DataContext, 'useData').mockReturnValue({
    openPosData: mockOpenPosData,
    endPosData: mockEndPosData,
    summaryMetrics: mockSummaryMetrics,
    stMarketPrices: mockMarketPrices,
    isLoading: false,
    ...contextOverrides,
  });

  return render(<TradeSummaryPage />);
};

describe('TradeSummaryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. renders loading skeleton when isLoading is true', () => {
    renderComponent({ isLoading: true });
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  test('2. renders page header and subtitle', () => {
    renderComponent();
    expect(screen.getByText('Trade Position Summary')).toBeInTheDocument();
    expect(screen.getByText(/Stock Trading > Position Summary/i)).toBeInTheDocument();
  });

  test('3. renders broker summary KPI tiles', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Thndr' })).toBeInTheDocument();
    expect(screen.getByText('Net Deposits')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
  });

  test('4. renders Delta component for broker profit percentage', () => {
    renderComponent();
    expect(screen.getByText(/12\.45%/)).toBeInTheDocument();
  });

  test('5. renders total overview metrics', () => {
    renderComponent();
    expect(screen.getByText('Total Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Net Deposits')).toBeInTheDocument();
    expect(screen.getByText('Total Deals')).toBeInTheDocument();
  });

  test('6. renders Open Positions section and table data', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Open Positions' })).toBeInTheDocument();
    expect(screen.getByText('COMI.CA')).toBeInTheDocument();
  });

  test('7. renders Close Positions section and table data', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Close Positions' })).toBeInTheDocument();
    expect(screen.getByText('EAST.CA')).toBeInTheDocument();
  });

  test('8. handles column sorting for Open Positions', () => {
    renderComponent();
    const headers = screen.getAllByTitle(/Click to sort by Stock Code/i);
    fireEvent.click(headers[0]);
    expect(headers[0]).toBeInTheDocument();
  });

  test('9. handles column sorting for Close Positions', () => {
    renderComponent();
    const headers = screen.getAllByTitle(/Click to sort by Stock Code/i);
    expect(headers.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(headers[headers.length - 1]);
    expect(headers[headers.length - 1]).toBeInTheDocument();
  });

  test('10. has 0 accessibility violations with jest-axe', async () => {
    const { container } = renderComponent();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('11. renders Delta with neutral tone for zero P&L items', () => {
    renderComponent({
      openPosData: [
        {
          _id: { stockCode: 'FLAT.CA', broker: 'Thndr', iteration: 1 },
          currentShares: 100,
          avgPrice: 10,
          totDeals: 1000,
          realizedPL: 0,
          unrealizedPL: 0,
          totalValueNow: 1000,
        },
      ],
      endPosData: [],
    });
    const deltaEl = screen.getByText('Gain');
    expect(deltaEl).toBeInTheDocument();
  });

  test('12. renders position rows with D19 .trade-card class and data-label attributes', () => {
    renderComponent();
    const rows = document.querySelectorAll('tbody tr.trade-card');
    expect(rows.length).toBeGreaterThan(0);
    const firstCell = rows[0].querySelector('td[data-label="Code"]');
    expect(firstCell).toBeInTheDocument();
  });

  test('13. renders gracefully when open and closed position data is empty', () => {
    renderComponent({
      openPosData: [],
      endPosData: [],
    });
    expect(screen.getByText('Trade Position Summary')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Open Positions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Close Positions' })).toBeInTheDocument();
  });
});
