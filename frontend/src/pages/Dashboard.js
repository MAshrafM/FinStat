// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaRedo, FaMoneyBillWave, FaChartLine, FaChartPie, FaGem, FaHome, FaRegListAlt } from 'react-icons/fa';
import DashboardSummary from './DashboardSummary';
import { getRecurringSuggestions } from '../services/recurringSuggestionService';
import './Dashboard.css';

const Dashboard = () => {
  const [pendingRecurCount, setPendingRecurCount] = useState(0);

  useEffect(() => {
    getRecurringSuggestions(1, 10, { isAccepted: false, isRejected: false })
      .then((res) => {
        setPendingRecurCount(res?.total || 0);
      })
      .catch(() => setPendingRecurCount(0));
  }, []);

  return (
    <div className="dashboard-root" data-testid="dashboard-page">
      {pendingRecurCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '1px solid #93c5fd',
            borderRadius: '12px',
            padding: '14px 20px',
            margin: '16px 24px 0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#1e40af',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaRedo size={20} color="#2563eb" />
            <div>
              <strong>Recurring Expenses Detected:</strong> You have{' '}
              <strong style={{ color: '#1d4ed8' }}>{pendingRecurCount} recurring pattern suggestion(s)</strong>{' '}
              ready for confirmation.
            </div>
          </div>
          <Link
            to="/expenditures/recurring"
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.85rem',
            }}
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Centered, Enhanced Quick Actions Bar */}
      <div
        className="quick-actions-bar"
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '24px 24px 8px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Link
          to="/salary/paychecks/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#2563eb',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <FaRegListAlt size={16} /> + Log Paycheck
        </Link>
        <Link
          to="/expenditures/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <FaMoneyBillWave size={16} /> + Add Expense
        </Link>
        <Link
          to="/trades/add"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(14, 165, 233, 0.12)',
            color: '#0284c7',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(14, 165, 233, 0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <FaChartLine size={16} /> + New Trade
        </Link>
        <Link
          to="/mutual-funds/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#7c3aed',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(139, 92, 246, 0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <FaChartPie size={16} /> + Mutual Fund
        </Link>
        <Link
          to="/gold-wallet/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(234, 179, 8, 0.12)',
            color: '#ca8a04',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(234, 179, 8, 0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <FaGem size={16} /> + Add Gold
        </Link>
        <Link
          to="/real-estate/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(236, 72, 153, 0.12)',
            color: '#db2777',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(236, 72, 153, 0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          <FaHome size={16} /> + New Property
        </Link>
      </div>

      <DashboardSummary />
    </div>
  );
};

export default Dashboard;
