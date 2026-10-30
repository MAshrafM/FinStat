// frontend/src/pages/salary/__tests__/PayrollRulesHub.test.js
jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PayrollRulesHub from '../PayrollRulesHub';
import { getBrackets } from '../../../services/taxService';
import { getRecords } from '../../../services/socialInsuranceService';
import { getPaychecks } from '../../../services/paycheckService';

jest.mock('../../../services/taxService', () => ({
  getBrackets: jest.fn(),
}));

jest.mock('../../../services/socialInsuranceService', () => ({
  getRecords: jest.fn(),
}));

jest.mock('../../../services/paycheckService', () => ({
  getPaychecks: jest.fn(),
}));

const mockTaxInfo = {
  year: 2024,
  country: 'Egypt',
  personalExemption: 15000,
  isActive: true,
  brackets: [
    { level: 1, from: 0, to: 40000, rate: 0 },
    { level: 2, from: 40001, to: 55000, rate: 0.1 },
    { level: 3, from: 55001, to: 70000, rate: 0.15 },
  ],
};

const mockInsuranceRecords = [
  { year: 2024, registeredIncome: 60000, yearlyIncome: 144000, individualShare: 0.11, burden: 6600 },
];

const mockPaychecks = [
  { _id: '1', month: '2024-03', amount: 10000, grossAmount: 12000, taxDeduction: 1000, insuranceDeduction: 500, type: 'Cash' },
  { _id: '2', month: '2024-08', amount: 10000, grossAmount: 12000, taxDeduction: 1000, insuranceDeduction: 500, type: 'Cash' },
];

describe('Step 6A.4: [SIMP-007] PayrollRulesHub Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBrackets.mockResolvedValue(mockTaxInfo);
    getRecords.mockResolvedValue(mockInsuranceRecords);
    getPaychecks.mockResolvedValue(mockPaychecks);
  });

  const renderPage = (initialRoute = '/salary/rules', initialTab = undefined) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <PayrollRulesHub initialTab={initialTab} />
      </MemoryRouter>
    );
  };

  test('1. renders Income Tax Brackets tab by default with active brackets and summary', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Payroll & Statutory Rules/i)).toBeInTheDocument();
      expect(screen.getByText(/Current Tax Brackets/i)).toBeInTheDocument();
      expect(screen.getByText(/Grand Totals \(All Time\)/i)).toBeInTheDocument();
    });

    const taxesTab = screen.getByRole('tab', { name: /Income Tax Brackets/i });
    expect(taxesTab).toHaveAttribute('aria-selected', 'true');
  });

  test('2. switches to Social Insurance Rules tab when clicking Social Insurance tab button', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Income Tax Brackets/i)).toBeInTheDocument();
    });

    const insuranceTab = screen.getByRole('tab', { name: /Social Insurance Rules/i });
    fireEvent.click(insuranceTab);

    await waitFor(() => {
      expect(insuranceTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText(/Total Insurance Paid to Date/i)).toBeInTheDocument();
      expect(screen.getByText(/Registered Income:/i)).toBeInTheDocument();
    });
  });

  test('3. respects ?tab=insurance URL query param on initial mount', async () => {
    renderPage('/salary/rules?tab=insurance');

    await waitFor(() => {
      const insuranceTab = screen.getByRole('tab', { name: /Social Insurance Rules/i });
      expect(insuranceTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText(/Total Insurance Paid to Date/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Current Tax Brackets/i)).not.toBeInTheDocument();
  });

  test('4. respects initialTab prop when passed directly via legacy wrapper component', async () => {
    renderPage('/taxes', 'insurance');

    await waitFor(() => {
      const insuranceTab = screen.getByRole('tab', { name: /Social Insurance Rules/i });
      expect(insuranceTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText(/Total Insurance Paid to Date/i)).toBeInTheDocument();
    });
  });

  test('5. viewer role has full read-only access with zero edit controls or destructive actions present', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Current Tax Brackets/i)).toBeInTheDocument();
    });

    // Ensure no admin edit/delete buttons exist on the rules hub
    expect(screen.queryByRole('button', { name: /Edit Brackets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Record/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  test('6. accurately computes yearly summaries and grand totals without missing data', async () => {
    renderPage();

    // 1000 + 1000 = 2000 tax deduction
    await waitFor(() => {
      expect(screen.getAllByText(/\$2,000\.00/i).length).toBeGreaterThan(0);
    });

    // Switch to insurance tab
    const insuranceTab = screen.getByRole('tab', { name: /Social Insurance Rules/i });
    fireEvent.click(insuranceTab);

    // 500 + 500 = 1000 insurance deduction
    await waitFor(() => {
      expect(screen.getByText(/\$1,000\.00/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Yearly Burden/i).length).toBeGreaterThan(0);
    });
  });
});
