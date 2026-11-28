// frontend/src/pages/credit-cards/__tests__/ReconciliationPage.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import ReconciliationPage from '../ReconciliationPage';
import * as creditCardService from '../../../services/creditCardService';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/creditCardService', () => ({
  getCards: jest.fn(),
  getStatementCycles: jest.fn(),
  reconcileCycle: jest.fn(),
}));

const CARDS = [{ _id: 'card-1', name: 'CIB Titanium', bank: 'CIB' }];
const CYCLES_RESPONSE = {
  cycles: [
    { startDate: '2025-12-16T00:00:00.000Z', closeDate: '2026-01-15T00:00:00.000Z' },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/credit-cards/reconcile']}>
      <ReconciliationPage />
    </MemoryRouter>
  );

describe('ReconciliationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    creditCardService.getCards.mockResolvedValue(CARDS);
    creditCardService.getStatementCycles.mockResolvedValue(CYCLES_RESPONSE);
  });

  test('renders discrepancy banner with Discrepancy badge, Delta, itemized tables, and zero inline styles', async () => {
    creditCardService.reconcileCycle.mockResolvedValue({
      isReconciled: false,
      discrepancy: 450,
      analysis: 'Bank statement exceeds expected balance.',
      openingBalance: 0,
      totalTransactions: 3500,
      transactionCount: 1,
      totalPayments: 0,
      paymentCount: 0,
      expectedBalance: 3500,
      actualStatementBalance: 3950,
      transactions: [
        { _id: 'tx-1', date: '2026-01-10T00:00:00.000Z', description: 'Carrefour', amount: 3500 },
      ],
      payments: [
        { _id: 'pay-1', date: '2026-01-08T00:00:00.000Z', paymentSource: 'CIB Checking', amount: 1500 },
      ],
    });

    const { container } = renderPage();
    await screen.findByRole('option', { name: /to/i });
    const balanceInput = screen.getByLabelText(/Actual Statement Balance/i);
    fireEvent.change(balanceInput, { target: { value: '3950' } });
    fireEvent.click(screen.getByRole('button', { name: /Run Reconciliation/i }));

    expect(await screen.findByText('Discrepancy Detected')).toBeInTheDocument();
    expect(screen.getByText('Discrepancy')).toBeInTheDocument();
    expect(screen.getByText('vs bank statement')).toBeInTheDocument();
    expect(screen.getAllByText('Carrefour').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CIB Checking').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelectorAll('[style]').length).toBe(0);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('renders neutral Reconciled badge when statement matches', async () => {
    creditCardService.reconcileCycle.mockResolvedValue({
      isReconciled: true,
      discrepancy: 0,
      analysis: 'Statement matches logged charges and settlements.',
      openingBalance: 0,
      totalTransactions: 3500,
      transactionCount: 1,
      totalPayments: 0,
      paymentCount: 0,
      expectedBalance: 3500,
      actualStatementBalance: 3500,
      transactions: [],
      payments: [],
    });

    renderPage();
    await screen.findByRole('option', { name: /to/i });
    const balanceInput = screen.getByLabelText(/Actual Statement Balance/i);
    fireEvent.change(balanceInput, { target: { value: '3500' } });
    fireEvent.click(screen.getByRole('button', { name: /Run Reconciliation/i }));

    expect(await screen.findByText('Perfect Reconciliation!')).toBeInTheDocument();
    expect(screen.getByText('Reconciled')).toBeInTheDocument();
  });
});
