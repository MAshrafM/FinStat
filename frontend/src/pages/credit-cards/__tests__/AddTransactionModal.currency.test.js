import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddTransactionModal from '../AddTransactionModal';
import { createTransaction } from '../../../services/creditCardService';
import { getCurrencyPrice } from '../../../services/currencyService';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('../../../services/creditCardService', () => ({
  createTransaction: jest.fn(),
}));

jest.mock('../../../services/currencyService', () => ({
  getCurrencyPrice: jest.fn(),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('AddTransactionModal.currency.test.js - Multi-Currency & Rate Lock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrencyPrice.mockResolvedValue([
      { currencyID: 'USD', buyRate: 48.2, sellRate: 48.5 },
      { currencyID: 'EUR', buyRate: 52.0, sellRate: 52.5 },
    ]);
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'manager' },
      isAdmin: false,
    });
  });

  it('renders currency selector, defaulting to EGP', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card-1"
        onTransactionAdded={jest.fn()}
      />
    );

    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect.value).toBe('EGP');
    expect(screen.getByLabelText(/total amount \(egp\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/amount \(usd\)/i)).not.toBeInTheDocument();
  });

  it('selecting USD reveals foreignAmount and exchangeRate inputs, and conversion preview', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card-1"
        onTransactionAdded={jest.fn()}
      />
    );

    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/amount \(usd\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/exchange rate/i)).toBeInTheDocument();
      expect(screen.getByTestId('conversion-confirmation-card')).toBeInTheDocument();
    });
  });

  it('disables exchangeRate input for non-admin users and shows helper text', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card-1"
        onTransactionAdded={jest.fn()}
      />
    );

    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    const rateInput = screen.getByLabelText(/exchange rate/i);
    expect(rateInput).toBeDisabled();
    expect(
      screen.getByText(/Rate is approximate for historical dates — actual rate is locked at save time/i)
    ).toBeInTheDocument();
  });

  it('enables exchangeRate input for admin users', async () => {
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'admin' },
      isAdmin: true,
    });

    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card-1"
        onTransactionAdded={jest.fn()}
      />
    );

    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    const rateInput = screen.getByLabelText(/exchange rate/i);
    expect(rateInput).not.toBeDisabled();
  });

  it('shows conversion preview of 100 USD at 48.50 EGP -> 4,850 EGP', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card-1"
        onTransactionAdded={jest.fn()}
      />
    );

    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    const foreignInput = screen.getByLabelText(/amount \(usd\)/i);
    fireEvent.change(foreignInput, { target: { value: '100' } });

    await waitFor(() => {
      const convertedValueEl = screen.getByTestId('converted-egp-value');
      expect(convertedValueEl.textContent).toContain('4,850.00');
    });
  });

  it('submits correct payload for USD transaction with foreignAmount and exchangeRateSnapshot', async () => {
    createTransaction.mockResolvedValueOnce({ _id: 'tx-new' });

    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card-1"
        onTransactionAdded={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Foreign Server' } });
    fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText(/amount \(usd\)/i), { target: { value: '100' } });

    const submitBtn = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalledTimes(1);
      const payload = createTransaction.mock.calls[0][0];
      expect(payload.currency).toBe('USD');
      expect(payload.foreignAmount).toBe(100);
      expect(payload.exchangeRateSnapshot).toBe(48.5);
      expect(payload.amount).toBe(4850);
    });
  });

  it('submits correct payload for standard EGP transaction (no foreign fields)', async () => {
    createTransaction.mockResolvedValueOnce({ _id: 'tx-egp' });

    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card-1"
        onTransactionAdded={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Local Grocery' } });
    fireEvent.change(screen.getByLabelText(/total amount \(egp\)/i), { target: { value: '350' } });

    const submitBtn = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalledTimes(1);
      const payload = createTransaction.mock.calls[0][0];
      expect(payload.currency).toBe('EGP');
      expect(payload.amount).toBe(350);
      expect(payload.foreignAmount).toBeUndefined();
      expect(payload.exchangeRateSnapshot).toBeUndefined();
    });
  });
});
