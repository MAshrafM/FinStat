// frontend/src/pages/dashboard/AssetAllocationDonut.js
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChartPie, FaChevronRight, FaPlus } from 'react-icons/fa';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { formatCurrency } from '../../utils/formatters';
import { getChartPalette, doughnutDefaults, ariaLabel } from '../../styles/chartTheme';

ChartJS.register(ArcElement, Tooltip);

const AssetAllocationDonut = ({
  holdings = [],
  canModify = false,
  onOpenLauncher = () => {},
}) => {
  const [chartMode, setChartMode] = useState('current');

  const chartSegments = useMemo(() => {
    const list = holdings
      .map((asset) => ({
        ...asset,
        value: chartMode === 'current' ? asset.current : asset.invested,
      }))
      .filter((asset) => asset.value > 0);

    const total = list.reduce((sum, asset) => sum + asset.value, 0);

    // Enforce <= 4 segments cap per §4.12
    let cappedList = list;
    if (list.length > 4) {
      const sorted = [...list].sort((a, b) => b.value - a.value);
      const top3 = sorted.slice(0, 3);
      const otherTotal = sorted.slice(3).reduce((acc, curr) => acc + curr.value, 0);
      cappedList = [
        ...top3,
        {
          key: 'other',
          name: 'Other',
          value: otherTotal,
          viewPath: '#',
        },
      ];
    }

    return {
      list,
      cappedList,
      total,
    };
  }, [holdings, chartMode]);

  const palette = getChartPalette();

  const chartData = useMemo(() => {
    const colors = [
      palette.greys[0],
      palette.greys[1],
      palette.greys[2],
      palette.greys[3],
    ];

    return {
      labels: chartSegments.cappedList.map((asset) => asset.name),
      datasets: [
        {
          data: chartSegments.cappedList.map((asset) => asset.value),
          backgroundColor: chartSegments.cappedList.map((_, i) => colors[i % colors.length]),
          borderColor: 'var(--fs-surface)',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [chartSegments, palette]);

  const chartOptions = useMemo(
    () =>
      doughnutDefaults({
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => ` ${formatCurrency(context.raw)}`,
            },
          },
        },
      }),
    []
  );

  return (
    <section className="dash-panel dash-allocation">
      <div className="dash-panel-head">
        <div className="dash-panel-title">
          <span className="dash-panel-icon">
            <FaChartPie aria-hidden="true" />
          </span>
          <div>
            <h2>Asset allocation</h2>
            <p>How your wealth is distributed across asset classes.</p>
          </div>
        </div>
        <div className="dash-toggle" role="group" aria-label="Allocation value basis">
          <button
            type="button"
            className={`dash-toggle-btn ${chartMode === 'current' ? 'active' : ''}`}
            onClick={() => setChartMode('current')}
          >
            Current
          </button>
          <button
            type="button"
            className={`dash-toggle-btn ${chartMode === 'invested' ? 'active' : ''}`}
            onClick={() => setChartMode('invested')}
          >
            Invested
          </button>
        </div>
      </div>

      {chartSegments.total > 0 ? (
        <div className="dash-allocation-body">
          <div
            className="dash-donut-wrap"
            role="img"
            aria-label={ariaLabel('Asset allocation', chartSegments.cappedList)}
          >
            <Doughnut data={chartData} options={chartOptions} />
            <div className="dash-donut-center">
              <span>{chartMode === 'current' ? 'Current value' : 'Total invested'}</span>
              <strong className="fs-num">{formatCurrency(chartSegments.total)}</strong>
              <small>{chartSegments.list.length} asset classes</small>
            </div>
          </div>

          <div className="dash-legend">
            {chartSegments.list.map((asset, index) => {
              const share = (asset.value / chartSegments.total) * 100;
              return (
                <Link key={asset.key} to={asset.viewPath} className="dash-legend-row">
                  <span
                    className={`dash-legend-dot dash-legend-dot--${index % 4}`}
                    aria-hidden="true"
                  />
                  <span className="dash-legend-name">{asset.name}</span>
                  <span className="dash-legend-value fs-num">{formatCurrency(asset.value)}</span>
                  <span className="dash-legend-share fs-num">{share.toFixed(1)}%</span>
                  <FaChevronRight className="dash-legend-chevron" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="dash-empty">
          <FaChartPie aria-hidden="true" />
          <h3>No holdings yet</h3>
          <p>Add your first investment or asset to see your allocation come to life.</p>
          {canModify && (
            <button
              type="button"
              className="fs-btn fs-btn-primary"
              onClick={() => onOpenLauncher('create')}
            >
              <FaPlus aria-hidden="true" /> Add a holding
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default React.memo(AssetAllocationDonut);
