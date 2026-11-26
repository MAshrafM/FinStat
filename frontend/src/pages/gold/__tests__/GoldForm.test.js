/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/render-result-naming-convention */
// frontend/src/pages/gold/__tests__/GoldForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import GoldForm from '../GoldForm';
import AddGoldPage from '../AddGoldPage';
import EditGoldPage from '../EditGoldPage';
import * as goldService from '../../../services/goldService';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/goldService');

const renderForm = (props = {}) =>
  render(
    <MemoryRouter>
      <GoldForm onFormSubmit={jest.fn().mockResolvedValue(undefined)} {...props} />
    </MemoryRouter>
  );

const renderEdit = () =>
  render(
    <MemoryRouter initialEntries={['/gold-wallet/edit/gold-1']}>
      <Routes>
        <Route path="/gold-wallet/edit/:id" element={<EditGoldPage />} />
      </Routes>
    </MemoryRouter>
  );

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText('Item Description'), { target: { value: '22K Bracelet' } });
  fireEvent.change(screen.getByLabelText('Weight (grams)'), { target: { value: '3.5' } });
  fireEvent.change(screen.getByLabelText('Price per Gram'), { target: { value: '120.25' } });
  fireEvent.change(screen.getByLabelText('Total Amount Paid'), { target: { value: '421.5' } });
};

describe('GoldForm and gold form wrappers (Phase 8A)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    goldService.createGoldLog.mockResolvedValue({ success: true });
    goldService.updateGoldLog.mockResolvedValue({ success: true });
  });

  test('1. every label is paired with its control id and preserved name', () => {
    renderForm();

    const expectations = [
      ['Date', 'gold-date', 'date'],
      ['Item Description', 'gold-item', 'item'],
      ['Karat', 'gold-karat', 'karat'],
      ['Weight (grams)', 'gold-weight', 'weight'],
      ['Price per Gram', 'gold-price', 'price'],
      ['Total Amount Paid', 'gold-paid', 'paid'],
      ['Seller (Optional)', 'gold-seller', 'seller'],
      ['Paid From (Source Account)', 'gold-sourceAccount', 'sourceAccount'],
      ['Status', 'gold-status', 'status'],
    ];

    expectations.forEach(([label, id, name]) => {
      const control = screen.getByLabelText(label);
      expect(control).toHaveAttribute('id', id);
      expect(control).toHaveAttribute('name', name);
    });
  });

  test('2. form exposes exactly one primary CTA and a neutral Cancel link', () => {
    const { container } = renderForm();

    expect(container.querySelectorAll('.fs-btn-primary')).toHaveLength(1);
    const submit = screen.getByRole('button', { name: 'Create Log' });
    expect(submit).toHaveClass('fs-btn-primary');

    const cancel = screen.getByRole('link', { name: 'Cancel' });
    expect(cancel).toHaveAttribute('href', '/gold-wallet');
    expect(cancel).toHaveClass('fs-btn-secondary');
    expect(cancel).not.toHaveClass('fs-btn-primary');
  });

  test('3. sold-only fields appear only for sold status', async () => {
    renderForm();

    expect(screen.queryByLabelText('Selling Price')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Selling Date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Deposit Proceeds To')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'sold' } });

    expect(await screen.findByLabelText('Selling Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Selling Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Deposit Proceeds To')).toBeInTheDocument();
  });

  test('4. Add wrapper submits the create service with the unchanged payload', async () => {
    render(
      <MemoryRouter>
        <AddGoldPage />
      </MemoryRouter>
    );
    fillRequiredFields();
    const date = screen.getByLabelText('Date').value;

    fireEvent.click(screen.getByRole('button', { name: 'Create Log' }));

    await waitFor(() => {
      expect(goldService.createGoldLog).toHaveBeenCalledTimes(1);
    });
    expect(goldService.createGoldLog).toHaveBeenCalledWith({
      date,
      item: '22K Bracelet',
      karat: 24,
      weight: 3.5,
      price: 120.25,
      paid: 421.5,
      status: 'hold',
      sourceAccount: 'Bank',
    });
  });

  test('5. Edit wrapper prefills stored data and submits the update service', async () => {
    goldService.getGoldLogById.mockResolvedValue({
      _id: 'gold-1',
      date: '2026-01-14T10:30:00Z',
      item: 'Gold Ring 22K',
      seller: 'Cairo Gold House',
      karat: 22,
      weight: 2,
      price: 100,
      paid: 220,
      status: 'sold',
      sellingPrice: 130,
      sellingDate: '2026-06-01T00:00:00Z',
      sourceAccount: 'Cash',
      destinationAccount: 'Bank',
    });

    renderEdit();

    expect(await screen.findByDisplayValue('Gold Ring 22K')).toBeInTheDocument();
    expect(screen.getByLabelText('Selling Price')).toHaveValue(130);
    expect(screen.getByLabelText('Selling Date')).toHaveValue('2026-06-01');
    expect(screen.getByLabelText('Deposit Proceeds To')).toHaveValue('Bank');

    fireEvent.click(screen.getByRole('button', { name: 'Update Log' }));

    await waitFor(() => {
      expect(goldService.updateGoldLog).toHaveBeenCalledTimes(1);
    });
    expect(goldService.updateGoldLog).toHaveBeenCalledWith('gold-1', {
      date: '2026-01-14',
      item: 'Gold Ring 22K',
      karat: 22,
      weight: 2,
      price: 100,
      paid: 220,
      status: 'sold',
      seller: 'Cairo Gold House',
      sellingPrice: 130,
      sellingDate: '2026-06-01',
      destinationAccount: 'Bank',
      sourceAccount: 'Bank',
    });
  });

  test('6. validation exposes aria-invalid, aria-describedby, and inline errors', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Create Log' }));

    expect(await screen.findByText('Item Description is required.')).toBeInTheDocument();
    expect(screen.getByText('Weight (grams) is required.')).toBeInTheDocument();
    expect(screen.getByText('Please correct the highlighted fields before submitting.')).toBeInTheDocument();

    const item = screen.getByLabelText('Item Description');
    expect(item).toHaveAttribute('aria-invalid', 'true');
    expect(item).toHaveAttribute('aria-describedby', 'gold-item-error gold-item-hint');
    expect(document.getElementById('gold-item-error')).toHaveTextContent('Item Description is required.');
  });

  test('7. submitting disables the fieldset controls and shows the form-field loader', async () => {
    let resolveSubmit;
    const pending = new Promise((resolve) => { resolveSubmit = resolve; });
    goldService.createGoldLog.mockReturnValueOnce(pending);

    render(
      <MemoryRouter>
        <AddGoldPage />
      </MemoryRouter>
    );
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Create Log' }));

    await waitFor(() => {
      expect(screen.getByText('Saving gold entry...')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Item Description')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create Log' })).toBeDisabled();
    expect(screen.getByRole('status').className).toContain('fs-loading--form-field');

    resolveSubmit({ success: true });
    await waitFor(() => {
      expect(screen.queryByText('Saving gold entry...')).not.toBeInTheDocument();
    });
  });

  test('8. Edit wrapper renders the form-field loader and a tokenized error surface', async () => {
    goldService.getGoldLogById.mockReturnValueOnce(new Promise(() => {}));
    const loadingView = renderEdit();

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading gold entry...');
    expect(screen.getByRole('status').className).toContain('fs-loading--form-field');
    loadingView.unmount();

    goldService.getGoldLogById.mockRejectedValueOnce(new Error('record unavailable'));
    renderEdit();

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Unable to load gold entry')).toBeInTheDocument();
    expect(within(alert).getByText('record unavailable')).toBeInTheDocument();
  });

  test('9. payload contract keeps Number/parseFloat types, trimmed seller, and sold-only fields', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({ onFormSubmit: onSubmit });

    fireEvent.change(screen.getByLabelText('Item Description'), { target: { value: '  24K Coin  ' } });
    fireEvent.change(screen.getByLabelText('Karat'), { target: { value: '24' } });
    fireEvent.change(screen.getByLabelText('Weight (grams)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Price per Gram'), { target: { value: '200.5' } });
    fireEvent.change(screen.getByLabelText('Total Amount Paid'), { target: { value: '2010.25' } });
    fireEvent.change(screen.getByLabelText('Seller (Optional)'), { target: { value: '  Dealer  ' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'sold' } });
    fireEvent.change(screen.getByLabelText('Selling Price'), { target: { value: '220.75' } });
    fireEvent.change(screen.getByLabelText('Selling Date'), { target: { value: '2026-05-01' } });
    fireEvent.change(screen.getByLabelText('Paid From (Source Account)'), { target: { value: 'Cash' } });
    fireEvent.change(screen.getByLabelText('Deposit Proceeds To'), { target: { value: 'Prepaid' } });

    const date = screen.getByLabelText('Date').value;
    fireEvent.click(screen.getByRole('button', { name: 'Create Log' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      date,
      item: '24K Coin',
      karat: 24,
      weight: 10,
      price: 200.5,
      paid: 2010.25,
      status: 'sold',
      seller: 'Dealer',
      sellingPrice: 220.75,
      sellingDate: '2026-05-01',
      destinationAccount: 'Prepaid',
      sourceAccount: 'Cash',
    });
  });

  test('10. passes a jest-axe accessibility audit with zero critical/serious violations', async () => {
    const { container } = renderForm();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
