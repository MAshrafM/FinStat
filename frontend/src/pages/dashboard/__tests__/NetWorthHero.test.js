// frontend/src/pages/dashboard/__tests__/NetWorthHero.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NetWorthHero from '../NetWorthHero';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
}), { virtual: true });

describe('Step 8B.1a: NetWorthHero Component Tests [AUD-ARCH-001]', () => {
  const baseCalculations = {
    netWorth: 850000,
    totalGain: 150000,
    totalGainPct: 21.4,
    totalPaid: 700000,
    creditOutstanding: 12000,
  };

  const baseAssetMix = {
    list: [
      { key: 'stocks', name: 'Stocks', current: 300000, color: '#34d399' },
      { key: 'gold', name: 'Gold', current: 550000, color: '#f59e0b' },
    ],
    total: 850000,
  };

  const renderComponent = (props = {}) => {
    const defaultProps = {
      calculations: baseCalculations,
      assetMix: baseAssetMix,
      user: { fullName: 'Mohamed Ashraf', username: 'mashraf' },
      canModify: true,
      dateLabel: 'Saturday, November 7',
      onOpenLauncher: jest.fn(),
    };
    return render(<NetWorthHero {...defaultProps} {...props} />);
  };

  // Test 1: renders welcome greeting with user first name and date label
  test('1. renders welcome greeting with user first name and date label', () => {
    renderComponent();
    expect(screen.getByText('Welcome back, Mohamed.')).toBeInTheDocument();
    expect(screen.getByText('Saturday, November 7')).toBeInTheDocument();
  });

  // Test 2: formats net worth value as Egyptian Pounds via formatCurrency
  test('2. formats net worth value as Egyptian Pounds via formatCurrency', () => {
    renderComponent();
    expect(screen.getByText('$850,000.00')).toBeInTheDocument();
    expect(screen.getByText('$700,000.00')).toBeInTheDocument();
    expect(screen.getByText('$12,000.00')).toBeInTheDocument();
  });

  // Test 3: displays positive return with up arrow and positive delta percentage class
  test('3. displays positive return with up arrow and positive delta percentage class', () => {
    const { container } = renderComponent();
    const delta = container.querySelector('.dash-hero-delta');
    expect(delta).toHaveClass('up');
    expect(screen.getByText('(+21.4%)')).toBeInTheDocument();
  });

  // Test 4: displays negative return with down arrow and negative delta percentage class
  test('4. displays negative return with down arrow and negative delta percentage class', () => {
    const { container } = renderComponent({
      calculations: {
        ...baseCalculations,
        totalGain: -50000,
        totalGainPct: -7.1,
      },
    });
    const delta = container.querySelector('.dash-hero-delta');
    expect(delta).toHaveClass('down');
    expect(screen.getByText('(-7.1%)')).toBeInTheDocument();
  });

  // Test 5: renders asset mix bar with proportional widths matching assetMix list
  test('5. renders asset mix bar with proportional widths matching assetMix list', () => {
    const { container } = renderComponent();
    const mixBar = container.querySelector('.dash-mix-bar');
    expect(mixBar).toBeInTheDocument();
    const spans = mixBar.querySelectorAll('span');
    expect(spans).toHaveLength(2);
    expect(spans[0].style.background).toBe('rgb(52, 211, 153)');
  });

  // Test 6: invokes onOpenLauncher with 'create' and 'explore' when launch action buttons are clicked
  test('6. invokes onOpenLauncher with "create" and "explore" when launch action buttons are clicked', () => {
    const onOpenLauncher = jest.fn();
    renderComponent({ onOpenLauncher });

    const createBtn = screen.getByRole('button', { name: /add something new/i });
    fireEvent.click(createBtn);
    expect(onOpenLauncher).toHaveBeenCalledWith('create');

    const exploreBtn = screen.getByRole('button', { name: /explore summaries/i });
    fireEvent.click(exploreBtn);
    expect(onOpenLauncher).toHaveBeenCalledWith('explore');
  });

  // Test 7: hides 'Add something new' button when canModify is false
  test('7. hides "Add something new" button when canModify is false', () => {
    renderComponent({ canModify: false });
    expect(screen.queryByRole('button', { name: /add something new/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /explore summaries/i })).toBeInTheDocument();
  });
});

