// frontend/src/pages/salary/__tests__/SalaryProfilePage.test.js
jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SalaryProfilePage from '../SalaryProfilePage';
import { getProfile } from '../../../services/salaryService';
import { getSalaryProfiles, setDefaultSalaryProfile } from '../../../services/salaryProfileService';
import { ToastProvider } from '../../../context/ToastContext';
import { AuthContext } from '../../../context/AuthContext';
import { expectNoA11yViolations } from '../../../../tests/a11y/expectNoA11yViolations';

jest.mock('../../../services/salaryService', () => ({
  getProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

jest.mock('../../../services/salaryProfileService', () => ({
  getSalaryProfiles: jest.fn(),
  deleteSalaryProfile: jest.fn(),
  setDefaultSalaryProfile: jest.fn(),
}));

const mockProfile = {
  _id: 'prof_test_1',
  name: 'John Doe',
  title: 'Principal Engineer',
  position: 'Tech Lead',
  year: 2025,
  effectiveDate: '2025-01-01',
  monthlyGrossEstimate: 50000,
  components: [
    { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 35000, isActive: true },
    { name: 'Housing Allowance', category: 'allowance', type: 'fixed', value: 15000, isActive: true },
  ],
  salaryHistory: [
    {
      _id: 'hist_1',
      effectiveDate: '2025-01-01',
      basicSalary: 35000,
      basicProduction: 0,
      variables: 0,
      environment: 0,
      meal: 0,
      shift: 0,
      supervising: 0,
      others: 15000,
      prepaid: 5000,
    },
  ],
};

const mockMultiProfiles = [
  mockProfile,
  {
    _id: 'prof_test_2',
    name: 'Jane Smith',
    title: 'Consultant',
    year: 2024,
    monthlyGrossEstimate: 30000,
    components: [],
    salaryHistory: [],
    isDefault: false,
  },
];

describe('SalaryProfilePage (Phase 5A)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getProfile.mockResolvedValue(mockProfile);
    getSalaryProfiles.mockResolvedValue({ profiles: mockMultiProfiles });
  });

  const renderComponent = (canModify = true) => {
    return render(
      <MemoryRouter initialEntries={['/salary/profiles']}>
        <AuthContext.Provider value={{ canModify, isViewer: !canModify, isAdmin: canModify, isManager: false, role: canModify ? 'admin' : 'viewer' }}>
          <ToastProvider>
            <SalaryProfilePage />
          </ToastProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test('1. renders Salary Profile with title, components, and action buttons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Salary Profile/i })).toBeInTheDocument();
      expect(screen.getByText(/Principal Engineer John Doe/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Basic Salary/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Tax Simulator/i)).toBeInTheDocument();
      expect(screen.getByText(/Paycheck Calculator/i)).toBeInTheDocument();
    });
  });

  test('2. renders multiple saved profiles section when more than 1 profile exists', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('All Saved Salary Profiles')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('3. handles set default profile action', async () => {
    setDefaultSalaryProfile.mockResolvedValue({ success: true });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const setDefaultBtn = screen.getByRole('button', { name: /Set Default/i });
    fireEvent.click(setDefaultBtn);

    await waitFor(() => {
      expect(setDefaultSalaryProfile).toHaveBeenCalledWith('prof_test_2');
    });
  });

  test('4. renders empty history state when profile has no salary history or components', async () => {
    getProfile.mockResolvedValue({
      _id: 'prof_empty',
      name: 'Empty Profile',
      title: 'New Hire',
      year: 2025,
      components: [],
      salaryHistory: [],
    });
    getSalaryProfiles.mockResolvedValue({ profiles: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No Salary Details Found')).toBeInTheDocument();
      expect(screen.getByText('Add Initial Salary Details')).toBeInTheDocument();
    });
  });

  test('5. passes WCAG 2.1 AA accessibility audit with expectNoA11yViolations', async () => {
    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Salary Profile/i })).toBeInTheDocument();
    });

    await expectNoA11yViolations(container);
  });
});
