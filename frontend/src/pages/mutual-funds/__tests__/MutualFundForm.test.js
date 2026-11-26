/* eslint-disable testing-library/no-node-access */
// frontend/src/pages/mutual-funds/__tests__/MutualFundForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import MutualFundForm from '../MutualFundForm';
import * as mutualFundService from '../../../services/mutualFundService';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/mutualFundService', () => ({
  getMutualFundByCode: jest.fn().mockResolvedValue([]),
  getAllMutualFundTrades: jest.fn().mockResolvedValue([]),
}));

const renderForm = (props = {}) =>
  render(
    <MemoryRouter>
      <MutualFundForm onFormSubmit={jest.fn()} {...props} />
    </MemoryRouter>
  );

const AZO_TRANSACTIONS = [
  { code: 'AZO', type: 'Buy', units: 120 },
  { code: 'AZO', type: 'Buy', units: 60 },
  { code: 'AZO', type: 'Sell', units: 20 },
  { code: 'AZO', type: 'Coupon', units: 500 },
  { code: 'MEF01', type: 'Buy', units: 999 },
];

describe('MutualFundForm Component (Phase 7C)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutualFundService.getMutualFundByCode.mockResolvedValue([]);
    mutualFundService.getAllMutualFundTrades.mockResolvedValue([]);
  });

  it('1. renders the Source Account selector for Buy and no destination/auto-reinvest controls', () => {
    renderForm({ initialData: { type: 'Buy' } });

    expect(screen.getByLabelText(/source account/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/destination account/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/auto-reinvest coupon/i)).not.toBeInTheDocument();
  });

  it('2. renders the Destination Account selector and auto-reinvest toggle for Coupon without a source control', () => {
    renderForm({ initialData: { type: 'Coupon' } });

    expect(screen.getByLabelText(/destination account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auto-reinvest coupon/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/source account/i)).not.toBeInTheDocument();
  });

  it('3. checking auto-reinvest disables the destination selector', () => {
    renderForm({ initialData: { type: 'Coupon', autoReinvest: false } });

    const destination = screen.getByLabelText(/destination account/i);
    expect(destination).not.toBeDisabled();

    fireEvent.click(screen.getByLabelText(/auto-reinvest coupon/i));

    expect(destination).toBeDisabled();
  });

  it('4. submit payload preserves accounts, auto-reinvest, and totalValue', async () => {
    const handleSubmit = jest.fn();
    renderForm({
      onFormSubmit: handleSubmit,
      initialData: {
        type: 'Coupon',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        units: 100,
        price: 5,
        fees: 0,
        totalValue: 500,
        destinationAccount: 'Cash',
        autoReinvest: false,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.destinationAccount).toBe('Cash');
    expect(submitted.autoReinvest).toBe(false);
    expect(submitted.totalValue).toBe(500);
    expect(submitted.units).toBe(100);
    expect(submitted.price).toBe(5);
  });

  it('5. render contract: label/id pairing, accessible names, one primary CTA, secondary Cancel link', () => {
    renderForm();

    expect(screen.getByLabelText('Date')).toHaveAttribute('id', 'mf-date');
    expect(screen.getByLabelText('Fund Code')).toHaveAttribute('id', 'mf-code');
    expect(screen.getByLabelText('Fund Name')).toHaveAttribute('id', 'mf-name');
    expect(screen.getByLabelText('Transaction Type')).toHaveAttribute('id', 'mf-type');

    const cancel = screen.getByRole('link', { name: 'Cancel' });
    expect(cancel).toHaveAttribute('href', '/mutual-funds');
    expect(cancel.className).toContain('fs-btn-secondary');

    const primaryButtons = screen
      .getAllByRole('button')
      .filter((button) => button.className.includes('fs-btn-primary'));
    expect(primaryButtons.length).toBe(1);
    expect(primaryButtons[0]).toHaveAccessibleName(/create transaction/i);
  });

  it('6. resolves a fund-code lookup into a read-only auto-filled name and success hint', async () => {
    mutualFundService.getMutualFundByCode.mockResolvedValue([
      { name: 'AZ Opportunity Fund', code: 'AZO' },
    ]);

    renderForm();

    fireEvent.change(screen.getByLabelText('Fund Code'), { target: { value: 'AZO' } });

    expect(
      await screen.findByText('Fund found in database.', {}, { timeout: 3000 })
    ).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Fund Name');
    expect(nameInput).toHaveValue('AZ Opportunity Fund');
    expect(nameInput).toHaveAttribute('readonly');
    expect(nameInput).toHaveAttribute('aria-readonly', 'true');
  });

  it('7. resolves an unknown fund code into the not-found hint', async () => {
    mutualFundService.getMutualFundByCode.mockResolvedValue([]);

    renderForm();

    fireEvent.change(screen.getByLabelText('Fund Code'), { target: { value: 'ZZZ' } });

    expect(
      await screen.findByText(
        'Fund code not found. Please enter the fund name manually.',
        {},
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Fund Name')).not.toHaveAttribute('readonly');
  });

  it('8. shows the code-lookup loading state while the request is pending', async () => {
    mutualFundService.getMutualFundByCode.mockReturnValue(new Promise(() => {}));

    renderForm();

    fireEvent.change(screen.getByLabelText('Fund Code'), { target: { value: 'AZO' } });

    expect(
      await screen.findByText('Looking up fund details...', {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Fund Code')).toHaveAttribute(
      'aria-describedby',
      'mf-code-hint'
    );
  });

  it('9. inline validation wires aria-invalid/aria-describedby and the total field is disabled/read-only', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));

    const nameInput = screen.getByLabelText('Fund Name');
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveAttribute('aria-describedby', 'mf-name-error');
    expect(screen.getByText('Fund Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Fund code is required.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please correct the highlighted fields before submitting.'
    );

    const total = screen.getByLabelText('Total Value');
    expect(total).toBeDisabled();
    expect(total).toHaveAttribute('readonly');
  });

  it('10. I3 math: Buy totalValue = units x price + fees', () => {
    renderForm({ initialData: { type: 'Buy' } });

    fireEvent.change(screen.getByLabelText('Units'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Price per Unit'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Fees'), { target: { value: '5' } });

    expect(screen.getByLabelText('Total Value')).toHaveValue('$205.00');
  });

  it('11. I3 math: Sell and Coupon totalValue = units x price - fees', () => {
    const view = renderForm({ initialData: { type: 'Sell' } });

    fireEvent.change(screen.getByLabelText('Units'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Price per Unit'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Fees'), { target: { value: '5' } });

    expect(screen.getByLabelText('Total Value')).toHaveValue('$195.00');
    view.unmount();

    renderForm({ initialData: { type: 'Coupon' } });

    fireEvent.change(screen.getByLabelText(/Units \(Auto-calculated\)/), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText('Coupon Amount'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Fees'), { target: { value: '5' } });

    expect(screen.getByLabelText('Total Value')).toHaveValue('$4,995.00');
  });

  it('12. I3 math: totalUnitsForCode = sum(Buy) - sum(Sell), Coupons ignored', async () => {
    mutualFundService.getMutualFundByCode.mockResolvedValue([
      { name: 'AZ Opportunity Fund', code: 'AZO' },
    ]);
    mutualFundService.getAllMutualFundTrades.mockResolvedValue(AZO_TRANSACTIONS);

    renderForm();

    fireEvent.change(screen.getByLabelText('Transaction Type'), {
      target: { value: 'Coupon' },
    });
    fireEvent.change(screen.getByLabelText('Fund Code'), { target: { value: 'AZO' } });

    expect(
      await screen.findByText(
        'Total units owned: 160.0000 (auto-calculated)',
        {},
        { timeout: 4000 }
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Units \(Auto-calculated\)/)).toHaveValue(160);
  });

  it('13. Coupon auto-fill units persists through auto-reinvest and submits both values', async () => {
    const handleSubmit = jest.fn();
    mutualFundService.getMutualFundByCode.mockResolvedValue([
      { name: 'AZ Opportunity Fund', code: 'AZO' },
    ]);
    mutualFundService.getAllMutualFundTrades.mockResolvedValue(AZO_TRANSACTIONS);

    renderForm({ onFormSubmit: handleSubmit, initialData: { type: 'Coupon' } });

    fireEvent.change(screen.getByLabelText('Fund Code'), { target: { value: 'AZO' } });

    expect(
      await screen.findByText(
        'Total units owned: 160.0000 (auto-calculated)',
        {},
        { timeout: 4000 }
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/auto-reinvest coupon/i));
    expect(screen.getByLabelText(/auto-reinvest coupon/i)).toBeChecked();
    expect(screen.getByLabelText(/Units \(Auto-calculated\)/)).toHaveValue(160);

    fireEvent.change(screen.getByLabelText('Coupon Amount'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.units).toBe(160);
    expect(submitted.autoReinvest).toBe(true);
    expect(submitted.destinationAccount).toBe('Bank');
  });

  it('14. passes a jest-axe accessibility audit with zero critical/serious violations', async () => {
    const { container } = renderForm({ initialData: { type: 'Coupon' } });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
