// frontend/src/pages/salary/__tests__/SalaryHistory.test.js
jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SalaryHistory from '../SalaryHistory';
import { getProfile, deleteHistoryRecord } from '../../../services/salaryService';
import { ToastProvider } from '../../../context/ToastContext';

jest.mock('../../../services/salaryService', () => ({
  getProfile: jest.fn(),
  deleteHistoryRecord: jest.fn(),
}));

const mockProfile = {
  _id: 'prof_test_1',
  name: 'Ahmed Hassan',
  title: 'Principal Software Engineer',
  position: 'Core Architecture',
  year: 2026,
  salaryHistory: [
    {
      _id: 'hist_rec_1',
      effectiveDate: '2026-01-15T00:00:00.000Z',
      basicSalary: 45000,
      basicProduction: 5000,
      variables: 3000,
      environment: 2000,
      meal: 1500,
      shift: 1000,
      supervising: 2500,
      others: 1000,
      prepaid: 0,
      bonds: 500,
    },
    {
      _id: 'hist_rec_2',
      effectiveDate: '2025-01-15T00:00:00.000Z',
      basicSalary: 38000,
      basicProduction: 4000,
      variables: 2500,
      environment: 2000,
      meal: 1200,
      shift: 800,
      supervising: 2000,
      others: 500,
      prepaid: 0,
      bonds: 0,
    },
  ],
};

const renderSalaryHistory = () => {
  return render(
    <MemoryRouter initialEntries={['/salary-profile/history']}>
      <ToastProvider>
        <SalaryHistory />
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('SalaryHistory Component (Phase 5E)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. renders loading state initially', () => {
    getProfile.mockReturnValue(new Promise(() => {})); // Never resolves
    renderSalaryHistory();
    expect(screen.getByText(/Loading salary history.../i)).toBeInTheDocument();
  });

  test('2. renders profile name and 12-column table with formatted salary records', async () => {
    getProfile.mockResolvedValue(mockProfile);
    renderSalaryHistory();

    await waitFor(() => {
      expect(screen.getByText(/Salary History for Ahmed Hassan/i)).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Effective Date')).toBeInTheDocument();
    expect(screen.getAllByText('Basic Salary').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Production').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Actions').length).toBeGreaterThan(0);

    // Verify 12-column table exists
    const table = screen.getByTestId('salary-history-table');
    expect(table).toBeInTheDocument();
  });

  test('3. formats all monetary values properly in table and cards', async () => {
    getProfile.mockResolvedValue(mockProfile);
    renderSalaryHistory();

    await waitFor(() => {
      expect(screen.getByText(/Salary History for Ahmed Hassan/i)).toBeInTheDocument();
    });

    // Check formatted currency strings (e.g. 45,000)
    expect(screen.getAllByText(/45,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/38,000/).length).toBeGreaterThan(0);
  });

  test('4. triggers delete modal and confirms deletion of historical record', async () => {
    getProfile.mockResolvedValue(mockProfile);
    deleteHistoryRecord.mockResolvedValue({ success: true });
    renderSalaryHistory();

    await waitFor(() => {
      expect(screen.getByText(/Salary History for Ahmed Hassan/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Delete historical record/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click first delete button
    fireEvent.click(deleteButtons[0]);

    // Confirm modal opens
    expect(screen.getByText(/Delete Salary History Record/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this historical record\?/i)).toBeInTheDocument();

    // Click confirm delete in modal
    const confirmBtn = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteHistoryRecord).toHaveBeenCalledWith('hist_rec_1');
    });
  });

  test('5. back button links to canonical /salary/profiles', async () => {
    getProfile.mockResolvedValue(mockProfile);
    renderSalaryHistory();

    await waitFor(() => {
      expect(screen.getByText(/Salary History for Ahmed Hassan/i)).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /Back to Profiles/i });
    expect(backLink).toHaveAttribute('href', '/salary/profiles');
  });

  test('6. renders Decision D19 compact-expand mobile cards with toggleable components', async () => {
    getProfile.mockResolvedValue(mockProfile);
    renderSalaryHistory();

    await waitFor(() => {
      expect(screen.getByText(/Salary History for Ahmed Hassan/i)).toBeInTheDocument();
    });

    const expanderButtons = screen.getAllByRole('button', { name: /Expand salary components/i });
    expect(expanderButtons.length).toBe(2);

    // Initially collapsed
    expect(expanderButtons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hide Details')).not.toBeInTheDocument();

    // Toggle expand on first card
    fireEvent.click(expanderButtons[0]);
    expect(expanderButtons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hide Details')).toBeInTheDocument();

    // Toggle collapse again
    fireEvent.click(expanderButtons[0]);
    expect(expanderButtons[0]).toHaveAttribute('aria-expanded', 'false');
  });
});
