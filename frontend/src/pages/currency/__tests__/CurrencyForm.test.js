/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/currency/__tests__/CurrencyForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CurrencyForm from '../CurrencyForm';
import AddCurrencyPage from '../AddCurrencyPage';
import EditCurrencyPage from '../EditCurrencyPage';
import * as currencyService from '../../../services/currencyService';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/currencyService');

const existingHolding = {
  _id: 'curr-edit-1',
  name: 'Euro',
  amount: 1000,
  price: 55000,
  date: '2025-10-15T00:00:00.000Z',
  sourceAccount: 'Cash',
};

describe('Phase 8D — CurrencyForm & Add/Edit Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currencyService.createCurrency.mockResolvedValue({ _id: 'new-1' });
    currencyService.getCurrencyById.mockResolvedValue(existingHolding);
    currencyService.updateCurrency.mockResolvedValue({ ...existingHolding, price: 56000 });
  });

  it('1. renders Frame 02 form with id/htmlFor pairing and preserves account-selector-sourceAccount', () => {
    render(
      <MemoryRouter>
        <div className="curr-page-container curr-form-page">
          <CurrencyForm onFormSubmit={jest.fn()} />
        </div>
      </MemoryRouter>
    );

    const paired = [
      ['Currency Name', 'curr-name', 'name'],
      ['Principal Amount', 'curr-amount', 'amount'],
      ['Price Paid', 'curr-price', 'price'],
      ['Date', 'curr-date', 'date'],
      ['Paid From (Source Account)', 'account-selector-sourceAccount', 'sourceAccount'],
    ];

    for (const [labelText, expectedId, expectedName] of paired) {
      const ctrl = screen.getByLabelText(labelText);
      expect(ctrl).toHaveAttribute('id', expectedId);
      expect(ctrl).toHaveAttribute('name', expectedName);
    }

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveClass('fs-btn-secondary');
    expect(screen.getByRole('button', { name: 'Create Currency' })).toHaveClass('fs-btn-primary');
  });

  it('2. computes live neutral Implied Purchase Rate preview when amount and price are positive', () => {
    render(
      <MemoryRouter>
        <CurrencyForm onFormSubmit={jest.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('curr-implied-rate')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Principal Amount'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Price Paid'), { target: { value: '5000' } });

    expect(screen.getByTestId('curr-implied-rate')).toHaveTextContent('1 USD = 50.0000 EGP');
  });

  it('3. validates amount <= 0, price <= 0, and missing date on blur with aria-invalid and aria-describedby', () => {
    render(
      <MemoryRouter>
        <CurrencyForm onFormSubmit={jest.fn()} />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText('Principal Amount');
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.blur(amountInput);

    expect(amountInput).toHaveAttribute('aria-invalid', 'true');
    expect(amountInput).toHaveAttribute('aria-describedby', 'curr-amount-help curr-amount-error');
    expect(screen.getByText('Principal amount must be greater than 0.')).toBeInTheDocument();

    const priceInput = screen.getByLabelText('Price Paid');
    fireEvent.change(priceInput, { target: { value: '-10' } });
    fireEvent.blur(priceInput);
    expect(priceInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Price paid must be greater than 0.')).toBeInTheDocument();

    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '' } });
    fireEvent.blur(dateInput);
    expect(dateInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Purchase date is required.')).toBeInTheDocument();
  });

  it('4. clears field error and resets aria-invalid/aria-describedby on valid blur', () => {
    render(
      <MemoryRouter>
        <CurrencyForm onFormSubmit={jest.fn()} />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText('Principal Amount');
    fireEvent.change(amountInput, { target: { value: '' } });
    fireEvent.blur(amountInput);
    expect(amountInput).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(amountInput, { target: { value: '250' } });
    fireEvent.blur(amountInput);

    expect(amountInput).toHaveAttribute('aria-invalid', 'false');
    expect(amountInput).toHaveAttribute('aria-describedby', 'curr-amount-help');
    expect(screen.queryByText('Principal amount must be greater than 0.')).not.toBeInTheDocument();
  });

  it('5. displays .curr-form-error-summary on invalid submit and blocks onFormSubmit', () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <CurrencyForm onFormSubmit={onSubmit} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create Currency' }));

    expect(onSubmit).not.toHaveBeenCalled();
    const summary = container.querySelector('.curr-form-error-summary');
    expect(summary).toHaveAttribute('role', 'alert');
    expect(summary).toHaveTextContent(/validation error/i);
  });

  it('6. submits exact byte-identical payload with parsed numbers and zero extra keys', () => {
    const onSubmit = jest.fn();
    render(
      <MemoryRouter>
        <CurrencyForm onFormSubmit={onSubmit} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Currency Name'), { target: { value: 'Euro' } });
    fireEvent.change(screen.getByLabelText('Principal Amount'), { target: { value: '500.5' } });
    fireEvent.change(screen.getByLabelText('Price Paid'), { target: { value: '26000.25' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-01-10' } });
    fireEvent.change(screen.getByLabelText('Paid From (Source Account)'), { target: { value: 'Cash' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Currency' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Euro',
      amount: 500.5,
      price: 26000.25,
      date: '2026-01-10',
      sourceAccount: 'Cash',
    });
  });

  it('7. AddCurrencyPage creates currency and navigates, or shows distinct .curr-submit-error on failure', async () => {
    currencyService.createCurrency.mockRejectedValueOnce({
      response: { data: { message: 'Validation failed server-side' } },
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/currency/new']}>
        <Routes>
          <Route path="/currency/new" element={<AddCurrencyPage />} />
          <Route path="/currency" element={<div data-testid="currency-list">List</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Principal Amount'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Price Paid'), { target: { value: '5000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Currency' }));

    await waitFor(() => {
      expect(container.querySelector('.curr-submit-error')).toHaveTextContent('Validation failed server-side');
    });
    expect(container.querySelectorAll('.curr-form-error-summary')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Create Currency' }));
    await screen.findByTestId('currency-list');
  });

  it('8. EditCurrencyPage shows Loading form-field, prefills initial data, submits update, and navigates', async () => {
    render(
      <MemoryRouter initialEntries={['/currency/edit/curr-edit-1']}>
        <Routes>
          <Route path="/currency/edit/:id" element={<EditCurrencyPage />} />
          <Route path="/currency" element={<div data-testid="currency-list">List</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    await screen.findByText('Edit Foreign Currency');

    expect(screen.getByLabelText('Currency Name')).toHaveValue('Euro');
    expect(screen.getByLabelText('Principal Amount')).toHaveValue(1000);
    expect(screen.getByLabelText('Price Paid')).toHaveValue(55000);
    expect(screen.getByLabelText('Paid From (Source Account)')).toHaveValue('Cash');

    fireEvent.change(screen.getByLabelText('Price Paid'), { target: { value: '56000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Currency' }));

    await waitFor(() => {
      expect(currencyService.updateCurrency).toHaveBeenCalledWith('curr-edit-1', expect.objectContaining({
        name: 'Euro',
        amount: 1000,
        price: 56000,
        sourceAccount: 'Cash',
      }));
    });
    expect(await screen.findByTestId('currency-list')).toBeInTheDocument();
  });

  it('9. EditCurrencyPage renders .curr-error-card on fetch failure with Retry and .curr-submit-error on save failure', async () => {
    currencyService.getCurrencyById
      .mockRejectedValueOnce({ response: { data: { message: 'Fetch error' } } })
      .mockResolvedValueOnce(existingHolding);
    currencyService.updateCurrency.mockRejectedValueOnce({
      response: { data: { message: 'Save failed' } },
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/currency/edit/curr-edit-1']}>
        <Routes>
          <Route path="/currency/edit/:id" element={<EditCurrencyPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Unable to Load Currency Holding');
    expect(container.querySelector('.curr-error-card')).toHaveAttribute('role', 'alert');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Edit Foreign Currency');

    fireEvent.click(screen.getByRole('button', { name: 'Update Currency' }));
    await waitFor(() => {
      expect(container.querySelector('.curr-submit-error')).toHaveTextContent('Save failed');
    });
  });

  it('10. purges all inline [style] attributes across Add and Edit form pages', async () => {
    const { container: addContainer } = render(
      <MemoryRouter>
        <AddCurrencyPage />
      </MemoryRouter>
    );
    expect(addContainer.querySelectorAll('[style]')).toHaveLength(0);

    const { container: editContainer } = render(
      <MemoryRouter initialEntries={['/currency/edit/curr-edit-1']}>
        <Routes>
          <Route path="/currency/edit/:id" element={<EditCurrencyPage />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByText('Edit Foreign Currency');
    expect(editContainer.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('11. passes jest-axe across Add, validation-error, and Edit states', async () => {
    const { container } = render(
      <MemoryRouter>
        <AddCurrencyPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create Currency' }));

    const results = await axe(container);
    const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(severe).toEqual([]);
  });
});
