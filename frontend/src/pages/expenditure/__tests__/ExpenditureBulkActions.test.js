// frontend/src/pages/expenditure/__tests__/ExpenditureBulkActions.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenditureLogPage from '../ExpenditureLogPage';
import * as expenditureService from '../../../services/expenditureService';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
}), { virtual: true });

const mockShowToast = jest.fn();

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    addToast: mockShowToast,
  }),
}));

let mockCanModify = true;

jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({
    canModify: mockCanModify,
    isViewer: !mockCanModify,
    isAdmin: false,
    isManager: mockCanModify,
    role: mockCanModify ? 'manager' : 'viewer',
  }),
}));

jest.mock('../../../services/expenditureService', () => ({
  getExpenditures: jest.fn(),
  getLatestExpenditure: jest.fn(),
  deleteExpenditure: jest.fn(),
  bulkUpdateCategory: jest.fn(),
  bulkDeleteExpenditures: jest.fn(),
}));

const mockExpenditures = [
  {
    _id: 'exp1',
    date: '2024-05-01T00:00:00.000Z',
    bank: 1000,
    cash: 0,
    prepaid: 0,
    transactionValue: 100,
    transactionType: 'W',
    categories: ['Groceries'],
    description: 'Weekly Market',
  },
  {
    _id: 'exp2',
    date: '2024-05-02T00:00:00.000Z',
    bank: 900,
    cash: 0,
    prepaid: 0,
    transactionValue: 50,
    transactionType: 'W',
    categories: ['Dining Out'],
    description: 'Dinner with Team',
  },
];

describe('ExpenditureLogPage Bulk Actions [GAP-008]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanModify = true;
    expenditureService.getExpenditures.mockResolvedValue({
      data: mockExpenditures,
      totalPages: 1,
      currentPage: 1,
      totalCount: 2,
    });
    expenditureService.getLatestExpenditure.mockResolvedValue({
      bank: 900,
      cash: 0,
      prepaid: 0,
    });
    expenditureService.bulkUpdateCategory.mockResolvedValue({
      success: true,
      modifiedCount: 2,
    });
    expenditureService.bulkDeleteExpenditures.mockResolvedValue({
      success: true,
      deletedCount: 2,
    });
  });

  const renderComponent = () => render(<ExpenditureLogPage />);

  test('1. renders multi-select checkboxes for table header and rows', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByRole('checkbox', {
      name: /select all expenditures on this page/i,
    });
    expect(selectAllCheckbox).toBeInTheDocument();
    expect(selectAllCheckbox).not.toBeChecked();

    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    expect(rowCheckboxes).toHaveLength(2);
    expect(rowCheckboxes[0]).not.toBeChecked();
    expect(rowCheckboxes[1]).not.toBeChecked();
  });

  test('2. selecting row checkboxes toggles selection and shows bulk actions bar', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    // Bulk bar not visible initially
    expect(screen.queryByRole('region', { name: /bulk actions toolbar/i })).not.toBeInTheDocument();

    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });

    // Select first row
    fireEvent.click(rowCheckboxes[0]);
    expect(rowCheckboxes[0]).toBeChecked();

    // Bulk bar appears
    const bulkBar = screen.getByRole('region', { name: /bulk actions toolbar/i });
    expect(bulkBar).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    // Select second row
    fireEvent.click(rowCheckboxes[1]);
    expect(rowCheckboxes[1]).toBeChecked();
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    // Header checkbox should now be checked (all selected)
    const selectAllCheckbox = screen.getByRole('checkbox', {
      name: /select all expenditures on this page/i,
    });
    expect(selectAllCheckbox).toBeChecked();
  });

  test('3. header checkbox toggles select-all across all page transactions', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByRole('checkbox', {
      name: /select all expenditures on this page/i,
    });

    // Click select all
    fireEvent.click(selectAllCheckbox);

    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    expect(rowCheckboxes[0]).toBeChecked();
    expect(rowCheckboxes[1]).toBeChecked();
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    // Click select all again to deselect
    fireEvent.click(selectAllCheckbox);
    expect(rowCheckboxes[0]).not.toBeChecked();
    expect(rowCheckboxes[1]).not.toBeChecked();
    expect(screen.queryByRole('region', { name: /bulk actions toolbar/i })).not.toBeInTheDocument();
  });

  test('4. bulk category reassignment triggers API call and displays toast', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    // Select first item
    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    fireEvent.click(rowCheckboxes[0]);

    // Select category from dropdown
    const categorySelect = screen.getByLabelText(/category:/i);
    fireEvent.change(categorySelect, { target: { value: 'Transportation' } });

    // Click Reassign Category
    const reassignBtn = screen.getByRole('button', { name: /reassign category/i });
    fireEvent.click(reassignBtn);

    await waitFor(() => {
      expect(expenditureService.bulkUpdateCategory).toHaveBeenCalledWith(['exp2'], 'Transportation');
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Updated category to "Transportation" for 1 transaction'),
      'success'
    );
  });

  test('5. bulk delete opens confirmation modal and deletes upon confirm', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    // Select first item
    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    fireEvent.click(rowCheckboxes[0]);

    // Click Delete Selected
    const deleteBtn = screen.getByRole('button', { name: /delete selected/i });
    fireEvent.click(deleteBtn);

    // ConfirmModal opens
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /delete selected expenditures/i })).toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /delete 1 items/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(expenditureService.bulkDeleteExpenditures).toHaveBeenCalledWith(['exp2']);
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Deleted 1 transaction successfully'),
      'success'
    );
  });

  test('6. clears selection when Deselect All is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    // Select all
    const selectAllCheckbox = screen.getByRole('checkbox', {
      name: /select all expenditures on this page/i,
    });
    fireEvent.click(selectAllCheckbox);
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    // Click Deselect All
    const deselectBtn = screen.getByRole('button', { name: /deselect all/i });
    fireEvent.click(deselectBtn);

    // Bulk bar disappears
    expect(screen.queryByRole('region', { name: /bulk actions toolbar/i })).not.toBeInTheDocument();

    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    expect(rowCheckboxes[0]).not.toBeChecked();
    expect(rowCheckboxes[1]).not.toBeChecked();
  });

  test('7. enforces Invariant I4: viewer role disables mutation controls with ProtectedAction', async () => {
    mockCanModify = false;
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    // Add expenditure button should be disabled for viewer
    const addBtn = screen.getByTitle(/record a new expenditure/i);
    expect(addBtn).toHaveClass('protected-disabled');
    expect(addBtn).toHaveAttribute('aria-disabled', 'true');

    // Select a row to show bulk bar
    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    fireEvent.click(rowCheckboxes[0]);

    // Reassign and delete buttons should be disabled for viewer
    const reassignBtn = screen.getByRole('button', { name: /reassign category/i });
    expect(reassignBtn).toBeDisabled();
    expect(reassignBtn).toHaveClass('protected-disabled');

    const deleteBtn = screen.getByRole('button', { name: /delete selected/i });
    expect(deleteBtn).toBeDisabled();
    expect(deleteBtn).toHaveClass('protected-disabled');
  });

  describe('Mobile View & Account Labels', () => {
    const mobileMockExpenditures = [
      {
        _id: 'mob-bank',
        date: '2024-05-01T00:00:00.000Z',
        transactionValue: 100,
        transactionType: 'W',
        paymentMethod: 'Bank',
        categories: ['Groceries'],
        description: 'Bank Purchase',
        runningBalances: { bank: 1500, cash: 500, prepaid: 200 },
      },
      {
        _id: 'mob-cash',
        date: '2024-05-02T00:00:00.000Z',
        transactionValue: 50,
        transactionType: 'W',
        paymentMethod: 'Cash',
        categories: ['Dining Out'],
        description: 'Cash Purchase',
        runningBalances: { bank: 1500, cash: 450, prepaid: 200 },
      },
      {
        _id: 'mob-prepaid',
        date: '2024-05-03T00:00:00.000Z',
        transactionValue: 25,
        transactionType: 'W',
        paymentMethod: 'Prepaid',
        categories: ['Transport'],
        description: 'Prepaid Purchase',
        runningBalances: { bank: 1500, cash: 450, prepaid: 175 },
      },
    ];

    beforeEach(() => {
      window.innerWidth = 390;
      window.dispatchEvent(new Event('resize'));
      expenditureService.getExpenditures.mockResolvedValue({
        data: mobileMockExpenditures,
        totalPages: 1,
        currentPage: 1,
      });
    });

    afterEach(() => {
      window.innerWidth = 1440;
      window.dispatchEvent(new Event('resize'));
    });

    test('8. mobile header button uses Button component with .fs-btn and .fs-btn-primary', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Bank Purchase')).toBeInTheDocument();
      });

      const addBtn = screen.getByRole('link', { name: /add expenditure/i });
      expect(addBtn).toHaveClass('fs-btn', 'fs-btn-primary');
    });

    test('9. mobile cards show correct Account and Balance After labels and numerical values', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Prepaid Purchase')).toBeInTheDocument();
      });

      // Expand all details buttons
      const expandButtons = screen.getAllByRole('button', { name: /view details/i });
      expect(expandButtons).toHaveLength(3);

      // Expand Prepaid card (sorted newest first: index 0 is Prepaid)
      fireEvent.click(expandButtons[0]);
      expect(screen.getByText('Prepaid Balance After')).toBeInTheDocument();
      expect(screen.getByText('$175.00')).toBeInTheDocument();

      // Expand Cash card (index 1 is Cash)
      fireEvent.click(expandButtons[1]);
      expect(screen.getByText('Cash Balance After')).toBeInTheDocument();
      expect(screen.getByText('$450.00')).toBeInTheDocument();

      // Expand Bank card (index 2 is Bank)
      fireEvent.click(expandButtons[2]);
      expect(screen.getByText('Bank Balance After')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    });
  });
});
