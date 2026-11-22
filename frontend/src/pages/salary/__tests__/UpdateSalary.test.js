// frontend/src/pages/salary/__tests__/UpdateSalary.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpdateSalary from '../UpdateSalary';
import { getProfile } from '../../../services/salaryService';
import { updateSalaryProfile } from '../../../services/salaryProfileService';
import { ToastProvider } from '../../../context/ToastContext';

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
  saveProfile: jest.fn(),
}));

jest.mock('../../../services/salaryProfileService', () => ({
  updateSalaryProfile: jest.fn(),
}));

const mockSalaryProfile = {
  _id: 'prof_upd_1',
  name: 'Lead Architecture Profile',
  title: 'Principal Software Engineer',
  position: 'Core Architecture',
  year: 2026,
  effectiveDate: '2026-01-01T00:00:00.000Z',
  components: [
    { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 30000, calculationBasis: 'gross', isTaxable: true, isInsurable: true, isActive: true },
    { name: 'Housing Allowance', category: 'allowance', type: 'fixed', value: 10000, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true },
    { name: 'Transport Allowance', category: 'allowance', type: 'fixed', value: 5000, calculationBasis: 'gross', isTaxable: false, isInsurable: false, isActive: true },
  ],
};

const renderUpdateSalary = () => {
  return render(
    <MemoryRouter initialEntries={['/salary-profile/update']}>
      <ToastProvider>
        <UpdateSalary />
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('UpdateSalary Component (Phase 5E)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. loads profile and populates metadata and live structure summary cards', async () => {
    getProfile.mockResolvedValue(mockSalaryProfile);
    renderUpdateSalary();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Lead Architecture Profile')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Principal Software Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Core Architecture')).toBeInTheDocument();

    // Check KPI summary values (Basic: 30k, Estimated Gross: 45k, Insurable: 30k, Taxable: 40k)
    expect(screen.getAllByText(/30,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/45,000/).length).toBeGreaterThan(0);
  });

  test('2. updates form fields on change', async () => {
    getProfile.mockResolvedValue(mockSalaryProfile);
    renderUpdateSalary();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Lead Architecture Profile')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Profile Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Profile Title' } });
    expect(screen.getByDisplayValue('Updated Profile Title')).toBeInTheDocument();
  });

  test('3. submits updated components payload and navigates to /salary/profiles', async () => {
    getProfile.mockResolvedValue(mockSalaryProfile);
    updateSalaryProfile.mockResolvedValue({ success: true });
    renderUpdateSalary();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Lead Architecture Profile')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Save Salary Structure/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSalaryProfile).toHaveBeenCalledWith(
        'prof_upd_1',
        expect.objectContaining({
          name: 'Lead Architecture Profile',
          title: 'Principal Software Engineer',
          components: expect.arrayContaining([
            expect.objectContaining({ name: 'Basic Salary', value: 30000 }),
          ]),
        })
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/salary/profiles');
  });

  test('4. cancel button links back to /salary/profiles', async () => {
    getProfile.mockResolvedValue(mockSalaryProfile);
    renderUpdateSalary();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Lead Architecture Profile')).toBeInTheDocument();
    });

    const cancelLink = screen.getByRole('link', { name: /Cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/salary/profiles');
  });
});
