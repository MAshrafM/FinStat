// frontend/src/pages/Dashboard.js
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRedo, FaPlus, FaArrowRight, FaCalendarCheck } from 'react-icons/fa';
import DashboardSummary from './DashboardSummary';
import AppLauncher from '../components/dashboard/AppLauncher';
import { getRecurringSuggestions } from '../services/recurringSuggestionService';
import { getUpcomingBills } from '../services/recurringBillService';
import { useCanModify } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { canModify } = useCanModify();
  const [pendingRecurCount, setPendingRecurCount] = useState(0);
  const [upcomingBillsCount, setUpcomingBillsCount] = useState(0);
  const [upcomingBillsTotal, setUpcomingBillsTotal] = useState(0);
  const [launcher, setLauncher] = useState({ open: false, tab: 'create' });

  useEffect(() => {
    getRecurringSuggestions(1, 10, { isAccepted: false, isRejected: false })
      .then((res) => {
        setPendingRecurCount(res?.total || 0);
      })
      .catch(() => setPendingRecurCount(0));

    getUpcomingBills({ days: 3 })
      .then((res) => {
        setUpcomingBillsCount(res?.upcomingCount || 0);
        setUpcomingBillsTotal(res?.totalDue || 0);
      })
      .catch(() => {
        setUpcomingBillsCount(0);
        setUpcomingBillsTotal(0);
      });
  }, []);

  const openLauncher = useCallback((tab = 'create') => {
    setLauncher({ open: true, tab });
  }, []);

  const closeLauncher = useCallback(() => {
    setLauncher((prev) => ({ ...prev, open: false }));
  }, []);

  // Command-palette style shortcut: Ctrl/Cmd + K.
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openLauncher(canModify ? 'create' : 'explore');
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [canModify, openLauncher]);

  return (
    <div className="dashboard-shell" data-testid="dashboard-page">
      <div className="dashboard-container">
        {pendingRecurCount > 0 && (
          <div className="dash-alert" role="status">
            <div className="dash-alert-main">
              <span className="dash-alert-icon">
                <FaRedo aria-hidden="true" />
              </span>
              <div>
                <strong>{pendingRecurCount} recurring pattern{pendingRecurCount === 1 ? '' : 's'} detected</strong>
                <p>Review the suggestions and confirm your subscriptions to keep budgets accurate.</p>
              </div>
            </div>
            <Link to="/expenditures/recurring" className="dash-alert-action">
              Review now <FaArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}

        {upcomingBillsCount > 0 && (
          <div className="dash-alert dash-alert-bills" role="status" data-testid="upcoming-bills-banner">
            <div className="dash-alert-main">
              <span className="dash-alert-icon">
                <FaCalendarCheck aria-hidden="true" />
              </span>
              <div>
                <strong>
                  {upcomingBillsCount} upcoming bill{upcomingBillsCount === 1 ? '' : 's'} due soon ({upcomingBillsTotal.toLocaleString()} EGP)
                </strong>
                <p>Review bills due in the next 3 days and record payments.</p>
              </div>
            </div>
            <Link to="/expenditures/bills" className="dash-alert-action">
              Pay bills <FaArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}

        <DashboardSummary onOpenLauncher={openLauncher} />
      </div>

      {canModify && (
        <button
          type="button"
          className="dash-fab"
          onClick={() => openLauncher('create')}
          title="Open the add menu (Ctrl + K)"
        >
          <FaPlus aria-hidden="true" />
          <span>New</span>
        </button>
      )}

      <AppLauncher open={launcher.open} initialTab={launcher.tab} onClose={closeLauncher} />
    </div>
  );
};

export default Dashboard;
