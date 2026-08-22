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
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
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

      <h1>Welcome to Your Dashboard</h1>
      <p>Select a feature to get started.</p>

      <div className="dashboard-summary" style={{ justifyContent: 'center' }}>
        <Link to="/summary" className="dashboard-card">
          <FaBalanceScale size={80} />
          <h2>Profile Summary</h2>
          <p>Comprehensive overview of your complete financial portfolio.</p>
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

        <Link to="/expenditures" className="dashboard-card">
          <FaMoneyBillWave size={45} />
          <h2>Expenditure Log</h2>
          <p>Track your bank and cash flow transactions.</p>
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
          <Link to="/admin" className="dashboard-card" style={{ borderTop: '3px solid #ef4444' }}>
            <FaUsers size={45} color="#ef4444" />
            <h2 style={{ color: '#ef4444' }}>User Management</h2>
            <p>Admin control panel to register users, manage roles, and monitor team access.</p>
          </Link>
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
