import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditTransactionModal from '../EditTransactionModal';
import { updateTransaction } from '../../../services/creditCardService';
import { getCurrencyPrice } from '../../../services/currencyService';

jest.mock('../../../services/creditCardService', () => ({
  updateTransaction: jest.fn(),
}));

jest.mock('../../../services/currencyService', () => ({
  getCurrencyPrice: jest.fn(),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('EditTransactionModal - Multi-Currency Selector Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrencyPrice.mockResolvedValue([
      { currencyID: 'USD', buyRate: 48.2, sellRate: 48.5 },
      { currencyID: 'EUR', buyRate: 52.0, sellRate: 52.5 },
    ]);
  });

  it('pre-populates foreign transaction values and allows updating', async () => {
    const mockTransaction = {
      _id: 'tx123',
      description: 'Hostinger Hosting',
      amount: 4850,
      currency: 'USD',
      foreignAmount: 100,
      exchangeRateSnapshot: 48.5,
      date: '2026-10-15T00:00:00.000Z',
      type: 'Purchase',
    };

    render(
      <EditTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        transaction={mockTransaction}
        onTransactionUpdated={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getCurrencyPrice).toHaveBeenCalled();
    });

    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect.value).toBe('USD');

    const foreignInput = screen.getByLabelText(/amount \(usd\)/i);
    expect(foreignInput.value).toBe('100');

    const rateInput = screen.getByLabelText(/exchange rate/i);
    expect(rateInput.value).toBe('48.5');

    const convertedEgpValue = screen.getByTestId('converted-egp-value');
    expect(convertedEgpValue).toHaveTextContent(/4,850/);

    // Update foreign amount to 150
    fireEvent.change(foreignInput, { target: { value: '150' } });

    // Converted value updates to 7,275
    expect(convertedEgpValue).toHaveTextContent(/7,275/);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateTransaction).toHaveBeenCalledTimes(1);
    });

    const [txId, submittedData] = updateTransaction.mock.calls[0];
    expect(txId).toBe('tx123');
    expect(submittedData.currency).toBe('USD');
    expect(submittedData.foreignAmount).toBe(150);
    expect(submittedData.exchangeRateSnapshot).toBe(48.5);
    expect(submittedData.amount).toBe(7275);
  });
});
