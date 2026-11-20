/* eslint-disable import/first */
// frontend/src/pages/salary/__tests__/PaycheckFormPageAxe.test.js
jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'jest-axe';
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
import { expectNoA11yViolations } from '../../../../tests/a11y/expectNoA11yViolations';

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

describe('UI Phase 5C: PaycheckFormPage Accessibility (axe-core)', () => {
  const mockProfile = {
    _id: 'prof_test_lead',
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

  const mockPreview = {
    success: true,
    preview: {
      disbursementType: 'Regular',
      multiplier: 1,
      unitRate: 15000,
      grossSalary: 15000,
      basicSalary: 15000,
      taxableIncome: 15000,
      priorYtdGross: 0,
      cumulativeYtdGross: 15000,
      insurableIncome: 14000,
      appliedTaxRate: 10,
      matchedBracket: 2,
      expectedTax: 1200,
      expectedInsurance: 1540,
      expectedEmployerInsurance: 2625,
      martyrsFund: 7.5,
      customDeductions: 0,
      totalDeductions: 2747.5,
      netPay: 12252.5,
      isLocalFallback: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getSalaryProfiles.mockResolvedValue({ profiles: [mockProfile], success: true });
    getLegacyProfile.mockResolvedValue({ basicSalary: 15000, components: mockProfile.components });
    getUserProfile.mockResolvedValue({ defaultCurrency: 'EGP' });
    calculatePaycheckPreview.mockResolvedValue(mockPreview);
    createPaycheck.mockResolvedValue({ success: true });
    getPaycheckById.mockResolvedValue({ success: true, paycheck: { _id: 'pc-1', period: '2026-08', disbursementType: 'Regular' } });
    updatePaycheck.mockResolvedValue({ success: true });
  });

  it('renders without serious or critical accessibility violations in creation mode (§7.1)', async () => {
    const { container } = render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/salary/paychecks/new']}>
          <Routes>
            <Route path="/salary/paychecks/new" element={<PaycheckFormPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading profile & paycheck details/i)).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /paycheck calculator & entry/i })).toBeInTheDocument();

    // 1. Assert zero critical or serious accessibility violations per §7.1
    const axeResults = await axe(container);
    const criticalOrSerious = axeResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toEqual([]);

    // 2. Assert expectNoA11yViolations helper passes with component-level heading-order waived
    await expectNoA11yViolations(container, {
      rules: {
        'heading-order': { enabled: false },
      },
    });
  });
});
