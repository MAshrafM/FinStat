// frontend/src/components/portfolio/AllocationChart.js
import React, { useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from '../../utils/formatters';
import {
  FaChartPie,
  FaCoins,
  FaBuilding,
  FaScroll,
  FaDollarSign,
  FaHome,
  FaMoneyBillWave,
  FaChartLine,
} from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const ASSET_CONFIG = {
  Stock: {
    bg: 'rgba(56, 189, 248, 0.85)',
    border: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    icon: <FaChartLine color="#38bdf8" />,
  },
  'Mutual Fund': {
    bg: 'rgba(168, 85, 247, 0.85)',
    border: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    icon: <FaBuilding color="#a855f7" />,
  },
  Gold: {
    bg: 'rgba(234, 179, 8, 0.85)',
    border: '#eab308',
    glow: 'rgba(234, 179, 8, 0.4)',
    icon: <FaCoins color="#eab308" />,
  },
  Certificate: {
    bg: 'rgba(45, 212, 191, 0.85)',
    border: '#2dd4bf',
    glow: 'rgba(45, 212, 191, 0.4)',
    icon: <FaScroll color="#2dd4bf" />,
  },
  Currency: {
    bg: 'rgba(249, 115, 22, 0.85)',
    border: '#f97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    icon: <FaDollarSign color="#f97316" />,
  },
  'Real Estate': {
    bg: 'rgba(236, 72, 153, 0.85)',
    border: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.4)',
    icon: <FaHome color="#ec4899" />,
  },
  Cash: {
    bg: 'rgba(148, 163, 184, 0.85)',
    border: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.4)',
    icon: <FaMoneyBillWave color="#94a3b8" />,
  },
  Other: {
    bg: 'rgba(100, 116, 139, 0.85)',
    border: '#64748b',
    glow: 'rgba(100, 116, 139, 0.4)',
    icon: <FaChartPie color="#64748b" />,
  },
};

const AllocationChart = ({ allocations = [], totalInvested = 0, totalCurrentValue = 0 }) => {
  const [allocationMode, setAllocationMode] = useState('current'); // 'current' | 'invested'
  const isCurrent = allocationMode === 'current';

  const totalAmount = isCurrent ? totalCurrentValue : totalInvested;

  const chartData = useMemo(() => {
    const labels = allocations.map((a) => a.assetType);
    const dataValues = allocations.map((a) => (isCurrent ? a.currentValue : a.investedAmount));
    const backgroundColors = allocations.map(
      (a) => (ASSET_CONFIG[a.assetType] || ASSET_CONFIG.Other).bg
    );
    const borderColors = allocations.map(
      (a) => (ASSET_CONFIG[a.assetType] || ASSET_CONFIG.Other).border
    );

    return {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverOffset: 8,
          hoverBorderColor: '#ffffff',
        },
      ],
    };
  }, [allocations, isCurrent]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          padding: 14,
          boxPadding: 8,
          cornerRadius: 10,
          callbacks: {
            label: function (context) {
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((sum, v) => sum + v, 0);
              const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${formatCurrency(val)} (${percentage}%)`;
            },
          },
        },
        datalabels: {
          display: function (context) {
            const val = context.dataset.data[context.dataIndex];
            const total = context.dataset.data.reduce((sum, v) => sum + v, 0);
            return total > 0 && (val / total) * 100 >= 6; // Only show if >= 6%
          },
          formatter: (value, context) => {
            const total = context.dataset.data.reduce((sum, val) => sum + (val || 0), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
            return `${percentage}%`;
          },
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 11,
          },
          anchor: 'center',
          align: 'center',
        },
      },
    }),
    []
  );

  return (
    <div className="allocation-unified-card">
      {/* Card Header & Controls */}
      <div className="allocation-unified-header">
        <div className="allocation-header-title-group">
          <div className="allocation-title-icon-wrap">
            <FaChartPie />
          </div>
          <div>
            <h2>Asset Allocation &amp; Portfolio Composition</h2>
            <p>Visual breakdown of capital distribution across equities, fixed income, real estate, and hard assets.</p>
          </div>
        </div>

        <div className="chart-mode-switcher">
          <button
            className={`chart-mode-pill ${isCurrent ? 'active' : ''}`}
            onClick={() => setAllocationMode('current')}
          >
            Current Market Value
          </button>
          <button
            className={`chart-mode-pill ${!isCurrent ? 'active' : ''}`}
            onClick={() => setAllocationMode('invested')}
          >
            Invested Capital
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="allocation-grid-layout">
        {/* Left Column: Interactive Donut with Center Text */}
        <div className="donut-chart-wrapper">
          <div className="donut-chart-inner">
            {allocations.length > 0 ? (
              <Doughnut data={chartData} options={chartOptions} />
            ) : (
              <div className="empty-chart-notice">No holdings recorded yet</div>
            )}
            {/* Center Dynamic Label */}
            {allocations.length > 0 && (
              <div className="donut-center-info">
                <span className="donut-center-sub">{isCurrent ? 'Current Value' : 'Invested'}</span>
                <span className="donut-center-total">{formatCurrency(totalAmount)}</span>
                <span className="donut-center-badge">{allocations.length} Asset Classes</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Breakdown Cards with Progress Fill Bars */}
        <div className="allocation-distribution-panel">
          <div className="distribution-panel-header">
            <span>Asset Category</span>
            <span>Allocation Value &amp; Weight</span>
          </div>

          <div className="distribution-items-list">
            {allocations.map((item) => {
              const cfg = ASSET_CONFIG[item.assetType] || ASSET_CONFIG.Other;
              const percentage = isCurrent ? item.currentPercentage : item.investedPercentage;
              const amount = isCurrent ? item.currentValue : item.investedAmount;
              const barPercent = Math.min(100, Math.max(0, percentage));

              // Compute gain if in current mode
              const gain = item.currentValue - item.investedAmount;
              const isProfit = gain >= 0;

              return (
                <div key={item.assetType} className="distribution-row-card">
                  <div className="dist-row-top">
                    {/* Category Name & Icon */}
                    <div className="dist-category-wrap">
                      <div className="dist-icon-box" style={{ background: cfg.glow }}>
                        {cfg.icon}
                      </div>
                      <div>
                        <span className="dist-asset-title">{item.assetType}</span>
                        <span className="dist-asset-count">{item.count} holding{item.count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Financial Values */}
                    <div className="dist-values-wrap">
                      <span className="dist-amount">{formatCurrency(amount)}</span>
                      <span className="dist-percent-pill" style={{ borderColor: cfg.border, color: cfg.border }}>
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Sub-metrics */}
                  <div className="dist-progress-wrap">
                    <div className="dist-progress-track">
                      <div
                        className="dist-progress-bar"
                        style={{
                          width: `${barPercent}%`,
                          background: `linear-gradient(90deg, ${cfg.border} 0%, #38bdf8 100%)`,
                        }}
                      ></div>
                    </div>
                    {isCurrent && item.investedAmount > 0 && (
                      <div className="dist-gain-sub">
                        <span>Cost: {formatCurrency(item.investedAmount)}</span>
                        <span style={{ color: isProfit ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                          {isProfit ? '+' : ''}
                          {formatCurrency(gain)} ({((gain / item.investedAmount) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationChart;
