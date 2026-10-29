// frontend/src/pages/salary/__tests__/PaycheckFormPage.test.js
jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PaycheckFormPage from '../PaycheckFormPage';
import { ToastProvider } from '../../../context/ToastContext';
import {
  createPaycheck,
  getPaycheckById,
  updatePaycheck,
  calculatePaycheckPreview,
} from '../../../services/paycheckService';
import { getSalaryProfiles } from '../../../services/salaryProfileService';
import { getProfile as getLegacyProfile } from '../../../services/salaryService';
import { getUserProfile } from '../../../services/userService';

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

describe('Step 5B.2: [AUD-TEST-002] PaycheckFormPage User Journey & Statutory Verification', () => {
  const mockProfile = {
    _id: 'prof_corp_lead',
    name: 'Lead Engineer',
    isDefault: true,
    basicSalary: 15000,
    components: [
      {
        name: 'Basic Salary',
        category: 'basic',
        type: 'fixed',
        value: 15000,
        isTaxable: true,
        isInsurable: true,
        isActive: true,
      },
    ],
  };

  const mockStatutoryPreview = {
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
      expectedInsurance: 1386.00,
      expectedEmployerInsurance: 2362.50,
      includeMartyrsFund: false,
      martyrsFund: 0,
      customDeductions: 0,
      totalDeductions: 2921.30,
      netPay: 12078.70,
      isLocalFallback: false,
    },
    appliedConfig: {
      minInsurableIncome: 2000,
      maxInsurableIncome: 12600,
      employeeRate: 11,
    },
  };

  const renderWithRouter = (initialRoute = '/salary/paychecks/new') => {
    return render(
      <ToastProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/salary/paychecks/new" element={<PaycheckFormPage />} />
            <Route path="/salary/paychecks/edit/:id" element={<PaycheckFormPage />} />
            <Route path="/paycheck-log" element={<div data-testid="paycheck-log-screen">Paycheck Log Screen</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getLegacyProfile.mockResolvedValue({ success: true, profile: null });
    getUserProfile.mockResolvedValue({ success: true, user: {} });
    getSalaryProfiles.mockResolvedValue({ profiles: [mockProfile] });
    calculatePaycheckPreview.mockResolvedValue(mockStatutoryPreview);
    createPaycheck.mockResolvedValue({ success: true, paycheck: { _id: 'pc_new' } });
    updatePaycheck.mockResolvedValue({ success: true, paycheck: { _id: 'pc_existing' } });
  });

  it('1. auto-selects default salary profile and initializes salary components on mount', async () => {
    const { container } = renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText(/Loading profile & paycheck details/i)).not.toBeInTheDocument();
    });

    // Profile select dropdown should have selected the default profile id
    const profileSelect = container.querySelector('select.form-control');
    expect(profileSelect).not.toBeNull();
    expect(profileSelect.value).toBe('prof_corp_lead');

    // Salary components from profile should be loaded in ComponentTable input
    await waitFor(() => {
      const compInput = container.querySelector('input.component-input');
      expect(compInput).not.toBeNull();
      expect(compInput.value).toBe('Basic Salary');
    });
  });

  it('2. triggers live statutory preview and accurately renders the four statutory cards with formatted EGP values', async () => {
    const { container } = renderWithRouter();

    await waitFor(() => {
      expect(calculatePaycheckPreview).toHaveBeenCalled();
    });

    // Verify all four statutory summary figures are rendered with exact currency output in stat cards
    await waitFor(() => {
      const statAmounts = container.querySelectorAll('.preview-stat-card .stat-amount');
      expect(statAmounts.length).toBe(4);
      expect(statAmounts[0]).toHaveTextContent('EGP 15,000.00');
      expect(statAmounts[1]).toHaveTextContent('EGP 1,535.30');
      expect(statAmounts[2]).toHaveTextContent('EGP 1,386.00');
      expect(statAmounts[3]).toHaveTextContent('EGP 12,078.70');
    });

    // Verify card labels
    const statTitles = container.querySelectorAll('.preview-stat-card .stat-title');
    expect(statTitles.length).toBe(4);
    expect(statTitles[0]).toHaveTextContent(/Suggested Gross/i);
    expect(statTitles[1]).toHaveTextContent(/Suggested Tax/i);
    expect(statTitles[2]).toHaveTextContent(/Social Insurance/i);
    expect(statTitles[3]).toHaveTextContent(/Suggested Net Pay/i);
  });

  it('3. re-triggers preview calculation when user clicks Recalculate Estimate button', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(calculatePaycheckPreview).toHaveBeenCalledTimes(1);
    });

    const recalcBtn = screen.getByRole('button', { name: /Recalculate Estimate/i });
    expect(recalcBtn).toBeInTheDocument();
    fireEvent.click(recalcBtn);

    await waitFor(() => {
      expect(calculatePaycheckPreview).toHaveBeenCalledTimes(2);
    });
  });

  it('4. displays #preview-error-banner alert when backend statutory calculation endpoint rejects request', async () => {
    const errorMsg = 'Statutory progressive tax configuration missing for year 2024';
    calculatePaycheckPreview.mockRejectedValue({
      response: {
        status: 400,
        data: { message: errorMsg },
      },
    });

    const { container } = renderWithRouter();

    // The alert banner should render containing the exact error message
    await waitFor(() => {
      const banner = container.querySelector('#preview-error-banner');
      expect(banner).not.toBeNull();
      expect(banner).toHaveAttribute('role', 'alert');
      expect(banner).toHaveTextContent(/Statutory Preview Calculation Warning:/i);
      expect(banner).toHaveTextContent(errorMsg);
    });
  });

  it('5. allows direct entry and overriding of payslip numbers in Step 4 manual fields', async () => {
    const { container } = renderWithRouter();

    await waitFor(() => {
      expect(calculatePaycheckPreview).toHaveBeenCalled();
    });

    // Sync from Calculator button populates manual fields
    const syncBtn = screen.getByRole('button', { name: /Sync from Calculator/i });
    fireEvent.click(syncBtn);

    // Overriding gross and tax
    const grossInput = container.querySelector('input[placeholder="15000"]');
    expect(grossInput).not.toBeNull();
    fireEvent.change(grossInput, { target: { value: '16000' } });

    const taxInput = container.querySelector('input[placeholder="1535.3"]');
    expect(taxInput).not.toBeNull();
    fireEvent.change(taxInput, { target: { value: '1700' } });

    expect(grossInput.value).toBe('16000');
    expect(taxInput.value).toBe('1700');
  });

  it('6. normalizes payDate input to UTC midday and navigates to /paycheck-log upon valid form submission', async () => {
    const { container } = renderWithRouter();

    await waitFor(() => {
      expect(calculatePaycheckPreview).toHaveBeenCalled();
    });

    // Find payDate input element
    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput).not.toBeNull();

    // Set payDate to a specific calendar date (which also syncs period to 2024-05)
    fireEvent.change(dateInput, { target: { value: '2024-05-15' } });

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /Save & Log Regular/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createPaycheck).toHaveBeenCalled();
    });

    expect(createPaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        disbursementType: 'Regular',
        payDate: '2024-05-15T12:00:00.000Z',
        period: '2024-05',
        grossSalary: 15000,
        taxDeduction: 1535.30,
        insuranceDeduction: 1386.00,
        amount: 12078.70,
      })
    );

    // Verifies navigation to paycheck-log screen
    await waitFor(() => {
      expect(screen.getByTestId('paycheck-log-screen')).toBeInTheDocument();
    });
  });

  it('7. loads existing paycheck details in edit mode and updates submit button label', async () => {
    const existingPaycheck = {
      _id: 'pc_existing_123',
      disbursementType: 'Regular',
      period: '2024-06',
      payDate: '2024-06-25T12:00:00.000Z',
      grossSalary: 20000,
      netPay: 16000,
      taxDeduction: 2200,
      insuranceDeduction: 1800,
      martyrsFund: 10,
      notes: 'Mid-year performance payout',
      components: [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 20000, isTaxable: true, isInsurable: true },
      ],
    };
    getPaycheckById.mockResolvedValue(existingPaycheck);

    const { container } = renderWithRouter('/salary/paychecks/edit/pc_existing_123');

    await waitFor(() => {
      expect(getPaycheckById).toHaveBeenCalledWith('pc_existing_123');
    });

    // In edit mode, submit button label is "Update Paycheck Record"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Paycheck Record/i })).toBeInTheDocument();
    });

    // Notes field should be populated with existing paycheck notes
    const notesTextarea = container.querySelector('textarea');
    expect(notesTextarea).not.toBeNull();
    expect(notesTextarea.value).toBe('Mid-year performance payout');
  });

  it('8. submits updated paycheck data via updatePaycheck in edit mode', async () => {
    const existingPaycheck = {
      _id: 'pc_edit_456',
      disbursementType: 'Regular',
      period: '2024-07',
      payDate: '2024-07-28T12:00:00.000Z',
      grossSalary: 25000,
      netPay: 20000,
      taxDeduction: 3000,
      insuranceDeduction: 2000,
      components: [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 25000, isTaxable: true, isInsurable: true },
      ],
    };
    getPaycheckById.mockResolvedValue(existingPaycheck);

    renderWithRouter('/salary/paychecks/edit/pc_edit_456');

    await waitFor(() => {
      expect(getPaycheckById).toHaveBeenCalledWith('pc_edit_456');
    });

    const updateBtn = screen.getByRole('button', { name: /Update Paycheck Record/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(updatePaycheck).toHaveBeenCalledWith(
        'pc_edit_456',
        expect.objectContaining({
          period: '2024-07',
          payDate: '2024-07-28T12:00:00.000Z',
        })
      );
    });

    // Verifies navigation to paycheck-log screen
    await waitFor(() => {
      expect(screen.getByTestId('paycheck-log-screen')).toBeInTheDocument();
    });
  });

  it('9. disables tax when switching to tax-exempt disbursement type (Bond Distribution)', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Bond Distribution')).toBeInTheDocument();
    });

    // Click Bond Distribution button
    const bondBtn = screen.getByText('Bond Distribution').closest('button');
    expect(bondBtn).not.toBeNull();
    fireEvent.click(bondBtn);

    // Apply Income Tax Bracket checkbox should now be unchecked
    const taxCheckbox = screen.getByLabelText(/Apply Income Tax Bracket/i);
    expect(taxCheckbox.checked).toBe(false);
  });
});
