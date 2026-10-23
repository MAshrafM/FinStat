import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddTransactionModal from '../AddTransactionModal';
import { createTransaction } from '../../../services/creditCardService';
import { getCurrencyPrice } from '../../../services/currencyService';

jest.mock('../../../services/creditCardService', () => ({
  createTransaction: jest.fn(),
}));

jest.mock('../../../services/currencyService', () => ({
  getCurrencyPrice: jest.fn(),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('AddTransactionModal - Multi-Currency Selector Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrencyPrice.mockResolvedValue([
      { currencyID: 'USD', buyRate: 48.2, sellRate: 48.5 },
      { currencyID: 'EUR', buyRate: 52.0, sellRate: 52.5 },
    ]);
  });

  it('renders with EGP as default and hides foreignAmount input', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card123"
        onTransactionAdded={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getCurrencyPrice).toHaveBeenCalled();
    });

    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect.value).toBe('EGP');

    // Total Amount (EGP) should be visible
    expect(screen.getByLabelText(/total amount \(egp\)/i)).toBeInTheDocument();

    // Foreign amount input and confirmation card should NOT be present
    expect(screen.queryByLabelText(/foreign amount/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('conversion-confirmation-card')).not.toBeInTheDocument();
  });

  it('displays foreignAmount input and confirmation card when currency is changed to USD', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card123"
        onTransactionAdded={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getCurrencyPrice).toHaveBeenCalled();
    });

    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    expect(currencySelect.value).toBe('USD');
    expect(screen.getByLabelText(/foreign amount \(usd\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exchange rate/i)).toBeInTheDocument();
    expect(screen.getByTestId('conversion-confirmation-card')).toBeInTheDocument();
  });

  it('auto-displays converted EGP equivalent and calculates monthly principal for installments in USD', async () => {
    render(
      <AddTransactionModal
        isOpen={true}
        onClose={jest.fn()}
        cardId="card123"
        onTransactionAdded={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getCurrencyPrice).toHaveBeenCalled();
    });

    // Select USD
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    // Set rate to 50.0 explicitly
    const rateInput = screen.getByLabelText(/exchange rate/i);
    fireEvent.change(rateInput, { target: { value: '50.00' } });

    // Enter 200 USD
    const foreignInput = screen.getByLabelText(/foreign amount \(usd\)/i);
    fireEvent.change(foreignInput, { target: { value: '200' } });

    // Converted EGP equivalent should be 10,000 EGP
    const convertedEgpValue = screen.getByTestId('converted-egp-value');
    expect(convertedEgpValue).toHaveTextContent(/10,000/);

    // Switch to Installment
    const typeSelect = screen.getByLabelText(/transaction type/i);
    fireEvent.change(typeSelect, { target: { value: 'Installment' } });

    const monthsInput = screen.getByLabelText(/number of months/i);
    fireEvent.change(monthsInput, { target: { value: '10' } });

    // Monthly principal should reflect 1,000 EGP / mo (10,000 / 10)
    expect(screen.getByText(/monthly principal:/i)).toHaveTextContent(/1,000/);
  });

  it('submits correct multi-currency payload on transaction creation', async () => {
    const handleAdded = jest.fn();
    const handleClose = jest.fn();

    render(
      <AddTransactionModal
        isOpen={true}
        onClose={handleClose}
        cardId="card123"
        onTransactionAdded={handleAdded}
      />
    );

    await waitFor(() => {
      expect(getCurrencyPrice).toHaveBeenCalled();
    });

    // Fill description
    const descInput = screen.getByLabelText(/merchant \/ description/i);
    fireEvent.change(descInput, { target: { value: 'Apple Store Online' } });

    // Select USD
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    // Enter foreign amount
    const foreignInput = screen.getByLabelText(/foreign amount \(usd\)/i);
    fireEvent.change(foreignInput, { target: { value: '100' } });

    // Enter rate
    const rateInput = screen.getByLabelText(/exchange rate/i);
    fireEvent.change(rateInput, { target: { value: '48.50' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalledTimes(1);
    });

    const submittedData = createTransaction.mock.calls[0][0];
    expect(submittedData.card).toBe('card123');
    expect(submittedData.description).toBe('Apple Store Online');
    expect(submittedData.currency).toBe('USD');
    expect(submittedData.foreignAmount).toBe(100);
    expect(submittedData.exchangeRateSnapshot).toBe(48.5);
    expect(submittedData.amount).toBe(4850);
  });
});
