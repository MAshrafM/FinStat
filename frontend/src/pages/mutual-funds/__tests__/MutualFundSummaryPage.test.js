/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/mutual-funds/__tests__/MutualFundSummaryPage.test.js
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MutualFundSummaryPage from '../MutualFundSummaryPage';
import { useMFData } from '../../../context/MFContext';

jest.mock('../../../context/MFContext', () => ({
  useMFData: jest.fn(),
}));

expect.extend(toHaveNoViolations);

const SUMMARY_DATA = [
  {
    _id: { name: 'AZ Opportunity Fund', code: 'AZO' },
    currentUnits: 250,
    averagePrice: 46.4,
    totalValue: 12500,
    totalCouponValue: 500,
  },
  {
    _id: { name: 'Misr Equity Fund', code: 'MEF01' },
    currentUnits: 100,
    averagePrice: 100,
    totalValue: 10000,
    totalCouponValue: 0,
  },
];

const OVERALL_TOTALS = {
  totalOfAllMF: 22500,
  totalOfAllCoupons: 500,
  newTotal: 22000,
  totalSellingValue: 23125,
  totalProfit: '2.78',
};

const PRICE_DATA = [
  { name: 'AZ Opportunity Fund', lastPrice: 52.5 },
  { name: 'Misr Equity Fund', lastPrice: 0 },
];

const setMFData = (overrides = {}) => {
  useMFData.mockReturnValue({
    mfSummaryData: SUMMARY_DATA,
    overallTotals: OVERALL_TOTALS,
    lastPriceData: PRICE_DATA,
    isLoading: false,
    error: null,
    ...overrides,
  });
};

describe('MutualFundSummaryPage Component (Phase 7C)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMFData();
  });

  test('1. Null-price safety: renders without throwing, shows Price Unavailable and dash fallbacks', () => {
    setMFData({ lastPriceData: [{ name: 'AZ Opportunity Fund', lastPrice: 52.5 }] });

    let result;
    expect(() => {
      result = render(<MutualFundSummaryPage />);
    }).not.toThrow();

    expect(result.container.querySelector('table')).not.toBeNull();
    expect(screen.getByText('Price Unavailable')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  test('2. renders the loading card state', () => {
    useMFData.mockReturnValue({
      isLoading: true,
      mfSummaryData: [],
      overallTotals: null,
      lastPriceData: [],
      error: null,
    });

    render(<MutualFundSummaryPage />);

    expect(screen.getByText('Loading mutual fund holdings...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('3. renders a fetch-error card with role="alert"', () => {
    setMFData({ error: new Error('summary failed') });

    render(<MutualFundSummaryPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load holdings');
  });

  test('4. renders five neutral KPI tiles whose values use .fs-num', () => {
    const { container } = render(<MutualFundSummaryPage />);

    expect(container.querySelectorAll('.mf-kpi-card').length).toBe(5);
    expect(container.querySelectorAll('.mf-kpi-card .mf-kpi-value.fs-num').length).toBe(4);
    expect(container.querySelectorAll('.mf-kpi-card .fs-num').length).toBe(5);

    expect(screen.getByText('Total of all MF')).toBeInTheDocument();
    expect(screen.getByText('Total of all Coupons')).toBeInTheDocument();
    expect(screen.getByText('New Total')).toBeInTheDocument();
    expect(screen.getByText('Selling Value', { selector: '.mf-kpi-label' })).toBeInTheDocument();
    expect(screen.getByText('Profit')).toBeInTheDocument();
  });

  test('5. Delta renders sign, value, and Gain/Loss label without colour-only signalling', () => {
    const { container } = render(<MutualFundSummaryPage />);

    const delta = container.querySelector('.mf-kpi-card .fs-delta');
    expect(delta).not.toBeNull();
    expect(delta.className).toContain('fs-delta--positive');
    expect(delta.querySelector('.fs-delta-value').textContent).toBe('+2.78%');
    expect(delta.querySelector('.fs-delta-label').textContent).toBe('Gain');
    expect(delta.textContent).not.toMatch(/[▲▼↑↓]/);
  });

  test('6. Price Unavailable is a neutral badge with no warning tone', () => {
    render(<MutualFundSummaryPage />);

    const badge = screen.getByText('Price Unavailable');

    expect(badge.className).toContain('fs-badge');
    expect(badge.className).not.toContain('fs-badge--warning');
    expect(badge.className).not.toContain('fs-badge--positive');
    expect(badge.className).not.toContain('fs-badge--negative');
  });

  test('7. renders the cost-basis columns and values unchanged', () => {
    render(<MutualFundSummaryPage />);

    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', { name: 'Total Value (Cost Basis)' })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Total Coupons' })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('columnheader', { name: 'Value (Excluding Coupons)' })
    ).toBeInTheDocument();

    expect(within(table).getByText('$12,500.00')).toBeInTheDocument();
    expect(within(table).getByText('$500.00')).toBeInTheDocument();
    expect(within(table).getAllByText('$10,000.00').length).toBeGreaterThanOrEqual(1);
  });

  test('8. I3 math: valueWithoutCoupons = totalValue - totalCouponValue', () => {
    render(<MutualFundSummaryPage />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('$12,000.00')).toBeInTheDocument();
  });

  test('9. I3 math: sellingValue = currentPrice x currentUnits', () => {
    render(<MutualFundSummaryPage />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('$13,125.00')).toBeInTheDocument();
  });

  test('10. I3 math: totalProfit = (sellingValue / valueWithoutCoupons - 1) x 100', () => {
    render(<MutualFundSummaryPage />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('+9.38%')).toBeInTheDocument();
    expect(table.querySelector('.fs-delta--positive')).not.toBeNull();
  });

  test('11. D19 compact card expands into the detail drawer and collapses again', () => {
    const { container } = render(<MutualFundSummaryPage />);

    const cards = screen.getByTestId('mf-summary-mobile-card-list');
    expect(container.querySelectorAll('.mf-mobile-card').length).toBe(2);
    expect(within(cards).getAllByLabelText('Expand fund details').length).toBe(2);

    fireEvent.click(within(cards).getAllByLabelText('Expand fund details')[0]);

    const drawer = container.querySelector('.mf-card-expanded');
    expect(drawer).not.toBeNull();
    expect(within(drawer).getByText('Current Units')).toBeInTheDocument();
    expect(within(drawer).getByText('Avg. Price Paid')).toBeInTheDocument();
    expect(within(drawer).getByText('Total Value (Cost Basis)')).toBeInTheDocument();
    expect(within(drawer).getByText('Total Coupons')).toBeInTheDocument();
    expect(within(drawer).getByText('Value (Excluding Coupons)')).toBeInTheDocument();
    expect(within(drawer).getByText('Current Price')).toBeInTheDocument();

    fireEvent.click(within(cards).getByLabelText('Collapse fund details'));
    expect(container.querySelector('.mf-card-expanded')).toBeNull();
  });

  test('12. passes a jest-axe accessibility audit with zero critical/serious violations', async () => {
    const { container } = render(<MutualFundSummaryPage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
