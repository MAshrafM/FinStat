// frontend/src/components/AnalysisCard.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatCurrency } from '../utils/formatters';
import './AnalysisCard.css';

// Register the components Chart.js needs
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const AnalysisCard = ({ title, paychecks, monthLabels }) => {
  // Calculate total sum of paychecks for the period
  const total = paychecks.reduce((sum, p) => sum + p.amount, 0);

  // Group paychecks by month (e.g., "2024-01")
  const monthlySums = paychecks.reduce((acc, p) => {
    acc[p.month] = (acc[p.month] || 0) + p.amount;
    return acc;
  }, {});

  // Calculate the number of unique months with data
  const numberOfMonths = Object.keys(monthlySums).length;
  const average = numberOfMonths > 0 ? total / numberOfMonths : 0;

  // Prepare data for the chart
  const chartData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Monthly Sum',
        // Map the sums to the correct month label, or 0 if no data
        data: monthLabels.map(month => monthlySums[month] || 0),
        backgroundColor: 'rgba(0, 152, 121, 0.6)',
      },
      {
        label: 'Period Average',
        data: Array(12).fill(average), // Show average line across all months
        type: 'line', // Display this dataset as a line
        borderColor: '#c0392b',
        backgroundColor: 'transparent',
        pointRadius: 0, // Hide points on the line
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Monthly Income for ${title}` },
    },
  };

  return (
    <div className="analysis-card">
      <h2>{title}</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <h4>Total Income</h4>
          <p>{formatCurrency(total)}</p>
        </div>
        <div className="stat-item">
          <h4>Active Months</h4>
          <p>{numberOfMonths}</p>
        </div>
        <div className="stat-item">
          <h4>Average per Month</h4>
          <p>{formatCurrency(average)}</p>
        </div>
      </div>
      <div className="chart-wrapper">
        <div className="chart-container">
          <Bar options={chartOptions} data={chartData} />
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;
