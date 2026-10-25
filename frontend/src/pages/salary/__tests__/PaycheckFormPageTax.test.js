jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: undefined }),
}), { virtual: true });

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PaycheckFormPage from '../PaycheckFormPage';
import { calculatePaycheckPreview, getPaycheckById } from '../../../services/paycheckService';
import { getSalaryProfiles } from '../../../services/salaryProfileService';
import { getProfile as getLegacyProfile } from '../../../services/salaryService';
import { getUserProfile } from '../../../services/userService';
import { ToastProvider } from '../../../context/ToastContext';

jest.mock('../../../services/paycheckService', () => ({
  createPaycheck: jest.fn(),
  getPaycheckById: jest.fn(),
  updatePaycheck: jest.fn(),
  calculatePaycheckPreview: jest.fn(),
}));

jest.mock('../../../services/salaryProfileService', () => ({
  getSalaryProfiles: jest.fn(),
}));

jest.mock('../../../services/salaryService', () => ({
  getProfile: jest.fn(),
}));

jest.mock('../../../services/userService', () => ({
  getUserProfile: jest.fn(),
}));

// Mock ComponentTable to isolate PaycheckFormPage preview logic
jest.mock('../../../components/salary/ComponentTable', () => {
  return function MockComponentTable({ components }) {
    return <div data-testid="component-table">Components: {components?.length || 0}</div>;
  };
});

describe('Step 4C.3: [MF-DEF-006 / MF-DEF-007] Frontend Statutory Preview Rendering & HTTP 400 Defense', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getLegacyProfile.mockResolvedValue({ success: true, profile: null });
    getUserProfile.mockResolvedValue({ success: true, user: {} });
  });

  it('renders statutory preview values directly from backend preview response without local calculation discrepancy', async () => {
    const profile = {
      _id: 'prof_15k',
      name: 'Mid-Wage Profile',
      isDefault: true,
      basicSalary: 15000,
      components: [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
      ],
    };
    getSalaryProfiles.mockResolvedValue({ profiles: [profile] });

    // 15,000 EGP gross earner under Law 175/2023 & Law 148/2019
    const statutoryBackendPreview = {
      success: true,
      year: 2024,
      preview: {
        disbursementType: 'Regular',
        grossSalary: 15000,
        basicSalary: 15000,
        taxableIncome: 15000,
        priorYtdGross: 0,
        cumulativeYtdGross: 15000,
        insurableIncome: 12600,
        appliedTaxRate: 20,
        expectedTax: 1535.30,
        includeTax: true,
        includeInsurance: true,
        expectedInsurance: 1386,
        expectedEmployerInsurance: 2362.50,
        includeMartyrsFund: false,
        martyrsFund: 0,
        customDeductions: 0,
        totalDeductions: 2921.30,
        netPay: 12078.70,
        isLocalFallback: false,
      },
    };

    calculatePaycheckPreview.mockResolvedValue(statutoryBackendPreview);

    render(
      <ToastProvider>
        <PaycheckFormPage />
      </ToastProvider>
    );

    // Verify backend preview was called
    await waitFor(() => {
      expect(calculatePaycheckPreview).toHaveBeenCalled();
    });

    // Verify statutory net pay (12,078.70 EGP) is rendered
    await waitFor(() => {
      const netPayElements = screen.getAllByText(/12,078\.70/);
      expect(netPayElements.length).toBeGreaterThan(0);
    });

    // Verify statutory tax (1,535.30 EGP) is rendered
    const taxElements = screen.getAllByText(/1,535\.30/);
    expect(taxElements.length).toBeGreaterThan(0);

    // Verify statutory social insurance (1,386.00 EGP) is rendered
    const insuranceElements = screen.getAllByText(/1,386\.00/);
    expect(insuranceElements.length).toBeGreaterThan(0);

    // Verify statutory progressive tax description is rendered
    expect(screen.getByText(/Law 175\/2023 progressive/i)).toBeInTheDocument();

    // Verify no error banner is displayed
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders low-wage earner 1,500 EGP salary clamped to 220 EGP statutory social insurance floor', async () => {
    const profile = {
      _id: 'prof_1.5k',
      name: 'Low-Wage Profile',
      isDefault: true,
      basicSalary: 1500,
      components: [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 1500, isTaxable: true, isInsurable: true },
      ],
    };
    getSalaryProfiles.mockResolvedValue({ profiles: [profile] });

    const lowWageBackendPreview = {
      success: true,
      year: 2024,
      preview: {
        disbursementType: 'Regular',
        grossSalary: 1500,
        basicSalary: 1500,
        taxableIncome: 1500,
        priorYtdGross: 0,
        cumulativeYtdGross: 1500,
        insurableIncome: 2000,
        appliedTaxRate: 0,
        expectedTax: 0,
        includeTax: true,
        includeInsurance: true,
        expectedInsurance: 220, // 2,000 * 11% = 220 EGP statutory floor
        expectedEmployerInsurance: 375,
        includeMartyrsFund: false,
        martyrsFund: 0,
        customDeductions: 0,
        totalDeductions: 220,
        netPay: 1280,
        isLocalFallback: false,
      },
    };

    calculatePaycheckPreview.mockResolvedValue(lowWageBackendPreview);

    render(
      <ToastProvider>
        <PaycheckFormPage />
      </ToastProvider>
    );

    await waitFor(() => {
      const insuranceMatches = screen.getAllByText(/220\.00/);
      expect(insuranceMatches.length).toBeGreaterThan(0);
    });

    const netPayMatches = screen.getAllByText(/1,280\.00/);
    expect(netPayMatches.length).toBeGreaterThan(0);
  });

  it('renders HTTP 400 warning banner when backend preview calculation fails', async () => {
    const profile = {
      _id: 'prof_err',
      name: 'Error Profile',
      isDefault: true,
      basicSalary: 10000,
      components: [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 10000, isTaxable: true, isInsurable: true },
      ],
    };
    getSalaryProfiles.mockResolvedValue({ profiles: [profile] });

    const http400Error = {
      response: {
        status: 400,
        data: {
          message: 'Period and payDate calendar months do not match',
        },
      },
    };

    calculatePaycheckPreview.mockRejectedValue(http400Error);

    render(
      <ToastProvider>
        <PaycheckFormPage />
      </ToastProvider>
    );

    // Verify error banner is rendered with the exact HTTP 400 message
    await waitFor(() => {
      const alertBanner = screen.getByRole('alert');
      expect(alertBanner).toBeInTheDocument();
      expect(alertBanner).toHaveTextContent(/Statutory Preview Calculation Warning/i);
      expect(alertBanner).toHaveTextContent(/Period and payDate calendar months do not match/i);
    });
  });
});
