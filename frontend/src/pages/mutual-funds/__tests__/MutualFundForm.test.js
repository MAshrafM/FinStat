// frontend/src/pages/mutual-funds/__tests__/MutualFundForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MutualFundForm from '../MutualFundForm';
import * as mutualFundService from '../../../services/mutualFundService';

jest.mock('../../../services/mutualFundService', () => ({
  getMutualFundByCode: jest.fn().mockResolvedValue([]),
  getAllMutualFundTrades: jest.fn().mockResolvedValue([]),
}));

describe('Phase 7C.0 MutualFundForm Bridge UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. renders source AccountSelector when transaction type is Buy', () => {
    render(<MutualFundForm initialData={{ type: 'Buy' }} onFormSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/source account/i)).toBeInTheDocument();
    // Destination account selector should NOT be present for Buy
    expect(screen.queryByLabelText(/destination account/i)).not.toBeInTheDocument();
    // autoReinvest toggle should NOT be present for Buy
    expect(screen.queryByLabelText(/auto-reinvest coupon/i)).not.toBeInTheDocument();
  });

  it('2. renders destination AccountSelector and autoReinvest toggle when transaction type is Coupon', () => {
    render(<MutualFundForm initialData={{ type: 'Coupon' }} onFormSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/destination account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auto-reinvest coupon/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/source account/i)).not.toBeInTheDocument();
  });

  it('3. disables destination AccountSelector when autoReinvest is checked', () => {
    render(<MutualFundForm initialData={{ type: 'Coupon', autoReinvest: false }} onFormSubmit={jest.fn()} />);

    const destSelect = screen.getByLabelText(/destination account/i);
    expect(destSelect).not.toBeDisabled();

    const checkbox = screen.getByLabelText(/auto-reinvest coupon/i);
    fireEvent.click(checkbox);

    expect(destSelect).toBeDisabled();
  });

  it('4. submits sourceAccount, destinationAccount, and autoReinvest values on form submit', async () => {
    const handleSubmit = jest.fn();
    render(
      <MutualFundForm
        initialData={{
          type: 'Coupon',
          name: 'AZ Opportunity Fund',
          code: 'AZO',
          units: 100,
          price: 5,
          fees: 0,
          totalValue: 500,
          destinationAccount: 'Cash',
          autoReinvest: false,
        }}
        onFormSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /create transaction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const submitted = handleSubmit.mock.calls[0][0];
      expect(submitted.destinationAccount).toBe('Cash');
      expect(submitted.autoReinvest).toBe(false);
      expect(submitted.totalValue).toBe(500);
    });
  });
});
