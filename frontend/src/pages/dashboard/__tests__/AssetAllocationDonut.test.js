// frontend/src/pages/dashboard/__tests__/AssetAllocationDonut.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AssetAllocationDonut from '../AssetAllocationDonut';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

describe('Step 8B.1b: AssetAllocationDonut Component Tests [AUD-ARCH-001]', () => {
  const baseHoldings = [
    {
      key: 'gold',
      name: 'Gold',
      current: 300000,
      invested: 200000,
      color: '#f59e0b',
      viewPath: '/gold-wallet',
    },
    {
      key: 'stocks',
      name: 'Stocks',
      current: 700000,
      invested: 500000,
      color: '#34d399',
      viewPath: '/trades',
    },
  ];

  const renderComponent = (props = {}) => {
    const defaultProps = {
      holdings: baseHoldings,
      canModify: true,
      onOpenLauncher: jest.fn(),
    };
    return render(<AssetAllocationDonut {...defaultProps} {...props} />);
  };

  // Test 1: renders Doughnut chart component and center net-worth value callout
  test('1. renders Doughnut chart component and center net-worth value callout', () => {
    renderComponent();
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    expect(screen.getByText('Current value')).toBeInTheDocument();
    expect(screen.getByText('$1,000,000.00')).toBeInTheDocument();
    expect(screen.getByText('2 asset classes')).toBeInTheDocument();
  });

  // Test 2: switches toggle state between Current and Invested without affecting parent
  test('2. switches toggle state between Current and Invested without affecting parent', () => {
    renderComponent();
    const investedBtn = screen.getByRole('button', { name: /^invested$/i });
    expect(investedBtn).not.toHaveClass('active');

    fireEvent.click(investedBtn);
    expect(investedBtn).toHaveClass('active');
    expect(screen.getByText('Total invested')).toBeInTheDocument();
    expect(screen.getByText('$700,000.00')).toBeInTheDocument();

    const currentBtn = screen.getByRole('button', { name: /^current$/i });
    fireEvent.click(currentBtn);
    expect(currentBtn).toHaveClass('active');
    expect(screen.getByText('Current value')).toBeInTheDocument();
  });

  // Test 3: renders interactive legend items with color dots, asset names, and share percentages
  test('3. renders interactive legend items with color dots, asset names, and share percentages', () => {
    renderComponent();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('$300,000.00')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();

    expect(screen.getByText('Stocks')).toBeInTheDocument();
    expect(screen.getByText('$700,000.00')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
  });

  // Test 4: links each legend item to the corresponding asset view route
  test('4. links each legend item to the corresponding asset view route', () => {
    renderComponent();
    const goldLink = screen.getByText('Gold').closest('a');
    expect(goldLink).toHaveAttribute('href', '/gold-wallet');

    const stockLink = screen.getByText('Stocks').closest('a');
    expect(stockLink).toHaveAttribute('href', '/trades');
  });

  // Test 5: renders empty placeholder when total portfolio value is zero
  test('5. renders empty placeholder when total portfolio value is zero', () => {
    renderComponent({ holdings: [] });
    expect(screen.getByText('No holdings yet')).toBeInTheDocument();
    expect(screen.queryByTestId('doughnut-chart')).not.toBeInTheDocument();
  });

  // Test 6: shows '+ Add a holding' button in empty state when canModify is true
  test('6. shows "+ Add a holding" button in empty state when canModify is true', () => {
    const onOpenLauncher = jest.fn();
    renderComponent({ holdings: [], canModify: true, onOpenLauncher });

    const addBtn = screen.getByRole('button', { name: /add a holding/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(onOpenLauncher).toHaveBeenCalledWith('create');
  });

  // Test 7: hides '+ Add a holding' button in empty state when canModify is false
  test('7. hides "+ Add a holding" button in empty state when canModify is false', () => {
    renderComponent({ holdings: [], canModify: false });
    expect(screen.queryByRole('button', { name: /add a holding/i })).not.toBeInTheDocument();
  });
});
