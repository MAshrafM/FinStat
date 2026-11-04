// frontend/src/pages/portfolio/__tests__/RebalancingPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Step 7B.2: RebalancingPage Component & Closed-Loop Execution Bridge [FEAT-004, GAP-001]', () => {
  const mockRebalancingData = {
    totalPortfolioValue: 500000,
    categories: [
      { assetType: 'stocks', label: 'Stocks (Equities)', value: 150000, percentage: 30, color: '#3498db' },
      { assetType: 'gold', label: 'Gold (Precious Metals)', value: 150000, percentage: 30, color: '#f1c40f' },
      { assetType: 'mutualFunds', label: 'Mutual Funds', value: 100000, percentage: 20, color: '#9b59b6' },
      { assetType: 'cash', label: 'Cash & Foreign Currencies', value: 50000, percentage: 10, color: '#2ecc71' },
      { assetType: 'certificates', label: 'Bank Certificates', value: 50000, percentage: 10, color: '#e67e22' },
    ],
    target: {
      name: 'Standard Target',
      excludeRealEstate: true,
      targets: [
        { assetType: 'stocks', percentage: 40 },
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

  test('1. Renders rebalancing suggestions table with Buy, Sell, Balanced actions and amounts', async () => {
    render(<RebalancingPage />);

    expect(screen.getByText(/Analyzing asset allocation/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    // Check Buy action badge and Log Buy button
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Log Buy')).toBeInTheDocument();

    // Check Sell action badge and Log Sell button
    expect(screen.getByText('Sell')).toBeInTheDocument();
    expect(screen.getByText('Log Sell')).toBeInTheDocument();

    // Check Balanced state for Hold action
    expect(screen.getByText('Hold')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  test('2. Clicking "Log Trade" on stock suggestion navigates to /trades/add with prefill payload', async () => {
    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Log Buy')).toBeInTheDocument();
    });

    const logBuyBtn = screen.getByText('Log Buy');
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

  test('3. Enforces read-only behavior for viewer role (canModify: false)', async () => {
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({ canModify: false, role: 'viewer' });

    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    // Save target button is disabled under ProtectedAction
    const saveBtn = screen.getByRole('button', { name: /Update & Recalculate Target/i });
    expect(saveBtn).toBeDisabled();

    // Log Buy button is disabled under ProtectedAction
    const logBuyBtn = screen.getByText('Log Buy').closest('button');
    expect(logBuyBtn).toBeDisabled();

    fireEvent.click(logBuyBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('4. Handles empty suggestions list gracefully when portfolio is completely balanced', async () => {
    portfolioService.getRebalancingData.mockResolvedValueOnce({
      ...mockRebalancingData,
      suggestions: [],
    });

    render(<RebalancingPage />);

    await waitFor(() => {
      expect(screen.getByText('Actionable Rebalancing Suggestions')).toBeInTheDocument();
    });

    // The table renders headers but zero data rows
    const rows = screen.queryAllByRole('row');
    // Header row only
    expect(rows.length).toBe(1);
  });

  test('5. Saves custom target allocations and re-triggers allocation analysis', async () => {
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
});
