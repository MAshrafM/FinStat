// frontend/src/pages/dashboard/AssetAllocationDonut.js
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChartPie, FaChevronRight, FaPlus } from 'react-icons/fa';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { formatCurrency } from '../../utils/formatters';

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

    return {
      list,
      total: list.reduce((sum, asset) => sum + asset.value, 0),
    };
  }, [holdings, chartMode]);

  const chartData = useMemo(
    () => ({
      labels: chartSegments.list.map((asset) => asset.name),
      datasets: [
        {
          data: chartSegments.list.map((asset) => asset.value),
          backgroundColor: chartSegments.list.map((asset) => asset.color),
          borderColor: '#0b1220',
          borderWidth: 3,
          hoverOffset: 10,
        },
      ],
    }),
    [chartSegments]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      animation: { animateRotate: true, duration: 650 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(8, 15, 30, 0.96)',
          borderColor: 'rgba(148, 163, 184, 0.25)',
          borderWidth: 1,
          padding: 10,
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
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
          <span className="dash-panel-icon tone-sky">
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
          <div className="dash-donut-wrap">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="dash-donut-center">
              <span>{chartMode === 'current' ? 'Current value' : 'Total invested'}</span>
              <strong>{formatCurrency(chartSegments.total)}</strong>
              <small>{chartSegments.list.length} asset classes</small>
            </div>
          </div>

          <div className="dash-legend">
            {chartSegments.list.map((asset) => {
              const share = (asset.value / chartSegments.total) * 100;
              return (
                <Link key={asset.key} to={asset.viewPath} className="dash-legend-row">
                  <span className="dash-legend-dot" style={{ background: asset.color }} />
                  <span className="dash-legend-name">{asset.name}</span>
                  <span className="dash-legend-value">{formatCurrency(asset.value)}</span>
                  <span className="dash-legend-share">{share.toFixed(1)}%</span>
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
              className="dash-btn dash-btn-primary"
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
