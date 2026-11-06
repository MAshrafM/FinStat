// frontend/src/pages/salary/__tests__/TaxSimulator.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaxSimulator from '../TaxSimulator';
import * as taxService from '../../../services/taxService';
import { AuthProvider } from '../../../context/AuthContext';

jest.mock('../../../services/taxService');

const mockSimulationResponse = {
  success: true,
  appliedYear: 2024,
  isFallbackConfig: false,
  monthly: {
    grossSalary: 35000,
    employeeSI: 1386,
    personalExemption: 1666.67,
    netTaxableBase: 31947.33,
    incomeTax: 5046.83,
    martyrsFund: 17.5,
    totalDeductions: 6450.33,
    netPay: 28549.67,
    employerSI: 2362.5,
    totalEmployerCost: 37362.5,
  },
  annual: {
    grossSalary: 420000,
    employeeSI: 16632,
    personalExemption: 20000,
    netTaxableBase: 383368,
    incomeTax: 60562,
    martyrsFund: 210,
    totalDeductions: 77404,
    netPay: 342596,
    employerSI: 28350,
    totalEmployerCost: 448350,
  },
  deductions: {
    socialInsurance: {
      employeeRate: 11,
      minCap: 2000,
      maxCap: 12600,
      isCapped: true,
      employeeMonthly: 1386,
      employerMonthly: 2362.5,
    },
    personalExemption: {
      annual: 20000,
      monthly: 1666.67,
    },
    martyrsFund: {
      rate: 0.0005,
      monthly: 17.5,
      annual: 210,
    },
  },
  bracketSlices: [
    { level: 1, bracket: '0 to 40,000', rate: 0, taxableAmount: 40000, tax: 0, isMatched: true },
    { level: 2, bracket: '40,001 to 55,000', rate: 10, taxableAmount: 15000, tax: 1500, isMatched: true },
    { level: 3, bracket: '55,001 to 70,000', rate: 15, taxableAmount: 15000, tax: 2250, isMatched: true },
    { level: 4, bracket: '70,001 to 200,000', rate: 20, taxableAmount: 130000, tax: 26000, isMatched: true },
    { level: 5, bracket: '200,001 to 400,000', rate: 22.5, taxableAmount: 183368, tax: 41257.8, isMatched: true },
    { level: 6, bracket: '400,001 to 1,200,000', rate: 25, taxableAmount: 0, tax: 0, isMatched: false },
    { level: 7, bracket: 'Above 1,200,000', rate: 27.5, taxableAmount: 0, tax: 0, isMatched: false },
  ],
  effectiveTaxRate: 14.42,
  marginalTaxRate: 22.5,
  netToGrossRatio: 81.57,
};

describe('TaxSimulator Component (Step 7D.2b - FEAT-008)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    taxService.simulateSalary.mockResolvedValue({
      data: mockSimulationResponse,
    });
  });

  // Test 1: Renders slider, numeric input, KPI summary cards, and deduction breakdown table
  test('1. Renders slider, numeric input, KPI summary cards, and deduction breakdown table', async () => {
    render(<TaxSimulator />);

    expect(screen.getByText(/Interactive Egyptian Statutory Tax & Salary Modeler/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gross Salary Slider/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gross Salary Input/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/Net Take-Home Pay/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Effective Tax Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Deductions/i)).toBeInTheDocument();
      expect(screen.getByText(/Statutory Deductions Waterfall/i)).toBeInTheDocument();
    });
  });

  // Test 2: Updates simulation instantly when moving gross salary slider
  test('2. Updates simulation instantly when moving gross salary slider', async () => {
    render(<TaxSimulator />);

    const slider = screen.getByLabelText(/Gross Salary Slider/i);
    fireEvent.change(slider, { target: { value: '50000' } });

    await waitFor(() => {
      expect(taxService.simulateSalary).toHaveBeenCalledWith(
        expect.objectContaining({ grossSalary: 50000 })
      );
    });
  });

  // Test 3: Updates simulation instantly when typing into numeric input
  test('3. Updates simulation instantly when typing into numeric input', async () => {
    render(<TaxSimulator />);

    const input = screen.getByLabelText(/Gross Salary Input/i);
    fireEvent.change(input, { target: { value: '65000' } });

    await waitFor(() => {
      expect(taxService.simulateSalary).toHaveBeenCalledWith(
        expect.objectContaining({ grossSalary: 65000 })
      );
    });
  });

  // Test 4: Quick preset buttons update gross salary
  test('4. Quick preset buttons update gross salary', async () => {
    render(<TaxSimulator />);

    const preset25k = screen.getByRole('button', { name: '25k' });
    fireEvent.click(preset25k);

    const input = screen.getByLabelText(/Gross Salary Input/i);
    expect(input.value).toBe('25000');

    await waitFor(() => {
      expect(taxService.simulateSalary).toHaveBeenCalledWith(
        expect.objectContaining({ grossSalary: 25000 })
      );
    });
  });

  // Test 5: Toggles between monthly and annual display views
  test('5. Toggles between monthly and annual display views', async () => {
    render(<TaxSimulator />);

    await waitFor(() => {
      expect(screen.getByText('Gross Salary (Monthly)')).toBeInTheDocument();
    });

    const annualToggle = screen.getByRole('button', { name: /Annual View/i });
    fireEvent.click(annualToggle);

    await waitFor(() => {
      expect(screen.getByText('Gross Salary (Annual)')).toBeInTheDocument();
    });

    const monthlyToggle = screen.getByRole('button', { name: /Monthly View/i });
    fireEvent.click(monthlyToggle);

    await waitFor(() => {
      expect(screen.getByText('Gross Salary (Monthly)')).toBeInTheDocument();
    });
  });

  // Test 6: Renders progressive tax bracket breakdown tiers
  test('6. Renders progressive tax bracket breakdown tiers', async () => {
    render(<TaxSimulator />);

    await waitFor(() => {
      expect(screen.getByText(/Law 175\/2023 Progressive Tax Bracket Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('0 to 40,000')).toBeInTheDocument();
      expect(screen.getByText('Level 4')).toBeInTheDocument();
      expect(screen.getByText('70,001 to 200,000')).toBeInTheDocument();
    });
  });

  // Test 7: Displays Law 148/2019 Social Insurance 11% deduction and cap notes
  test('7. Displays Law 148/2019 Social Insurance 11% deduction and cap notes', async () => {
    render(<TaxSimulator />);

    await waitFor(() => {
      expect(screen.getByText(/Social Insurance \(Employee 11%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Capped at EGP 12,600/i)).toBeInTheDocument();
      expect(screen.getByText('Capped')).toBeInTheDocument();
    });
  });

  // Test 8: Displays Law 4/2021 Martyrs Families Fund deduction
  test('8. Displays Law 4/2021 Martyrs Families Fund deduction', async () => {
    render(<TaxSimulator />);

    await waitFor(() => {
      expect(screen.getByText(/Martyrs Families Fund/i)).toBeInTheDocument();
      expect(screen.getByText(/0.05% of gross wage/i)).toBeInTheDocument();
    });
  });

  // Test 9: Toggles Employer Cost view showing 18.75% employer contribution
  test('9. Toggles Employer Cost view showing 18.75% employer contribution', async () => {
    render(<TaxSimulator />);

    const employerBtn = screen.getByRole('button', { name: /Show Employer Total Employment Cost/i });
    fireEvent.click(employerBtn);

    await waitFor(() => {
      expect(screen.getByText(/Employer Social Insurance \(18.75%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Cost to Company/i)).toBeInTheDocument();
      expect(screen.getByText(/37,362.50/)).toBeInTheDocument();
    });
  });

  // Test 10: Formats numbers using formatCurrency with EGP prefix and thousands separators
  test('10. Formats numbers with EGP prefix and thousands separators', async () => {
    render(<TaxSimulator />);

    await waitFor(() => {
      // 35,000 gross monthly formatted with EGP
      const grossElements = screen.getAllByText(/EGP 35,000.00/i);
      expect(grossElements.length).toBeGreaterThan(0);
      // Net pay formatted with EGP
      const netElements = screen.getAllByText(/EGP 28,549.67/i);
      expect(netElements.length).toBeGreaterThan(0);
    });
  });

  // Test 11: Viewer role can access the page without redirection
  test('11. Viewer role can access the page without redirection', async () => {
    // Provide a mocked viewer auth context
    const viewerUser = {
      _id: 'viewer_user_id',
      email: 'viewer@example.com',
      role: 'viewer',
      canModify: false,
    };

    render(
      <AuthProvider initialUser={viewerUser}>
        <TaxSimulator />
      </AuthProvider>
    );

    // Page mounts successfully for viewer
    expect(screen.getByText(/Interactive Egyptian Statutory Tax & Salary Modeler/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/Net Take-Home Pay/i).length).toBeGreaterThan(0);
    });
  });
});
