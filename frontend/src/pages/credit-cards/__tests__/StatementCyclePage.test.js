// frontend/src/pages/credit-cards/__tests__/StatementCyclePage.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import StatementCyclePage from '../StatementCyclePage';
import * as creditCardService from '../../../services/creditCardService';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/creditCardService', () => ({
  getCards: jest.fn(),
  getStatementCycles: jest.fn(),
}));

const CARDS = [
  { _id: 'card-1', name: 'CIB Titanium', bank: 'CIB', limit: 50000, billingCycleDay: 15 },
  { _id: 'card-2', name: 'NBE Platinum', bank: 'NBE', limit: 20000, billingCycleDay: 20 },
  { _id: 'card-3', name: 'QNB Cashback', bank: 'QNB', limit: 10000, billingCycleDay: 5 },
];

const CYCLE_BY_CARD = {
  'card-1': {
    card: CARDS[0],
    currentPeriod: {
      startDate: '2025-12-16T00:00:00.000Z',
      closeDate: '2026-01-15T00:00:00.000Z',
      dueDate: '2026-01-20T00:00:00.000Z',
      daysUntilClose: 4,
      daysUntilDue: 5,
      isOverdue: false,
    },
    currentCycleData: {
      totalCharges: 3500,
      totalPayments: 1000,
      netCycleChange: 2500,
      transactions: [
        {
          _id: 'tx-1',
          description: 'Carrefour Hypermarket',
          category: 'Groceries',
          type: 'Purchase',
          amount: 3500,
          date: '2026-01-10T00:00:00.000Z',
        },
      ],
      activeInstallments: [],
    },
  },
  'card-2': {
    card: CARDS[1],
    currentPeriod: {
      startDate: '2025-12-21T00:00:00.000Z',
      closeDate: '2026-01-20T00:00:00.000Z',
      dueDate: '2026-01-12T00:00:00.000Z',
      daysUntilClose: 5,
      daysUntilDue: -3,
      isOverdue: true,
    },
    currentCycleData: {
      totalCharges: 2000,
      totalPayments: 0,
      netCycleChange: 2000,
      transactions: [],
      activeInstallments: [],
    },
  },
  'card-3': {
    card: CARDS[2],
    currentPeriod: {
      startDate: '2026-01-06T00:00:00.000Z',
      closeDate: '2026-02-05T00:00:00.000Z',
      dueDate: '2026-01-29T00:00:00.000Z',
      daysUntilClose: 21,
      daysUntilDue: 14,
      isOverdue: false,
    },
    currentCycleData: {
      totalCharges: 1200,
      totalPayments: 1200,
      netCycleChange: 0,
      transactions: [],
      activeInstallments: [],
    },
  },
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/credit-cards/statements']}>
      <StatementCyclePage />
    </MemoryRouter>
  );

describe('StatementCyclePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    creditCardService.getCards.mockResolvedValue(CARDS);
    creditCardService.getStatementCycles.mockImplementation((cardId) =>
      Promise.resolve(CYCLE_BY_CARD[cardId] || CYCLE_BY_CARD['card-1'])
    );
  });

  test('renders KPIs, Due soon badge (<= 7 days), neutral amounts, and zero inline styles', async () => {
    const { container } = renderPage();
    expect((await screen.findAllByText('Carrefour Hypermarket')).length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText('Due soon').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Due in 5 days')).toBeInTheDocument();
    expect(container.querySelectorAll('[style]').length).toBe(0);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('renders Overdue badge when isOverdue is true and neutral unlabeled when > 7 days', async () => {
    renderPage();
    const select = await screen.findByLabelText(/Select Card:/i);

    fireEvent.change(select, { target: { value: 'card-2' } });
    expect(await screen.findByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Overdue by 3 days')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'card-3' } });
    expect(await screen.findByText('Due in 14 days')).toBeInTheDocument();
    expect(screen.queryByText('Due soon')).not.toBeInTheDocument();
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  test('expands D19 mobile card details for current cycle charges', async () => {
    renderPage();
    const expandBtn = await screen.findByRole('button', {
      name: /Show charge details for Carrefour Hypermarket/i,
    });
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(expandBtn);
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
  });

  test('renders neutral error card with Retry action on fetch failure', async () => {
    creditCardService.getStatementCycles.mockRejectedValueOnce(new Error('Network down'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');

    creditCardService.getStatementCycles.mockResolvedValueOnce(CYCLE_BY_CARD['card-1']);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect((await screen.findAllByText('Carrefour Hypermarket')).length).toBeGreaterThanOrEqual(1);
  });
});
