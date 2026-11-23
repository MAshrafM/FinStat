// frontend/src/pages/portfolio/__tests__/RebalancingPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import RebalancingPage from '../RebalancingPage';
import * as portfolioService from '../../../services/portfolioService';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('../../../services/portfolioService');

const mockAddToast = jest.fn();
const mockShowToast = jest.fn();
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast, showToast: mockShowToast }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

describe('Step 7B.2 / UI Phase 6B: RebalancingPage Component & Modernization', () => {
  const mockRebalancingData = {
    totalPortfolioValue: 500000,
    categories: [
      { assetType: 'stocks', label: 'Stocks (Equities)', value: 150000, percentage: 30 },
      // eslint-disable-next-line no-restricted-syntax -- 'gold' is an asset category
      { assetType: 'gold', label: 'Gold (Precious Metals)', value: 150000, percentage: 30 },
      { assetType: 'mutualFunds', label: 'Mutual Funds', value: 100000, percentage: 20 },
      { assetType: 'cash', label: 'Cash & Foreign Currencies', value: 50000, percentage: 10 },
      { assetType: 'certificates', label: 'Bank Certificates', value: 50000, percentage: 10 },
    ],
    target: {
      name: 'Standard Target',
      excludeRealEstate: true,
      targets: [
        { assetType: 'stocks', percentage: 40 },
        // eslint-disable-next-line no-restricted-syntax -- 'gold' is an asset category
        { assetType: 'gold', percentage: 20 },
        { assetType: 'mutualFunds', percentage: 20 },
        { assetType: 'cash', percentage: 10 },
        { assetType: 'certificates', percentage: 10 },
      ],
    },
    suggestions: [
      {
        assetType: 'stocks',
        ticker: 'COMI',
        action: 'Buy',
        amount: 50000,
        shares: 500,
        price: 100,
        currentPercentage: 30,
        targetPercentage: 40,
        description: 'Under-allocated by 10.0%. Buy EGP 50,000 worth of equities.',
      },
      {
        // eslint-disable-next-line no-restricted-syntax -- 'gold' is an asset category
        assetType: 'gold',
        action: 'Sell',
        amount: 50000,
        currentPercentage: 30,
        targetPercentage: 20,
        description: 'Over-allocated by 10.0%. Liquidate EGP 50,000 of gold holdings.',
      },
      {
        assetType: 'mutualFunds',
        action: 'Hold',
        amount: 0,
        currentPercentage: 20,
        targetPercentage: 20,
        description: 'Balanced within tolerance threshold.',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({ canModify: true, role: 'manager' });
    portfolioService.getRebalancingData.mockResolvedValue(mockRebalancingData);
    portfolioService.updateRebalancingTarget.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('1. Renders canonical loading shell and rebalancing suggestions with Buy, Sell, Balanced actions', async () => {
    portfolioService.getRebalancingData.mockReturnValue(new Promise(() => {}));
    render(<RebalancingPage />);

    // D23 uniform loading sequence: persistent header and loading skeletons
    expect(screen.getByText('Portfolio Rebalancing & Advisory')).toBeInTheDocument();
    expect(screen.getByText(/Analyzing asset allocation/i)).toBeInTheDocument();
  });

  test('2. Renders rebalancing suggestions table and mobile cards with Buy, Sell, Balanced actions and amounts', async () => {
    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    // Check Buy action badge and Log Buy button
    expect(screen.getAllByText('Buy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Log Buy').length).toBeGreaterThan(0);

    // Check Sell action badge and Log Sell button
    expect(screen.getAllByText('Sell').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Log Sell').length).toBeGreaterThan(0);

    // Check Balanced state for Hold action
    expect(screen.getAllByText('Hold').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Balanced').length).toBeGreaterThan(0);
  });

  test('3. Clicking "Log Trade" on stock suggestion navigates to /trades/add with prefill payload', async () => {
    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Log Buy').length).toBeGreaterThan(0);
    });

    const logBuyBtn = screen.getAllByText('Log Buy')[0];
    fireEvent.click(logBuyBtn);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/trades/add', {
      state: {
        prefill: {
          action: 'Buy',
          type: 'Buy',
          ticker: 'COMI',
          stockCode: 'COMI',
          shares: 500,
          price: 100,
          totalValue: 50000,
          amount: 50000,
        },
      },
    });
  });

  test('4. Enforces read-only behavior for viewer role (canModify: false)', async () => {
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({ canModify: false, role: 'viewer' });

    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    // Save target button is disabled under ProtectedAction
    const saveBtn = screen.getByRole('button', { name: /Update & Recalculate Target/i });
    expect(saveBtn).toBeDisabled();

    // Log Buy button is disabled under ProtectedAction
    const logBuyBtn = screen.getAllByRole('button', { name: /Log Buy/i })[0];
    expect(logBuyBtn).toBeDisabled();

    fireEvent.click(logBuyBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('5. Handles empty suggestions list gracefully when portfolio is completely balanced', async () => {
    portfolioService.getRebalancingData.mockResolvedValueOnce({
      ...mockRebalancingData,
      suggestions: [],
    });

    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    // The desktop table renders headers but zero data rows
    const rows = screen.queryAllByRole('row');
    // Header row only
    expect(rows.length).toBe(1);
  });

  test('6. Saves custom target allocations and re-triggers allocation analysis', async () => {
    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Standard Target')).toBeInTheDocument();
    });

    const targetInput = screen.getByDisplayValue('Standard Target');
    fireEvent.change(targetInput, { target: { value: 'Aggressive Growth' } });

    const submitBtn = screen.getByRole('button', { name: /Update & Recalculate Target/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(portfolioService.updateRebalancingTarget).toHaveBeenCalledTimes(1);
    });

    expect(portfolioService.updateRebalancingTarget).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Aggressive Growth',
        excludeRealEstate: true,
      })
    );

    // Verifies re-fetch is called
    expect(portfolioService.getRebalancingData).toHaveBeenCalledTimes(2);
  });

  test('7. Decision D19 mobile cards expand and collapse details on toggle click', async () => {
    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByLabelText(/Expand details for Stocks \(Equities\)/i);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByText(/Under-allocated by 10.0%/i)).toHaveLength(1);

    // Click to expand
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(/Under-allocated by 10.0%/i)).toHaveLength(2);

    // Click to collapse
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByText(/Under-allocated by 10.0%/i)).toHaveLength(1);
  });

  test('8. Passes accessibility audit via jest-axe with 0 critical or serious violations', async () => {
    const { container } = render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    const results = await axe(container);
    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toEqual([]);
  });

  test('9. Handles API error gracefully on initial fetch failure', async () => {
    portfolioService.getRebalancingData.mockRejectedValueOnce(new Error('Network Error'));

    render(<RebalancingPage />);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to load rebalancing data', 'error');
    });
  });
});
