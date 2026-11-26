/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/gold/__tests__/GoldSummaryPage.test.js
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import GoldSummaryPage from '../GoldSummaryPage';
import { useGoldData } from '../../../context/GoldContext';

jest.mock('../../../context/GoldContext', () => ({
  useGoldData: jest.fn(),
}));

expect.extend(toHaveNoViolations);

const CONTEXT_VALUE = {
  goldSummary: [
    {
      karat: 24,
      totalWeight: 10,
      totalPaid: 1000,
      status: 'hold',
    },
    {
      karat: 22,
      totalWeight: 5,
      totalPaid: 500,
      totalSellingPrice: 650,
      avgHoldingDays: 90,
      status: 'sold',
    },
  ],
  marketPrices: { 24: 120, 22: 110 },
  overallTotalPaid: 1000,
  goldtotalNow: 1150,
  isLoading: false,
  error: null,
};

const renderPage = (overrides = {}) => {
  useGoldData.mockReturnValue({ ...CONTEXT_VALUE, ...overrides });
  return render(<GoldSummaryPage />);
};

describe('GoldSummaryPage Component (Phase 8A)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. renders loading and tokenized error states', () => {
    useGoldData.mockReturnValue({ ...CONTEXT_VALUE, isLoading: true });
    const view = render(<GoldSummaryPage />);

    expect(screen.getByText('Loading gold holdings...')).toBeInTheDocument();
    expect(screen.getByRole('status').className).toContain('fs-loading--card');

    view.rerender(<GoldSummaryPage />);
    useGoldData.mockReturnValue({ ...CONTEXT_VALUE, error: new Error('summary failed') });
    view.rerender(<GoldSummaryPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load gold holdings');
  });

  test('2. renders six neutral KPI tiles including the 24K weight', () => {
    const { container } = renderPage();

    expect(container.querySelectorAll('.gold-kpi-card').length).toBe(6);
    expect(container.querySelectorAll('.gold-kpi-card .fs-num').length).toBeGreaterThanOrEqual(5);
    expect(container.querySelector('.gold-kpi-card .fs-delta-value')).not.toBeNull();
    expect(container.querySelectorAll('.gold-kpi-card .gold-kpi-label')[2]).toHaveTextContent('24K Equiv. Weight');
    expect(screen.getByText('10.000g')).toBeInTheDocument();
    expect(container.querySelector('.gold-kpi-card [style]')).toBeNull();
  });

  test('3. Delta renders sign, value, and Gain/Loss labels without colour-only signalling', () => {
    renderPage();

    const kpiDelta = document.querySelector('.gold-kpi-card .fs-delta');
    expect(kpiDelta).not.toBeNull();
    expect(kpiDelta.className).toContain('fs-delta--positive');
    expect(kpiDelta.querySelector('.fs-delta-value').textContent).toBe('+15.00%');
    expect(kpiDelta.querySelector('.fs-delta-label').textContent).toBe('Gain');
    expect(kpiDelta.textContent).not.toMatch(/[▲▼↑↓]/);

    const soldDelta = document.querySelectorAll('.gold-table')[1].querySelector('.fs-delta');
    expect(soldDelta.querySelector('.fs-delta-value').textContent).toBe('+$150.00');
  });

  test('4. renders the eight-column hold table and its compact card', () => {
    const { container } = renderPage();
    const table = screen.getAllByRole('table')[0];

    expect(within(table).getAllByRole('columnheader').length).toBe(8);
    expect(within(table).getByRole('columnheader', { name: /24K Equiv. Weight/i })).toBeInTheDocument();
    expect(within(table).getAllByText('10.0000g').length).toBeGreaterThan(0);
    expect(within(table).getByText('120')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="gold-summary-mobile-card-list"]')).not.toBeNull();
  });

  test('5. renders the sold table and its compact card', () => {
    const { container } = renderPage();
    const table = screen.getAllByRole('table')[1];

    expect(within(table).getAllByRole('columnheader').length).toBe(6);
    expect(within(table).getByText('22K')).toBeInTheDocument();
    expect(within(table).getByText('$650.00')).toBeInTheDocument();
    expect(within(table).getByText('90 days')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="gold-summary-sold-mobile-card-list"]')).not.toBeNull();
  });

  test('6. I3 math: equivGrams and totalEquivalentGrams use karat / 24', () => {
    renderPage();

    expect(screen.getAllByText('10.0000g').length).toBeGreaterThan(0);
    expect(screen.getByText('10.000g')).toBeInTheDocument();
  });

  test('7. I3 math: totalStandardizedValue = totalEquivalentGrams x 24K spot', () => {
    renderPage();

    expect(screen.getAllByText('$1,200.00').length).toBeGreaterThanOrEqual(2);
  });

  test('8. I3 math: currentValue = totalWeight x currentPricePerGram', () => {
    renderPage();

    expect(screen.getAllByText('$1,200.00').length).toBeGreaterThanOrEqual(2);
  });

  test('9. I3 math: profitLoss and rateOfChange for hold and sold rows', () => {
    renderPage();

    expect(screen.getAllByText('+$200.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(20.00%)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+$150.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(30.00%)').length).toBeGreaterThan(0);
  });

  test('10. I3 math: overallSoldValue = sum of sold totals', () => {
    renderPage();

    expect(screen.getAllByText('$650.00').length).toBeGreaterThan(0);
  });

  test('11. D19 cards expose all fields with no page-level overflow at 390px', () => {
    window.innerWidth = 390;
    renderPage();

    fireEvent.click(screen.getByLabelText('Expand holding details'));
    fireEvent.click(screen.getByLabelText('Expand sold details'));

    const holdDrawer = document.querySelector('.gold-card-expanded');
    expect(within(holdDrawer).getByText('Total Weight (g)')).toBeInTheDocument();
    expect(within(holdDrawer).getByText('Current Price/g')).toBeInTheDocument();
    expect(within(holdDrawer).getByText('24K Std. Value')).toBeInTheDocument();
    expect(within(holdDrawer).getByText('Rate of Change')).toBeInTheDocument();

    const soldDrawer = document.querySelectorAll('.gold-card-expanded')[1];
    expect(within(soldDrawer).getByText('Avg. Holding Period')).toBeInTheDocument();
    expect(within(soldDrawer).getByText('Total Selling Price')).toBeInTheDocument();

    expect(document.querySelector('.gold-page-container').getAttribute('style')).toBeNull();
    expect(document.documentElement.getAttribute('style')).toBeNull();
  });

  test('12. passes a jest-axe accessibility audit with zero critical/serious violations', async () => {
    const { container } = renderPage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
