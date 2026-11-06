// frontend/src/pages/expenditure/__tests__/RecurringBills.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecurringBills from '../RecurringBills';
import * as recurringBillService from '../../../services/recurringBillService';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/expenditures/bills' }),
}), { virtual: true });

const mockShowToast = jest.fn();

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    addToast: mockShowToast,
  }),
}));

let mockCanModifyValue = true;

jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({
    canModify: mockCanModifyValue,
    isViewer: !mockCanModifyValue,
    isAdmin: false,
    isManager: mockCanModifyValue,
    role: mockCanModifyValue ? 'manager' : 'viewer',
  }),
}));

jest.mock('../../../services/recurringBillService', () => ({
  getRecurringBills: jest.fn(),
  getUpcomingBills: jest.fn(),
  createRecurringBill: jest.fn(),
  updateRecurringBill: jest.fn(),
  deleteRecurringBill: jest.fn(),
  payRecurringBill: jest.fn(),
}));

describe('Step 7C.1b: [FEAT-005, GAP-009] RecurringBills Component Unit Tests', () => {
  const mockBills = [
    {
      _id: 'bill1',
      name: 'Home Fiber Internet',
      category: 'Utilities',
      amount: 650,
      frequency: 'monthly',
      dueDay: 15,
      nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days (Due Soon)
      paymentMethod: 'Bank',
      isActive: true,
      notes: 'WE Telecom Egypt',
    },
    {
      _id: 'bill2',
      name: 'Gym Membership',
      category: 'Healthcare',
      amount: 500,
      frequency: 'monthly',
      dueDay: 1,
      nextDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago (Overdue)
      paymentMethod: 'Cash',
      isActive: true,
    },
    {
      _id: 'bill3',
      name: 'Streaming Service',
      category: 'Shopping & Leisure',
      amount: 120,
      frequency: 'monthly',
      dueDay: 20,
      nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days later (Active)
      paymentMethod: 'Prepaid',
      isActive: false, // Paused
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanModifyValue = true;

    recurringBillService.getRecurringBills.mockResolvedValue({
      bills: mockBills,
    });
    recurringBillService.getUpcomingBills.mockResolvedValue({
      upcomingCount: 1,
      totalDue: 650,
      bills: [mockBills[0]],
    });
  });

  it('1. renders KPI cards (scheduled monthly total, due in 3 days, active bills)', async () => {
    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('bills-table')).toBeInTheDocument();
    });

    // Active bills: bill1 (650) + bill2 (500) = 1150 EGP monthly; 2 active bills
    expect(screen.getByTestId('kpi-monthly-total')).toHaveTextContent('1,150');
    expect(screen.getByTestId('kpi-due-soon')).toHaveTextContent('1 ($650.00)');
    expect(screen.getByTestId('kpi-active-count')).toHaveTextContent('2 bills');
  });

  it('2. renders bills table with correct data and badges (Due Soon, Overdue, Active, Paused)', async () => {
    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('bills-table')).toBeInTheDocument();
    });

    expect(screen.getByText('Home Fiber Internet')).toBeInTheDocument();
    expect(screen.getByText('Gym Membership')).toBeInTheDocument();
    expect(screen.getByText('Streaming Service')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByTestId('status-badge-bill1')).toHaveTextContent('Due Soon');
    expect(screen.getByTestId('status-badge-bill2')).toHaveTextContent('Overdue');
    expect(screen.getByTestId('status-badge-bill3')).toHaveTextContent('Paused');
  });

  it('3. renders empty state when no bills configured', async () => {
    recurringBillService.getRecurringBills.mockResolvedValueOnce({ bills: [] });
    recurringBillService.getUpcomingBills.mockResolvedValueOnce({ upcomingCount: 0, totalDue: 0, bills: [] });

    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-bills-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/No recurring bills configured yet/i)).toBeInTheDocument();
  });

  it('4. opens "Add Recurring Bill" modal when Add button is clicked', async () => {
    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('add-bill-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-bill-button'));

    expect(screen.getByTestId('bill-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Add Recurring Bill/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Bill Name \*/i)).toBeInTheDocument();
  });

  it('5. submits new bill form and calls createRecurringBill', async () => {
    recurringBillService.createRecurringBill.mockResolvedValueOnce({
      bill: { _id: 'new1', name: 'Electricity' },
    });

    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('add-bill-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-bill-button'));

    fireEvent.change(screen.getByLabelText(/Bill Name \*/i), { target: { value: 'Electricity', name: 'name' } });
    fireEvent.change(screen.getByLabelText(/Amount \(EGP\) \*/i), { target: { value: '450', name: 'amount' } });
    fireEvent.change(screen.getByLabelText(/Day of Month \(1-31\) \*/i), { target: { value: '10', name: 'dueDay' } });

    fireEvent.click(screen.getByTestId('submit-bill-form'));

    await waitFor(() => {
      expect(recurringBillService.createRecurringBill).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Electricity',
          amount: 450,
          dueDay: 10,
        })
      );
    });
  });

  it('6. opens Edit modal and submits updated bill calling updateRecurringBill', async () => {
    recurringBillService.updateRecurringBill.mockResolvedValueOnce({
      bill: { ...mockBills[0], amount: 700 },
    });

    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-bill-bill1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-bill-bill1'));

    expect(screen.getByRole('heading', { name: /Edit Recurring Bill/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Bill Name \*/i)).toHaveValue('Home Fiber Internet');

    fireEvent.change(screen.getByLabelText(/Amount \(EGP\) \*/i), { target: { value: '700', name: 'amount' } });
    fireEvent.click(screen.getByTestId('submit-bill-form'));

    await waitFor(() => {
      expect(recurringBillService.updateRecurringBill).toHaveBeenCalledWith(
        'bill1',
        expect.objectContaining({
          name: 'Home Fiber Internet',
          amount: 700,
        })
      );
    });
  });

  it('7. toggles active status (pause/resume) calling updateRecurringBill', async () => {
    recurringBillService.updateRecurringBill.mockResolvedValueOnce({ success: true });

    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-bill-bill1')).toBeInTheDocument();
    });

    // Bill 1 is active -> clicking toggle pauses it (isActive: false)
    fireEvent.click(screen.getByTestId('toggle-bill-bill1'));

    await waitFor(() => {
      expect(recurringBillService.updateRecurringBill).toHaveBeenCalledWith('bill1', { isActive: false });
    });
  });

  it('8. clicking "Pay" opens ConfirmModal with payment details', async () => {
    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('pay-bill-bill1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('pay-bill-bill1'));

    expect(screen.getByText('Record Bill Payment')).toBeInTheDocument();
    expect(screen.getByText(/Record a payment of .* for "Home Fiber Internet"/i)).toBeInTheDocument();
  });

  it('9. confirming payment in modal calls payRecurringBill and refreshes list', async () => {
    recurringBillService.payRecurringBill.mockResolvedValueOnce({
      msg: 'Bill paid successfully',
      expenditure: { _id: 'exp99' },
    });

    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('pay-bill-bill1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('pay-bill-bill1'));

    const payButton = screen.getByRole('button', { name: /Pay & Record/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(recurringBillService.payRecurringBill).toHaveBeenCalledWith('bill1', expect.objectContaining({
        paymentMethod: 'Bank',
      }));
    });
  });

  it('10. viewer role: mutation buttons (Add, Pay, Toggle, Edit, Delete) disabled via ProtectedAction', async () => {
    mockCanModifyValue = false; // Viewer role

    render(<RecurringBills />);

    await waitFor(() => {
      expect(screen.getByTestId('bills-table')).toBeInTheDocument();
    });

    expect(screen.getByTestId('add-bill-button')).toBeDisabled();
    expect(screen.getByTestId('pay-bill-bill1')).toBeDisabled();
    expect(screen.getByTestId('toggle-bill-bill1')).toBeDisabled();
    expect(screen.getByTestId('edit-bill-bill1')).toBeDisabled();
    expect(screen.getByTestId('delete-bill-bill1')).toBeDisabled();
  });
});

