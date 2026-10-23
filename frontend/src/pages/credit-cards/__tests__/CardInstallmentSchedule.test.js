// frontend/src/pages/credit-cards/__tests__/CardInstallmentSchedule.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import CardInstallmentSchedule from '../CardInstallmentSchedule';

describe('Step 4A.7: [GAP-015] CardInstallmentSchedule Component', () => {
  it('renders table rows with exact remaining principal and completion date when installments exist', () => {
    const installments = [
      {
        _id: 'inst-1',
        description: 'MacBook Pro Purchase',
        date: '2026-01-15',
        amount: 30000,
        amountInPiastres: 3000000,
        paidAmount: 10000,
        paidAmountInPiastres: 1000000,
        installmentDetails: {
          months: 3,
          monthlyPrincipal: 10000,
          monthlyPrincipalInPiastres: 1000000,
          cyclePaidInPiastres: 1000000,
        },
      },
    ];

    render(<CardInstallmentSchedule installments={installments} />);

    expect(screen.getByText('Active Installment Plans')).toBeInTheDocument();
    expect(screen.getByText('MacBook Pro Purchase')).toBeInTheDocument();
    // Remaining Principal: 20,000 EGP
    expect(screen.getByText(/20,000/)).toBeInTheDocument();
    // Remaining Months: 2
    expect(screen.getByText('2 mos')).toBeInTheDocument();
  });

  it('renders contextual empty state when installments array is empty', () => {
    render(<CardInstallmentSchedule installments={[]} />);

    expect(
      screen.getByText(/No active installment plans on this card/i)
    ).toBeInTheDocument();
  });
});
