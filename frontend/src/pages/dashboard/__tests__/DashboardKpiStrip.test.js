// frontend/src/pages/dashboard/__tests__/DashboardKpiStrip.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardKpiStrip from '../DashboardKpiStrip';

describe('Step 8B.1a: DashboardKpiStrip Component Tests [AUD-ARCH-001]', () => {
  const baseCalculations = {
    totalPaid: 500000,
    totalGain: 120000,
    totalGainPct: 24.0,
    bankBalance: 75000,
    creditAvailable: 45000,
  };

  const baseBudgetTotals = {
    budgeted: 20000,
    spent: 14000,
    pct: 70,
  };

  const renderComponent = (props = {}) => {
    const defaultProps = {
      calculations: baseCalculations,
      budgetTotals: baseBudgetTotals,
      activeAssetCount: 5,
    };
    return render(<DashboardKpiStrip {...defaultProps} {...props} />);
  };

  // Test 1: renders Invested Capital KPI tile with active asset classes count
  test('1. renders Invested Capital KPI tile with active asset classes count', () => {
    renderComponent();
    expect(screen.getByText('Invested capital')).toBeInTheDocument();
    expect(screen.getByText('$500,000.00')).toBeInTheDocument();
    expect(screen.getByText('5 active asset classes')).toBeInTheDocument();
  });

  // Test 2: renders Portfolio Return KPI tile with positive/negative color tone class
  test('2. renders Portfolio Return KPI tile with positive/negative color tone class', () => {
    const { container, rerender } = renderComponent();
    expect(screen.getByText('Portfolio return')).toBeInTheDocument();
    expect(screen.getByText('$120,000.00')).toBeInTheDocument();
    expect(screen.getByText('+24.0% vs invested')).toBeInTheDocument();

    // Rerender with negative return
    rerender(
      <DashboardKpiStrip
        calculations={{
          ...baseCalculations,
          totalGain: -30000,
          totalGainPct: -6.0,
        }}
        budgetTotals={baseBudgetTotals}
        activeAssetCount={4}
      />
    );
    expect(screen.getByText('-$30,000.00')).toBeInTheDocument();
    expect(screen.getByText('-6.0% vs invested')).toBeInTheDocument();
  });

  // Test 3: renders Liquid Cash KPI tile with bank balance and available credit
  test('3. renders Liquid Cash KPI tile with bank balance and available credit', () => {
    renderComponent();
    expect(screen.getByText('Liquid cash')).toBeInTheDocument();
    expect(screen.getByText('$75,000.00')).toBeInTheDocument();
    expect(screen.getByText('$45,000.00 credit available')).toBeInTheDocument();
  });

  // Test 4: renders Budget Used KPI tile with percentage and spent amount
  test('4. renders Budget Used KPI tile with percentage and spent amount', () => {
    renderComponent();
    expect(screen.getByText('Budget used')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('$14,000.00 of $20,000.00')).toBeInTheDocument();
  });

  // Test 5: displays fallback em-dash when no monthly budget is set
  test('5. displays fallback em-dash when no monthly budget is set', () => {
    renderComponent({
      budgetTotals: { budgeted: 0, spent: 0, pct: 0 },
    });
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('No budget set for this month')).toBeInTheDocument();
  });
});

