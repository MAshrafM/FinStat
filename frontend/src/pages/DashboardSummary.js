// frontend/src/pages/DashboardSummary.js
import React from 'react';
import useDashboardData from './dashboard/useDashboardData';
import NetWorthHero from './dashboard/NetWorthHero';
import DashboardKpiStrip from './dashboard/DashboardKpiStrip';
import AssetAllocationDonut from './dashboard/AssetAllocationDonut';
import HoldingsGrid from './dashboard/HoldingsGrid';
import BudgetPulseCard from './dashboard/BudgetPulseCard';
import SavingsForexCard from './dashboard/SavingsForexCard';
import ReportsGrid from './dashboard/ReportsGrid';
import './Dashboard.css';

const DashboardSummary = ({ onOpenLauncher = () => {} }) => {
  const {
    isLoading,
    error,
    user,
    canModify,
    calculations,
    assetMix,
    holdings,
    budgetTotals,
    budgetProgressList,
    savingsForexSummary,
    activeAssetCount,
    monthLabel,
    dateLabel,
  } = useDashboardData();

  if (isLoading) {
    return (
      <div className="dashboard-loading" aria-busy="true" aria-label="Loading dashboard">
        <div className="dash-skeleton dash-skeleton-hero" />
        <div className="dash-skeleton-row">
          <div className="dash-skeleton" />
          <div className="dash-skeleton" />
          <div className="dash-skeleton" />
          <div className="dash-skeleton" />
        </div>
        <div className="dash-skeleton dash-skeleton-panel" />
        <p className="dash-loading-copy">
          <span className="dash-loading-spinner" aria-hidden="true" />
          Building your financial overview…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <h2>Unable to load your dashboard</h2>
        <p>{error}</p>
        <button type="button" className="dash-btn dash-btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="dash-content">
      <NetWorthHero
        calculations={calculations}
        assetMix={assetMix}
        user={user}
        canModify={canModify}
        dateLabel={dateLabel}
        onOpenLauncher={onOpenLauncher}
      />

      <DashboardKpiStrip
        calculations={calculations}
        budgetTotals={budgetTotals}
        activeAssetCount={activeAssetCount}
      />

      <AssetAllocationDonut
        holdings={holdings}
        canModify={canModify}
        onOpenLauncher={onOpenLauncher}
      />

      <HoldingsGrid
        holdings={holdings}
        totalCurrent={calculations?.totalCurrent || 0}
        canModify={canModify}
      />

      <div className="dash-two-col">
        <BudgetPulseCard
          budgetProgressList={budgetProgressList}
          monthLabel={monthLabel}
        />
        <SavingsForexCard
          savingsForexSummary={savingsForexSummary}
          realEstates={calculations?.realEstates || []}
          realEstateTotalCurrent={calculations?.realEstateTotalCurrent || 0}
        />
      </div>

      <ReportsGrid
        canModify={canModify}
        onOpenLauncher={onOpenLauncher}
      />
    </div>
  );
};

export default DashboardSummary;
