// frontend/src/pages/lending/__tests__/LendingA11y.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LendingDashboardPage from '../LendingDashboardPage';
import LoanDetailPage from '../LoanDetailPage';
import PersonCard from '../PersonCard';
import AddTransactionForm from '../AddTransactionForm';
import * as lendingService from '../../../services/lendingService';

expect.extend(toHaveNoViolations);

jest.mock('../../../services/lendingService');
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'l1' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

const MOCK_PERSON = {
  _id: 'p1',
  name: 'Ahmed Samir',
  note: 'Colleague',
  totalOwedInPiastres: 600000,
  loanCount: 1,
  activeLoanCount: 1,
};

const MOCK_LOANS = [
  {
    _id: 'l1',
    person: { _id: 'p1', name: 'Ahmed Samir' },
    status: 'WrittenOff',
    totalBorrowedInPiastres: 500000,
    totalRepaidInPiastres: 100000,
    balanceInPiastres: 400000,
    createdAt: '2026-01-10T10:00:00.000Z',
    transactions: [
      { _id: 't1', type: 'borrow', amountInPiastres: 500000, runningBalanceInPiastres: 500000, date: '2026-01-10T10:00:00.000Z', note: 'Initial' },
    ],
  },
];

describe('Phase 9C Lending A11y, Tones & D19 Mobile Switching', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = originalMatchMedia;
    lendingService.getLendingSummary.mockResolvedValue({
      success: true,
      data: { totalBorrowed: 500000, totalRepaid: 100000, totalOutstanding: 400000, activeLoansCount: 1, personsCount: 1 },
    });
    lendingService.getPersons.mockResolvedValue({ success: true, data: [MOCK_PERSON] });
    lendingService.getLoans.mockResolvedValue({ success: true, data: MOCK_LOANS });
    lendingService.getLoanById.mockResolvedValue({ success: true, data: MOCK_LOANS[0] });
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  test('LendingDashboardPage has 0 [style], negative WrittenOff badge, and 0 jest-axe violations', async () => {
    const { container } = render(<LendingDashboardPage />);
    expect(await screen.findByText('Lending Tracker')).toBeInTheDocument();
    expect(container.querySelectorAll('[style]').length).toBe(0);

    const writtenOffBadge = screen.getByText('WrittenOff');
    expect(writtenOffBadge).toHaveClass('fs-badge--negative');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('renders D19 mobile cards when matchMedia matches max-width: 768px', async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes('768px'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    render(<LoanDetailPage />);
    const mobileList = await screen.findByTestId('loan-tx-mobile-cards');
    expect(mobileList).toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: /Show transaction details/i });
    fireEvent.click(expandBtn);
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
  });

  test('PersonCard and AddTransactionForm pass jest-axe with 0 [style]', async () => {
    const { container: cardContainer } = render(<PersonCard person={MOCK_PERSON} />);
    expect(cardContainer.querySelectorAll('[style]').length).toBe(0);
    expect(await axe(cardContainer)).toHaveNoViolations();

    const { container: modalContainer } = render(
      <AddTransactionForm isOpen onClose={jest.fn()} onSubmit={jest.fn()} />
    );
    expect(modalContainer.querySelectorAll('[style]').length).toBe(0);
    expect(await axe(modalContainer)).toHaveNoViolations();
  });
});
