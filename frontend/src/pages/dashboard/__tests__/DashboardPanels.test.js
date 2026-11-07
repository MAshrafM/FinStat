// frontend/src/pages/dashboard/__tests__/DashboardPanels.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import BudgetPulseCard from '../BudgetPulseCard';
import SavingsForexCard from '../SavingsForexCard';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

describe('Step 8B.1c: DashboardPanels Component Tests [AUD-ARCH-001]', () => {
  describe('BudgetPulseCard', () => {
    const mockBudgetList = [
      {
        budgetId: 'b1',
        category: 'Groceries',
        budgetedAmount: 5000,
        spentAmount: 4800,
        percentageUsed: 96,
        alertStatus: 'red',
      },
      {
        budgetId: 'b2',
        category: 'Utilities',
        budgetedAmount: 2000,
        spentAmount: 800,
        percentageUsed: 40,
        alertStatus: 'green',
      },
    ];

    // Test 1: renders BudgetPulseCard with monthly category progress bars and percentages
    test('1. renders BudgetPulseCard with monthly category progress bars and percentages', () => {
      render(<BudgetPulseCard budgetProgressList={mockBudgetList} monthLabel="November 2026" />);
      expect(screen.getByText(/November 2026 · spending against category limits/i)).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('96%')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    // Test 2: applies red alert color when budget exceeds threshold percentage
    test('2. applies red alert color when budget exceeds threshold percentage', () => {
      const { container } = render(
        <BudgetPulseCard budgetProgressList={mockBudgetList} monthLabel="November 2026" />
      );
      const spans = container.querySelectorAll('.dash-budget-track span');
      // Red alert status -> #f87171 -> rgb(248, 113, 113)
      expect(spans[0].style.background).toBe('rgb(248, 113, 113)');
    });

    // Test 3: applies green alert color when budget is within safe threshold
    test('3. applies green alert color when budget is within safe threshold', () => {
      const { container } = render(
        <BudgetPulseCard budgetProgressList={mockBudgetList} monthLabel="November 2026" />
      );
      const spans = container.querySelectorAll('.dash-budget-track span');
      // Green alert status -> #34d399 -> rgb(52, 211, 153)
      expect(spans[1].style.background).toBe('rgb(52, 211, 153)');
    });

    // Test 4: renders empty budget state with 'Set up budgets' link when no budgets exist
    test('4. renders empty budget state with "Set up budgets" link when no budgets exist', () => {
      render(<BudgetPulseCard budgetProgressList={[]} monthLabel="November 2026" />);
      expect(screen.getByText('No budgets for November 2026')).toBeInTheDocument();
      const setupLink = screen.getByRole('link', { name: /set up budgets/i });
      expect(setupLink).toHaveAttribute('href', '/expenditures/budgets');
    });
  });

  describe('SavingsForexCard', () => {
    const mockSummary = {
      activeCertCount: 3,
      totalCertValue: 350000,
      forexHoldingCount: 2,
      totalForexValue: 75000,
      totalForexGainLoss: 8500,
    };

    const mockRealEstates = [
      { id: 're1', name: 'Apartment New Cairo' },
    ];

    // Test 5: renders SavingsForexCard with active certificates count and total value
    test('5. renders SavingsForexCard with active certificates count and total value', () => {
      render(
        <SavingsForexCard
          savingsForexSummary={mockSummary}
          realEstates={mockRealEstates}
          realEstateTotalCurrent={950000}
        />
      );
      expect(screen.getByText('Certificates')).toBeInTheDocument();
      expect(screen.getByText('3 active deposit(s)')).toBeInTheDocument();
      expect(screen.getByText('$350,000.00')).toBeInTheDocument();
    });

    // Test 6: displays foreign currency holdings count and total converted value
    test('6. displays foreign currency holdings count and total converted value', () => {
      render(
        <SavingsForexCard
          savingsForexSummary={mockSummary}
          realEstates={mockRealEstates}
          realEstateTotalCurrent={950000}
        />
      );
      expect(screen.getByText('Foreign currency')).toBeInTheDocument();
      expect(screen.getByText('2 holding(s)')).toBeInTheDocument();
      expect(screen.getByText('$75,000.00')).toBeInTheDocument();
    });

    // Test 7: displays unrealized FX gain with plus sign and positive color class
    test('7. displays unrealized FX gain with plus sign and positive color class', () => {
      const { container } = render(
        <SavingsForexCard
          savingsForexSummary={mockSummary}
          realEstates={mockRealEstates}
          realEstateTotalCurrent={950000}
        />
      );
      expect(screen.getByText('+$8,500.00')).toBeInTheDocument();
      const valueSpan = container.querySelector('.dash-savings-value.positive');
      expect(valueSpan).toBeInTheDocument();
    });

    // Test 8: renders real estate properties summary note with total property valuation
    test('8. renders real estate properties summary note with total property valuation', () => {
      render(
        <SavingsForexCard
          savingsForexSummary={mockSummary}
          realEstates={mockRealEstates}
          realEstateTotalCurrent={950000}
        />
      );
      expect(screen.getByText(/1 property valued at/i)).toBeInTheDocument();
      expect(screen.getByText('$950,000.00')).toBeInTheDocument();
      const viewLink = screen.getByRole('link', { name: /^view/i });
      expect(viewLink).toHaveAttribute('href', '/real-estate');
    });
  });
});
