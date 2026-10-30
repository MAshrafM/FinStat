// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaRedo, FaMoneyBillWave, FaChartLine, FaGem, FaHome, FaRegListAlt } from 'react-icons/fa';
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

      {/* Top Quick Actions Bar */}
      <div
        className="quick-actions-bar"
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '16px 24px 0 24px',
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginRight: '6px' }}>
          Quick Actions:
        </span>
        <Link
          to="/salary/paychecks/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#2563eb',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <FaRegListAlt size={13} /> + Log Paycheck
        </Link>
        <Link
          to="/expenditures/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <FaMoneyBillWave size={13} /> + Add Expense
        </Link>
        <Link
          to="/trades/add"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(14, 165, 233, 0.1)',
            color: '#0284c7',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <FaChartLine size={13} /> + New Trade
        </Link>
        <Link
          to="/gold-wallet/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(234, 179, 8, 0.1)',
            color: '#ca8a04',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <FaGem size={13} /> + Add Gold
        </Link>
        <Link
          to="/real-estate/new"
          className="btn-quick-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(236, 72, 153, 0.1)',
            color: '#db2777',
            border: '1px solid rgba(236, 72, 153, 0.25)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <FaHome size={13} /> + New Property
        </Link>
      </div>

      <DashboardSummary />
    </div>
  );
};

export default Dashboard;
