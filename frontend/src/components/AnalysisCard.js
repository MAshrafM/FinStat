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
import { getChartPalette, withAlpha } from '../styles/chartTheme';
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
  const total = paychecks.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Group paychecks by month (e.g., "2024-01")
  const monthlySums = paychecks.reduce((acc, p) => {
    if (p.month) {
      acc[p.month] = (acc[p.month] || 0) + (p.amount || 0);
    }
    return acc;
  }, {});

  // Calculate the number of unique months with data
  const numberOfMonths = Object.keys(monthlySums).length;
  const average = numberOfMonths > 0 ? total / numberOfMonths : 0;

  // Obtain dynamic theme palette per D22 constraint 3
  const palette = getChartPalette();

  // Prepare data for the chart using neutral grey ramp (Teal strictly forbidden per D22)
  const chartData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Monthly Sum',
        data: monthLabels.map((month) => monthlySums[month] || 0),
        backgroundColor: withAlpha(palette.grey1, 0.75),
        hoverBackgroundColor: palette.grey1,
        borderRadius: 4,
      },
      {
        label: 'Period Average',
        data: Array(monthLabels.length).fill(average),
        type: 'line',
        borderColor: palette.grey2,
        borderDash: [5, 5],
        borderWidth: 2,
        backgroundColor: 'transparent',
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: palette.text2,
          font: { family: 'IBM Plex Sans, sans-serif', size: 12 },
        },
      },
      title: {
        display: true,
        text: `Monthly Income for ${title}`,
        color: palette.text2,
        font: { family: 'IBM Plex Sans, sans-serif', size: 14, weight: 600 },
      },
      tooltip: {
        backgroundColor: palette.surface,
        titleColor: palette.text2,
        bodyColor: palette.text2,
        borderColor: palette.grey3,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: palette.text2,
          font: { family: 'IBM Plex Sans, sans-serif', size: 11 },
        },
        grid: {
          color: withAlpha(palette.grey3, 0.15),
        },
      },
      y: {
        ticks: {
          color: palette.text2,
          font: { family: 'IBM Plex Sans, sans-serif', size: 11 },
        },
        grid: {
          color: withAlpha(palette.grey3, 0.15),
        },
      },
    },
  };

  return (
    <div className="analysis-card fs-card">
      <h2>{title}</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <h4>Total Income</h4>
          <p className="fs-num">{formatCurrency(total)}</p>
        </div>
        <div className="stat-item">
          <h4>Active Months</h4>
          <p className="fs-num">{numberOfMonths}</p>
        </div>
        <div className="stat-item">
          <h4>Average per Month</h4>
          <p className="fs-num">{formatCurrency(average)}</p>
        </div>
      </div>
      <div className="chart-wrapper">
        <div className="chart-container">
          <Bar
            aria-label={`Monthly income bar chart for ${title}`}
            options={chartOptions}
            data={chartData}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;
