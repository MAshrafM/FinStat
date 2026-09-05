// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRegListAlt,
  FaUserTie,
  FaMoneyBillWave,
  FaChartLine,
  FaBuilding,
  FaGem,
  FaBalanceScale,
  FaScroll,
  FaDollarSign,
  FaCreditCard,
  FaShieldAlt,
  FaUsers,
  FaHome,
  FaChartBar,
  FaChartPie,
  FaRedo,
} from 'react-icons/fa';
import './Dashboard.css';
import { getBudgetProgress } from '../services/budgetService';
import { getRecurringSuggestions } from '../services/recurringSuggestionService';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const [userRole, setUserRole] = useState('viewer');
  const [parentUsername, setParentUsername] = useState(null);
  const [budgetProgressList, setBudgetProgressList] = useState([]);
  const [pendingRecurCount, setPendingRecurCount] = useState(0);

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

    // Load top budgets and recurring pending count
    getBudgetProgress({ period: 'monthly' })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setBudgetProgressList(list.slice(0, 4));
      })
      .catch(() => setBudgetProgressList([]));

    getRecurringSuggestions(1, 10, { isAccepted: false, isRejected: false })
      .then((res) => {
        setPendingRecurCount(res?.total || 0);
      })
      .catch(() => setPendingRecurCount(0));
  }, []);

  return (
    <div className="page-container">
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
            <strong>View-Only Mode:</strong> You are currently viewing financial data belonging to{' '}
            <strong style={{ color: '#38bdf8' }}>
              {parentUsername ? `@${parentUsername}` : 'your workspace administrator'}
            </strong>
            . Records are read-only.
          </div>
        </div>
      )}

      {pendingRecurCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '1px solid #93c5fd',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#1e40af',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaRedo size={22} color="#2563eb" />
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

      {/* Budget Progress Preview Widget */}
      {budgetProgressList.length > 0 && (
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartPie style={{ color: '#3b82f6' }} /> Monthly Budget Progress
            </h3>
            <Link
              to="/expenditures/budgets"
              style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
            >
              View All Budgets &rarr;
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {budgetProgressList.map((bp) => {
              const barColor =
                bp.alertStatus === 'red' ? '#ef4444' : bp.alertStatus === 'yellow' ? '#f59e0b' : '#10b981';
              return (
                <div
                  key={bp.budgetId}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{bp.category}</strong>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: barColor }}>
                      {bp.percentageUsed}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: '#e2e8f0',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, bp.percentageUsed)}%`,
                        background: barColor,
                        borderRadius: '9999px',
                      }}
                    ></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Spent: {formatCurrency(bp.spentAmount)}</span>
                    <span>Limit: {formatCurrency(bp.budgetedAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-summary" style={{ justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <Link to="/portfolio" className="dashboard-card" style={{ flex: '1', minWidth: '280px', maxWidth: '420px', borderTop: '4px solid #38bdf8' }}>
          <FaChartLine size={70} color="#38bdf8" />
          <h2 style={{ color: '#38bdf8' }}>Portfolio Analytics</h2>
          <p>Unified performance tracking, asset allocation, and XIRR return metrics.</p>
        </Link>

        <Link to="/summary" className="dashboard-card" style={{ flex: '1', minWidth: '280px', maxWidth: '420px', borderTop: '4px solid #a855f7' }}>
          <FaBalanceScale size={70} color="#a855f7" />
          <h2 style={{ color: '#a855f7' }}>Profile Summary</h2>
          <p>Comprehensive overview of your complete financial portfolio and holdings.</p>
        </Link>
      </div>

      <div className="dashboard-grid">
        <Link to="/salary-profile" className="dashboard-card">
          <FaUserTie size={45} />
          <h2>Salary Profile</h2>
          <p>Model and track historical salary information and projections.</p>
        </Link>

        <Link to="/paycheck-log" className="dashboard-card">
          <FaRegListAlt size={45} />
          <h2>Paycheck Log</h2>
          <p>View, add, edit, and delete individual paycheck entries.</p>
        </Link>

        <Link to="/expenditures" className="dashboard-card" style={{ borderTop: '4px solid #10b981' }}>
          <FaMoneyBillWave size={45} color="#10b981" />
          <h2 style={{ color: '#10b981' }}>Expenditure Log</h2>
          <p>Track cash flow, balances, splits, and categories.</p>
        </Link>

        <Link to="/trades" className="dashboard-card">
          <FaChartLine size={45} />
          <h2>Stock Trading</h2>
          <p>Log and track all your stock market trades.</p>
        </Link>

        <Link to="/mutual-funds" className="dashboard-card">
          <FaBuilding size={45} />
          <h2>Mutual Funds</h2>
          <p>Log and track your mutual fund investments.</p>
        </Link>

        <Link to="/gold-wallet" className="dashboard-card">
          <FaGem size={45} />
          <h2>Gold Logs</h2>
          <p>Log and track your gold purchases and sales.</p>
        </Link>

        <Link to="/certificates" className="dashboard-card">
          <FaScroll size={45} />
          <h2>Bank Certificates</h2>
          <p>Track your fixed-income certificates of deposit.</p>
        </Link>

        <Link to="/currency" className="dashboard-card">
          <FaDollarSign size={45} />
          <h2>Foreign Currency</h2>
          <p>Track your Foreign Currency Wallet.</p>
        </Link>

        <Link to="/real-estate" className="dashboard-card" style={{ borderTop: '4px solid #ec4899' }}>
          <FaHome size={45} color="#ec4899" />
          <h2 style={{ color: '#ec4899' }}>Real Estate</h2>
          <p>Track property investments, purchases, and estimated market valuations.</p>
        </Link>

        <Link to="/credit-cards" className="dashboard-card">
          <FaCreditCard size={45} />
          <h2>Credit Cards</h2>
          <p>Manage credit card transactions and payments.</p>
        </Link>

        <Link to="/security" className="dashboard-card" style={{ borderTop: '3px solid #a855f7' }}>
          <FaShieldAlt size={45} color="#a855f7" />
          <h2 style={{ color: '#a855f7' }}>Security &amp; 2FA</h2>
          <p>Manage Two-Factor Authentication, backup codes &amp; login audit history.</p>
        </Link>

        {userRole === 'admin' && (
          <>
            <Link to="/admin" className="dashboard-card" style={{ borderTop: '3px solid #ef4444' }}>
              <FaUsers size={45} color="#ef4444" />
              <h2 style={{ color: '#ef4444' }}>User Management</h2>
              <p>Admin control panel to register users, manage roles, and monitor team access.</p>
            </Link>

            <Link to="/admin/tax-brackets" className="dashboard-card" style={{ borderTop: '3px solid #3b82f6' }}>
              <FaChartBar size={45} color="#3b82f6" />
              <h2 style={{ color: '#3b82f6' }}>Tax Brackets</h2>
              <p>Configure progressive income tax bracket levels, exemptions, and legal rates.</p>
            </Link>

            <Link to="/admin/social-insurance" className="dashboard-card" style={{ borderTop: '3px solid #10b981' }}>
              <FaShieldAlt size={45} color="#10b981" />
              <h2 style={{ color: '#10b981' }}>Social Insurance</h2>
              <p>Manage employee/employer contribution shares, wage floors, and legal caps.</p>
            </Link>
          </>
        )}

        {userRole === 'manager' && (
          <Link to="/admin" className="dashboard-card" style={{ borderTop: '3px solid #38bdf8' }}>
            <FaUsers size={45} color="#38bdf8" />
            <h2 style={{ color: '#38bdf8' }}>Manage Viewers</h2>
            <p>Control panel to register and manage viewers attached to your workspace.</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
