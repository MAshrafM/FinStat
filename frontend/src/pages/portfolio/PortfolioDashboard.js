// frontend/src/pages/portfolio/PortfolioDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getPortfolioSummary,
  getPortfolioHoldings,
  getPortfolioAllocation,
} from '../../services/portfolioService';
import { updateUserProfile } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import SummaryCards from '../../components/portfolio/SummaryCards';
import AllocationChart from '../../components/portfolio/AllocationChart';
import HoldingsTable from '../../components/portfolio/HoldingsTable';
import { FaSyncAlt, FaBalanceScale, FaCheck } from 'react-icons/fa';
import './Portfolio.css';

const PortfolioDashboard = () => {
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Role info for View-Only mode banner
  const [userRole, setUserRole] = useState('viewer');
  const [parentUsername, setParentUsername] = useState(null);
  const [costBasisMethod, setCostBasisMethod] = useState('average');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed.role) setUserRole(parsed.role);
        if (parsed.parentUsername) setParentUsername(parsed.parentUsername);
        if (parsed.costBasisMethod) setCostBasisMethod(parsed.costBasisMethod);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const loadData = useCallback(async (isRefresh = false, methodOverride = null) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const activeMethod = methodOverride || costBasisMethod;

      const [summaryData, holdingsData, allocationData] = await Promise.all([
        getPortfolioSummary(isRefresh, {}, activeMethod),
        getPortfolioHoldings({ refresh: isRefresh, costBasisMethod: activeMethod }),
        getPortfolioAllocation(isRefresh, {}, activeMethod),
      ]);

      setSummary(summaryData);
      setHoldings(holdingsData.data || []);
      setAllocations(allocationData.allocations || []);
    } catch (err) {
      console.error('Failed to load portfolio analytics:', err);
      setError(err.message || 'Unable to retrieve portfolio data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [costBasisMethod]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleMethodChange = async (newMethod) => {
    if (newMethod === costBasisMethod || isRefreshing) return;
    setCostBasisMethod(newMethod);

    // Update local storage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        parsed.costBasisMethod = newMethod;
        localStorage.setItem('user', JSON.stringify(parsed));
      } catch (e) {}
    }

    // Persist to user profile
    try {
      await updateUserProfile({ costBasisMethod: newMethod });
      addToast(`Accounting method switched to ${newMethod.toUpperCase()}`, 'success');
    } catch (err) {
      console.warn('Could not persist costBasisMethod to profile:', err);
    }

    // Reload portfolio with the new method
    loadData(true, newMethod);
  };

  if (isLoading) {
    return (
      <div className="portfolio-page-wrapper">
        <div className="portfolio-container">
          <div className="empty-holdings-box" style={{ paddingTop: '100px' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Loading Unified Investment Portfolio...</h2>
            <p>Aggregating market prices, multi-asset valuations, and performance metrics.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-page-wrapper">
        <div className="portfolio-container">
          <div className="empty-holdings-box" style={{ paddingTop: '80px' }}>
            <h2 style={{ color: '#f87171' }}>Failed to Load Portfolio</h2>
            <p>{error}</p>
            <button className="refresh-btn" onClick={() => loadData(false)} style={{ marginTop: '16px' }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-page-wrapper">
      <div className="portfolio-container">
        {/* Viewer Mode Banner */}
        {userRole === 'viewer' && (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '12px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#bae6fd',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>👁️</span>
            <div>
              <strong>View-Only Mode:</strong> You are currently viewing portfolio data belonging to{' '}
              <strong style={{ color: '#38bdf8' }}>
                {parentUsername ? `@${parentUsername}` : 'your workspace administrator'}
              </strong>
              .
            </div>
          </div>
        )}

        {/* Header */}
        <div className="portfolio-header">
          <div className="portfolio-header-left">
            <h1>Portfolio Analytics &amp; Performance</h1>
            <p>Real-time valuation, multi-asset allocation, and annualized yield across all your investments.</p>
          </div>

          <div className="portfolio-header-actions">
            {/* Cost-Basis Check Switcher */}
            <div className="cost-basis-switcher" title="Select stock cost-basis accounting method">
              <span className="cost-basis-label">Cost Basis:</span>
              <div className="method-toggle-group">
                {[
                  { key: 'average', label: 'Average' },
                  { key: 'fifo', label: 'FIFO' },
                  { key: 'lifo', label: 'LIFO' },
                ].map((opt) => {
                  const active = costBasisMethod === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`method-check-btn ${active ? 'active' : ''}`}
                      onClick={() => handleMethodChange(opt.key)}
                      title={`Calculate stock holdings using ${opt.label}`}
                    >
                      {active && <FaCheck className="method-check-icon" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rebalancing Navigation Button */}
            <Link
              to="/portfolio/rebalancing"
              className="rebalance-nav-btn"
              title="View Portfolio Rebalancing & Allocation Advisory"
            >
              <FaBalanceScale />
              <span>Rebalancing</span>
            </Link>

            {/* Refresh Prices */}
            <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
              <FaSyncAlt className={isRefreshing ? 'fa-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Prices'}</span>
            </button>
          </div>
        </div>

        {/* 1. Summary KPI Cards */}
        <SummaryCards summary={summary || {}} />

        {/* 2. Asset Allocation Breakdown */}
        <AllocationChart
          allocations={allocations}
          totalInvested={summary?.totalInvested || 0}
          totalCurrentValue={summary?.totalCurrentValue || 0}
        />

        {/* 3. Multi-Asset Holdings Table */}
        <HoldingsTable holdings={holdings} isLoading={isRefreshing} />
      </div>
    </div>
  );
};

export default PortfolioDashboard;
