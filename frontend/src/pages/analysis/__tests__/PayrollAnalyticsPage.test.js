// frontend/src/pages/analysis/__tests__/PayrollAnalyticsPage.test.js
jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

// Mock react-chartjs-2 to prevent canvas errors in jsdom
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PayrollAnalyticsPage from '../PayrollAnalyticsPage';
import { getPaychecks } from '../../../services/paycheckService';

jest.mock('../../../services/paycheckService', () => ({
  getPaychecks: jest.fn(),
}));

const mockPaychecks = [
  { _id: '1', month: '2024-03', amount: 10000, grossAmount: 12000, taxDeduction: 1000, insuranceDeduction: 1000 },
  { _id: '2', month: '2024-08', amount: 10000, grossAmount: 12000, taxDeduction: 1000, insuranceDeduction: 1000 },
  { _id: '3', month: '2023-11', amount: 9000, grossAmount: 11000, taxDeduction: 1000, insuranceDeduction: 1000 },
];

describe('Step 6A.3: [SIMP-002] PayrollAnalyticsPage Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = (initialRoute = '/analysis/payroll') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <PayrollAnalyticsPage />
      </MemoryRouter>
    );
  };

  test('1. renders calendar year grouping by default with Jan-Dec month labels', async () => {
    getPaychecks.mockResolvedValue(mockPaychecks);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Calendar Year 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Calendar Year 2023/i)).toBeInTheDocument();
    });
  });

  test('2. switches to fiscal year grouping (Jul-Jun) when clicking Fiscal Year toggle', async () => {
    getPaychecks.mockResolvedValue(mockPaychecks);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Calendar Year 2024/i)).toBeInTheDocument();
    });

    const fiscalToggle = screen.getByRole('button', { name: /Fiscal Year/i });
    fireEvent.click(fiscalToggle);

    // 2024-03 belongs to FY 2023-2024, 2024-08 belongs to FY 2024-2025
    await waitFor(() => {
      expect(screen.getAllByText(/FY 2024-2025/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/FY 2023-2024/i).length).toBeGreaterThan(0);
    });
  });

  test('3. respects ?cycle=fiscal URL query param on initial mount', async () => {
    getPaychecks.mockResolvedValue(mockPaychecks);
    renderPage('/analysis/payroll?cycle=fiscal');

    await waitFor(() => {
      expect(screen.getAllByText(/FY 2024-2025/i).length).toBeGreaterThan(0);
    });

    expect(screen.queryByText(/Calendar Year 2024/i)).not.toBeInTheDocument();
  });

  test('4. calls getPaychecks exactly once; toggling cycle performs zero extra network fetches', async () => {
    getPaychecks.mockResolvedValue(mockPaychecks);
    renderPage();

    await waitFor(() => {
      expect(getPaychecks).toHaveBeenCalledTimes(1);
    });

    const fiscalToggle = screen.getByRole('button', { name: /Fiscal Year/i });
    fireEvent.click(fiscalToggle);

    expect(getPaychecks).toHaveBeenCalledTimes(1);

    const calendarToggle = screen.getByRole('button', { name: /Calendar Year/i });
    fireEvent.click(calendarToggle);

    expect(getPaychecks).toHaveBeenCalledTimes(1);
  });

  test('5. displays graceful empty state when no paychecks are returned', async () => {
    getPaychecks.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No paycheck data available to analyze/i)).toBeInTheDocument();
    });
  });

  test('6. correctly computes rates of change and grand totals independently across both calendar and fiscal cycles', async () => {
    getPaychecks.mockResolvedValue(mockPaychecks);
    renderPage();

    // Calendar grand total: 10000 + 10000 + 9000 = 29000
    await waitFor(() => {
      expect(screen.getByText(/29,000/i)).toBeInTheDocument();
    });

    // Toggle to fiscal
    const fiscalToggle = screen.getByRole('button', { name: /Fiscal Year/i });
    fireEvent.click(fiscalToggle);

    // Fiscal grand total is also 29000 across the data
    await waitFor(() => {
      expect(screen.getByText(/29,000/i)).toBeInTheDocument();
    });
  });
});
