// frontend/src/components/portfolio/AllocationChart.js
import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from '../../utils/formatters';
import {
  getChartPalette,
  barDefaults,
  createPattern,
  ariaLabel,
} from '../../styles/chartTheme';
import { Delta, Loading } from '../ui';
import { FaChartBar } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

const AllocationChart = ({ allocations = [], totalInvested = 0, totalCurrentValue = 0, isLoading = false }) => {
  const [allocationMode, setAllocationMode] = useState('current'); // 'current' | 'invested'
  const isCurrent = allocationMode === 'current';

  const totalAmount = isCurrent ? totalCurrentValue : totalInvested;

  // 1. Dynamic sorting and top-6 + "Other" rollup per AD15 & §4.12
  const { topCategories, allSortedCategories } = useMemo(() => {
    if (!allocations || allocations.length === 0) {
      return { topCategories: [], allSortedCategories: [] };
    }

    // Sort descending based on active metric
    const sorted = [...allocations].sort((a, b) => {
      const valA = isCurrent ? a.currentValue : a.investedAmount;
      const valB = isCurrent ? b.currentValue : b.investedAmount;
      return valB - valA;
    });

    if (sorted.length <= 6) {
      return { topCategories: sorted, allSortedCategories: sorted };
    }

    const top6 = sorted.slice(0, 6);
    const rest = sorted.slice(6);

    const otherInvested = rest.reduce((sum, item) => sum + (item.investedAmount || 0), 0);
    const otherCurrent = rest.reduce((sum, item) => sum + (item.currentValue || 0), 0);
    const otherCount = rest.reduce((sum, item) => sum + (item.count || 0), 0);
    const otherWeight = totalAmount > 0
      ? ((isCurrent ? otherCurrent : otherInvested) / totalAmount) * 100
      : 0;

    const otherCategory = {
      assetType: 'Other',
      count: otherCount,
      investedAmount: otherInvested,
      currentValue: otherCurrent,
      currentPercentage: parseFloat(otherWeight.toFixed(1)),
      investedPercentage: parseFloat(otherWeight.toFixed(1)),
      isOtherGroup: true,
      groupItems: rest,
    };

    return {
      topCategories: [...top6, otherCategory],
      allSortedCategories: sorted,
    };
  }, [allocations, isCurrent, totalAmount]);

  // 2. Chart palette and dataset creation (Neutral greys only per I15 & §4.3)
  const { chartData, chartOptions, accessibleSummary } = useMemo(() => {
    const palette = getChartPalette();
    const greyRamp = palette.greys; // [grey1, grey2, grey3, grey4]

    const labels = topCategories.map((item) => item.assetType);
    const dataValues = topCategories.map((item) => (isCurrent ? item.currentValue : item.investedAmount));

    const patternTypes = ['lines', 'dots', 'solid', 'lines', 'dots', 'solid', 'solid'];

    const backgroundColors = topCategories.map((item, idx) => {
      if (item.assetType === 'Other') {
        return createPattern('dots', palette.grey4);
      }
      const baseColor = greyRamp[idx % greyRamp.length];
      const patternType = patternTypes[idx % patternTypes.length];
      return patternType === 'solid' ? baseColor : createPattern(patternType, baseColor);
    });

    const borderColors = topCategories.map((item, idx) => {
      if (item.assetType === 'Other') {
        return palette.grey4;
      }
      return greyRamp[idx % greyRamp.length];
    });

    const summaryPoints = topCategories.map((c) => ({
      label: c.assetType,
      value: formatCurrency(isCurrent ? c.currentValue : c.investedAmount),
    }));

    const options = barDefaults({
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'end',
          offset: 4,
          color: palette.text2,
          font: {
            family: 'IBM Plex Sans, -apple-system, sans-serif',
            size: 11,
            weight: 600,
          },
          formatter: (value) => {
            const pct = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : 0;
            return `${formatCurrency(value)} (${pct}%)`;
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw || 0;
              const pct = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${formatCurrency(val)} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            callback: (val) => formatCurrency(val),
          },
        },
        y: {
          grid: { display: false },
        },
      },
    });

    return {
      chartData: {
        labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 20,
          },
        ],
      },
      chartOptions: options,
      accessibleSummary: ariaLabel('Portfolio Asset Allocation', summaryPoints),
    };
  }, [topCategories, isCurrent, totalAmount]);

  return (
    <div className="allocation-unified-card" data-testid="portfolio-allocation-card">
      {isLoading ? (
        <Loading variant="card" text="Loading asset allocation..." />
      ) : (
        <>
          {/* Header & Controls */}
      <div className="allocation-unified-header">
        <div className="allocation-header-title-group">
          <div className="allocation-title-icon-wrap" aria-hidden="true">
            <FaChartBar />
          </div>
          <div>
            <h2>Asset Allocation &amp; Portfolio Composition</h2>
            <p>Ranked capital distribution across multi-asset categories with full balance breakdown (AD15).</p>
          </div>
        </div>

        <div className="chart-mode-switcher">
          <button
            type="button"
            className={`chart-mode-pill ${isCurrent ? 'active' : ''}`}
            onClick={() => setAllocationMode('current')}
          >
            Current Market Value
          </button>
          <button
            type="button"
            className={`chart-mode-pill ${!isCurrent ? 'active' : ''}`}
            onClick={() => setAllocationMode('invested')}
          >
            Invested Capital
          </button>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="allocation-chart-container">
        {topCategories.length > 0 ? (
          <div className="allocation-bar-canvas-wrap">
            <Bar data={chartData} options={chartOptions} aria-label={accessibleSummary} />
          </div>
        ) : (
          <div className="empty-chart-notice">No asset holdings recorded yet.</div>
        )}
      </div>

      {/* Accessible Data Table Alternative (§4.12) */}
      <div className="allocation-table-section">
        <div className="allocation-table-header">
          <h3>Asset Breakdown Data Table</h3>
          <span className="allocation-table-meta fs-num">
            Total {isCurrent ? 'Valuation' : 'Invested'}: <strong>{formatCurrency(totalAmount)}</strong>
          </span>
        </div>

        <div className="fs-table-container">
          <table className="fs-table allocation-data-table" data-testid="allocation-data-table">
            <thead>
              <tr>
                <th scope="col">Asset Type</th>
                <th scope="col" className="text-right">Holdings</th>
                <th scope="col" className="text-right">Invested Amount</th>
                <th scope="col" className="text-right">Market Value</th>
                <th scope="col" className="text-right">Gain / Loss</th>
                <th scope="col" className="text-right">Allocation Weight</th>
              </tr>
            </thead>
            <tbody>
              {allSortedCategories.map((item) => {
                const gain = item.currentValue - item.investedAmount;
                const isProfit = gain >= 0;
                const gainTone = gain > 0 ? 'positive' : gain < 0 ? 'negative' : 'neutral';
                const gainLabel = isProfit ? 'Gain' : 'Loss';
                const weight = totalAmount > 0
                  ? (((isCurrent ? item.currentValue : item.investedAmount) / totalAmount) * 100).toFixed(1)
                  : '0.0';

                return (
                  <tr key={item.assetType}>
                    <td>
                      <strong className="category-name">{item.assetType}</strong>
                    </td>
                    <td className="text-right fs-num">{item.count}</td>
                    <td className="text-right fs-num">{formatCurrency(item.investedAmount)}</td>
                    <td className="text-right fs-num font-semibold">{formatCurrency(item.currentValue)}</td>
                    <td className="text-right fs-num">
                      <Delta
                        value={formatCurrency(Math.abs(gain))}
                        tone={gainTone}
                        sign={isProfit ? 'positive' : 'negative'}
                        label={gainLabel}
                        className="fs-num"
                      />
                    </td>
                    <td className="text-right fs-num">{weight}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default AllocationChart;
