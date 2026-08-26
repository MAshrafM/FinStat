// frontend/src/pages/portfolio/PortfolioDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  getPortfolioSummary,
  getPortfolioHoldings,
  getPortfolioAllocation,
} from '../../services/portfolioService';
import SummaryCards from '../../components/portfolio/SummaryCards';
import AllocationChart from '../../components/portfolio/AllocationChart';
import HoldingsTable from '../../components/portfolio/HoldingsTable';
import { FaSyncAlt } from 'react-icons/fa';
import './Portfolio.css';

const PortfolioDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Role info for View-Only mode banner
  const [userRole, setUserRole] = useState('viewer');
  const [parentUsername, setParentUsername] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed.role) setUserRole(parsed.role);
        if (parsed.parentUsername) setParentUsername(parsed.parentUsername);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const [summaryData, holdingsData, allocationData] = await Promise.all([
        getPortfolioSummary(isRefresh),
        getPortfolioHoldings({ refresh: isRefresh }),
        getPortfolioAllocation(isRefresh),
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
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
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
            <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
              <FaSyncAlt className={isRefreshing ? 'fa-spin' : ''} />
              {isRefreshing ? 'Refreshing Prices...' : 'Refresh Prices'}
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
