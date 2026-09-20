import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ExpenditureAnalysisPage from '../ExpenditureAnalysisPage';
import { getAllExpendituresForAnalysis } from '../../../services/expenditureService';

jest.mock('../../../services/expenditureService', () => ({
  getAllExpendituresForAnalysis: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: ({ data }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      Bar Chart
    </div>
  ),
  Pie: ({ data }) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>
      Pie Chart
    </div>
  ),
}));

describe('ExpenditureAnalysisPage - Calculation and Breakdown Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('correctly aggregates top-ups and withdrawals for September 2026 without paycheck contamination', async () => {
    const mockExpenditures = [
      // September 2026 Top-ups
      {
        _id: '1',
        date: '2026-09-02T00:00:00.000Z',
        transactionType: 'T',
        transactionValue: 5000,
        paymentMethod: 'Bank',
      },
      {
        _id: '2',
        date: '2026-09-15T00:00:00.000Z',
        transactionType: 'T',
        transactionValue: 2500,
        paymentMethod: 'Prepaid',
      },
      // September 2026 Withdrawals
      {
        _id: '3',
        date: '2026-09-05T00:00:00.000Z',
        transactionType: 'W',
        transactionValue: 1200,
        categories: ['Groceries'],
        paymentMethod: 'Bank',
      },
      {
        _id: '4',
        date: '2026-09-20T00:00:00.000Z',
        transactionType: 'W',
        transactionValue: 800,
        categories: ['Dining Out'],
        paymentMethod: 'Prepaid',
      },
      // August 2026 transactions (should not be in Sep)
      {
        _id: '5',
        date: '2026-08-31T00:00:00.000Z',
        transactionType: 'T',
        transactionValue: 9999,
        paymentMethod: 'Bank',
      },
      // October 2026 transactions (should not be in Sep)
      {
        _id: '6',
        date: '2026-10-01T00:00:00.000Z',
        transactionType: 'W',
        transactionValue: 7777,
        categories: ['Rent'],
        paymentMethod: 'Bank',
      },
    ];

    getAllExpendituresForAnalysis.mockResolvedValue(mockExpenditures);

    render(<ExpenditureAnalysisPage />);

    let chartData;
    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      chartData = JSON.parse(barChart.getAttribute('data-chart-data'));
      expect(chartData.datasets[0].data.length).toBe(12);
    });

    // Verify datasets
    const withdrawalsDataset = chartData.datasets.find(d => d.label === 'Withdrawals');
    const topupsDataset = chartData.datasets.find(d => d.label === 'Top-ups');

    expect(withdrawalsDataset).toBeDefined();
    expect(topupsDataset).toBeDefined();

    // Index 8 is September (0: Jan, 1: Feb, 2: Mar, 3: Apr, 4: May, 5: Jun, 6: Jul, 7: Aug, 8: Sep)
    const sepWithdrawals = withdrawalsDataset.data[8];
    const sepTopups = topupsDataset.data[8];

    // Sep Withdrawals: 1200 + 800 = 2000
    expect(sepWithdrawals).toBe(2000);

    // Sep Top-ups: 5000 + 2500 = 7500
    expect(sepTopups).toBe(7500);

    // Verify August (index 7) has only August top-up (9999)
    expect(topupsDataset.data[7]).toBe(9999);
    expect(withdrawalsDataset.data[7]).toBe(0);

    // Verify October (index 9) has only October withdrawal (7777)
    expect(withdrawalsDataset.data[9]).toBe(7777);
    expect(topupsDataset.data[9]).toBe(0);
  });

  it('handles split category withdrawals accurately', async () => {
    const mockExpenditures = [
      {
        _id: 'split1',
        date: '2026-09-10T00:00:00.000Z',
        transactionType: 'W',
        transactionValue: 1000,
        splits: [
          { category: 'Groceries', amount: 600 },
          { category: 'Transportation', amount: 400 },
        ],
      },
    ];

    getAllExpendituresForAnalysis.mockResolvedValue(mockExpenditures);

    render(<ExpenditureAnalysisPage />);

    let chartData;
    await waitFor(() => {
      const barChart = screen.getByTestId('bar-chart');
      chartData = JSON.parse(barChart.getAttribute('data-chart-data'));
      expect(chartData.datasets[0].data.length).toBe(12);
    });

    const withdrawalsDataset = chartData.datasets.find(d => d.label === 'Withdrawals');

    // Sep withdrawal should be total transaction value 1000
    expect(withdrawalsDataset.data[8]).toBe(1000);
  });
});
