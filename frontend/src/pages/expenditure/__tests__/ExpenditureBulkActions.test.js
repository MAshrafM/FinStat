// frontend/src/pages/expenditure/__tests__/ExpenditureBulkActions.test.js
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
}), { virtual: true });

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenditureLogPage from '../ExpenditureLogPage';
import * as expenditureService from '../../../services/expenditureService';

const mockShowToast = jest.fn();

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    addToast: mockShowToast,
  }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({
    canModify: true,
    isViewer: false,
    isAdmin: false,
    isManager: true,
    role: 'manager',
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

  test('2. selects individual row and displays bulk actions bar with count badge', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    fireEvent.click(rowCheckboxes[0]);

    expect(rowCheckboxes[0]).toBeChecked();
    expect(rowCheckboxes[1]).not.toBeChecked();

    // Toolbar appears
    expect(screen.getByRole('region', { name: /bulk actions toolbar/i })).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  test('3. selects all rows via header checkbox and updates count badge', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByRole('checkbox', {
      name: /select all expenditures on this page/i,
    });
    fireEvent.click(selectAllCheckbox);

    const rowCheckboxes = screen.getAllByRole('checkbox', {
      name: /select transaction/i,
    });
    expect(rowCheckboxes[0]).toBeChecked();
    expect(rowCheckboxes[1]).toBeChecked();
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  test('4. calls bulkUpdateCategory and displays success toast when Reassign Category is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    // Select all
    const selectAllCheckbox = screen.getByRole('checkbox', {
      name: /select all expenditures on this page/i,
    });
    fireEvent.click(selectAllCheckbox);

    // Pick category
    const categorySelect = screen.getByLabelText(/category:/i);
    fireEvent.change(categorySelect, { target: { value: 'Utilities' } });

    // Click Reassign Category
    const reassignBtn = screen.getByRole('button', { name: /reassign category/i });
    fireEvent.click(reassignBtn);

    await waitFor(() => {
      expect(expenditureService.bulkUpdateCategory).toHaveBeenCalledWith(
        expect.arrayContaining(['exp1', 'exp2']),
        'Utilities'
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Updated category to "Utilities"'),
      'success'
    );
  });

  test('5. opens ConfirmModal when Delete Selected is clicked and calls bulkDeleteExpenditures upon confirmation', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Weekly Market')).toBeInTheDocument();
    });

    // Select Weekly Market row (exp1)
    const checkbox = screen.getByRole('checkbox', {
      name: /select transaction weekly market/i,
    });
    fireEvent.click(checkbox);

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
      expect(expenditureService.bulkDeleteExpenditures).toHaveBeenCalledWith(['exp1']);
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
});
