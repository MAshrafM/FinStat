// frontend/src/pages/salary/__tests__/EditHistoryRecord.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditHistoryRecord from '../EditHistoryRecord';
import { getProfile, updateHistoryRecord } from '../../../services/salaryService';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = require('../../../../node_modules/react-router/dist/development/index.js');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });

jest.mock('../../../services/salaryService', () => ({
  getProfile: jest.fn(),
  updateHistoryRecord: jest.fn(),
}));

const mockProfileWithHistory = {
  _id: 'prof_test_1',
  name: 'Ahmed Hassan',
  salaryHistory: [
    {
      _id: 'rec_456',
      effectiveDate: '2026-03-01T00:00:00.000Z',
      basicSalary: 30000,
      basicProduction: 3000,
      variables: 2000,
      environment: 1500,
      meal: 1000,
      shift: 500,
      supervising: 1500,
      others: 500,
      prepaid: 0,
      bonds: 0,
    },
  ],
};

const renderEditHistoryRecord = (historyId = 'rec_456') => {
  return render(
    <MemoryRouter initialEntries={[`/salary-profile/history/edit/${historyId}`]}>
      <Routes>
        <Route path="/salary-profile/history/edit/:historyId" element={<EditHistoryRecord />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('EditHistoryRecord Component (Phase 5E)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. loads historical record by ID and populates date and component inputs', async () => {
    getProfile.mockResolvedValue(mockProfileWithHistory);
    renderEditHistoryRecord();

    await waitFor(() => {
      expect(screen.getByDisplayValue('2026-03-01')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('30000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
  });

  test('2. updates numeric inputs on change', async () => {
    getProfile.mockResolvedValue(mockProfileWithHistory);
    renderEditHistoryRecord();

    await waitFor(() => {
      expect(screen.getByDisplayValue('30000')).toBeInTheDocument();
    });

    const basicSalaryInput = screen.getByLabelText(/Basic Salary/i);
    fireEvent.change(basicSalaryInput, { target: { name: 'basicSalary', value: '35000' } });
    expect(screen.getByDisplayValue('35000')).toBeInTheDocument();
  });

  test('3. submits numeric conversions and navigates to /salary-profile/history', async () => {
    getProfile.mockResolvedValue(mockProfileWithHistory);
    updateHistoryRecord.mockResolvedValue({ success: true });
    renderEditHistoryRecord();

    await waitFor(() => {
      expect(screen.getByDisplayValue('30000')).toBeInTheDocument();
    });

    const basicSalaryInput = screen.getByLabelText(/Basic Salary/i);
    fireEvent.change(basicSalaryInput, { target: { name: 'basicSalary', value: '36000' } });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateHistoryRecord).toHaveBeenCalledWith('rec_456', expect.objectContaining({
        basicSalary: 36000,
        basicProduction: 3000,
        effectiveDate: '2026-03-01',
      }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/salary-profile/history');
  });

  test('4. cancel button links back to /salary-profile/history', async () => {
    getProfile.mockResolvedValue(mockProfileWithHistory);
    renderEditHistoryRecord();

    await waitFor(() => {
      expect(screen.getByDisplayValue('2026-03-01')).toBeInTheDocument();
    });

    const cancelLink = screen.getByRole('link', { name: /Cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/salary-profile/history');
  });
});
