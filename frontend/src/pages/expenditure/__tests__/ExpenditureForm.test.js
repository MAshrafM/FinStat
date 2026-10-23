import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenditureForm from '../ExpenditureForm';
import { getCurrencyPrice } from '../../../services/currencyService';
import { getRules } from '../../../services/categorizationRuleService';

jest.mock('../../../services/currencyService', () => ({
  getCurrencyPrice: jest.fn(),
}));

jest.mock('../../../services/categorizationRuleService', () => ({
  getRules: jest.fn(),
}));

describe('ExpenditureForm - Multi-Currency Selector & Foreign Amount Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRules.mockResolvedValue({ data: [] });
    getCurrencyPrice.mockResolvedValue([
      { currencyID: 'USD', buyRate: 48.2, sellRate: 48.5 },
      { currencyID: 'EUR', buyRate: 52.0, sellRate: 52.5 },
    ]);
  });

  it('renders with EGP as default currency and hides foreignAmount input', async () => {
    render(<ExpenditureForm onSubmit={jest.fn()} />);

    await waitFor(() => {
      expect(getRules).toHaveBeenCalled();
      expect(getCurrencyPrice).toHaveBeenCalled();
    });

    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect.value).toBe('EGP');

    // Base transaction value input should be present
    expect(screen.getByLabelText(/transaction value \(egp\)/i)).toBeInTheDocument();

    // Foreign amount input and conversion card should NOT be present
    expect(screen.queryByLabelText(/foreign amount/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('conversion-confirmation-card')).not.toBeInTheDocument();
  });

  it('displays foreignAmount input and conversion confirmation card when currency is changed to USD', async () => {
    render(<ExpenditureForm onSubmit={jest.fn()} />);

    await waitFor(() => {
      expect(getRules).toHaveBeenCalled();
    });

    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    expect(currencySelect.value).toBe('USD');

    // Foreign amount input should now be visible
    expect(screen.getByLabelText(/foreign amount \(usd\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exchange rate/i)).toBeInTheDocument();

    // Confirmation card should be visible
    expect(screen.getByTestId('conversion-confirmation-card')).toBeInTheDocument();
  });

  it('auto-displays the converted EGP equivalent when foreignAmount is typed', async () => {
    render(<ExpenditureForm onSubmit={jest.fn()} />);

    await waitFor(() => {
      expect(getRules).toHaveBeenCalled();
    });

    // Switch to USD
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    // Set rate to 48.5 explicitly
    const rateInput = screen.getByLabelText(/exchange rate/i);
    fireEvent.change(rateInput, { target: { value: '48.50' } });

    // Enter 100 USD
    const foreignInput = screen.getByLabelText(/foreign amount \(usd\)/i);
    fireEvent.change(foreignInput, { target: { value: '100' } });

    // Converted EGP equivalent should be auto-displayed in the confirmation card
    const convertedEgpValue = screen.getByTestId('converted-egp-value');
    expect(convertedEgpValue).toHaveTextContent(/4,850/);
  });

  it('updates converted EGP equivalent when exchange rate changes', async () => {
    render(<ExpenditureForm onSubmit={jest.fn()} />);

    await waitFor(() => {
      expect(getRules).toHaveBeenCalled();
    });

    // Switch to EUR
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });

    const foreignInput = screen.getByLabelText(/foreign amount \(eur\)/i);
    fireEvent.change(foreignInput, { target: { value: '200' } });

    const rateInput = screen.getByLabelText(/exchange rate/i);
    fireEvent.change(rateInput, { target: { value: '50.00' } });

    const convertedEgpValue = screen.getByTestId('converted-egp-value');
    expect(convertedEgpValue).toHaveTextContent(/10,000/);
  });

  it('submits correct payload with foreignAmount and exchangeRateSnapshot when currency !== EGP', async () => {
    const handleSubmit = jest.fn();
    render(<ExpenditureForm onSubmit={handleSubmit} mode="create" />);

    await waitFor(() => {
      expect(getRules).toHaveBeenCalled();
    });

    // Select USD
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    // Enter Foreign Amount
    const foreignInput = screen.getByLabelText(/foreign amount \(usd\)/i);
    fireEvent.change(foreignInput, { target: { value: '75' } });

    // Set Exchange Rate
    const rateInput = screen.getByLabelText(/exchange rate/i);
    fireEvent.change(rateInput, { target: { value: '48.00' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /create new log/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedData = handleSubmit.mock.calls[0][0];

    expect(submittedData.currency).toBe('USD');
    expect(submittedData.foreignAmount).toBe(75);
    expect(submittedData.exchangeRateSnapshot).toBe(48.0);
    expect(submittedData.transactionValue).toBe(3600); // 75 * 48
  });

  it('submits standard EGP payload without foreignAmount when currency === EGP', async () => {
    const handleSubmit = jest.fn();
    render(<ExpenditureForm onSubmit={handleSubmit} mode="create" />);

    await waitFor(() => {
      expect(getRules).toHaveBeenCalled();
    });

    const valueInput = screen.getByLabelText(/transaction value \(egp\)/i);
    fireEvent.change(valueInput, { target: { value: '500' } });

    const submitBtn = screen.getByRole('button', { name: /create new log/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedData = handleSubmit.mock.calls[0][0];

    expect(submittedData.currency).toBe('EGP');
    expect(submittedData.transactionValue).toBe(500);
    expect(submittedData.foreignAmount).toBeUndefined();
  });

  it('pre-populates currency, foreignAmount, and exchangeRate in edit mode for foreign transaction', async () => {
    const initialData = {
      _id: 'exp123',
      date: '2026-10-15T00:00:00.000Z',
      currency: 'USD',
      foreignAmount: 150,
      exchangeRateSnapshot: 48.25,
      transactionValue: 7237.5,
      transactionType: 'W',
      categories: ['Shopping'],
      description: 'Online purchase in USD',
      bank: 50000,
      cash: 1000,
      prepaid: 0,
    };

    render(<ExpenditureForm onSubmit={jest.fn()} mode="edit" initialData={initialData} />);

    await waitFor(() => {
      expect(getRules).toHaveBeenCalled();
    });

    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect.value).toBe('USD');

    const foreignInput = screen.getByLabelText(/foreign amount \(usd\)/i);
    expect(foreignInput.value).toBe('150');

    const rateInput = screen.getByLabelText(/exchange rate/i);
    expect(rateInput.value).toBe('48.25');

    const convertedEgpValue = screen.getByTestId('converted-egp-value');
    expect(convertedEgpValue).toHaveTextContent(/7,237\.5/);
  });
});
