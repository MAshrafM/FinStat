// frontend/src/components/creditCards/CreditCardSubNav.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCreditCard, FaCalendarAlt, FaChartLine, FaBalanceScale } from 'react-icons/fa';
import './CreditCardSubNav.css';

const TABS = [
  {
    path: '/credit-cards',
    labelFull: 'Cards & Transactions',
    labelShort: 'Cards',
    icon: FaCreditCard,
    isActive: (pathname) => pathname === '/credit-cards',
  },
  {
    path: '/credit-cards/statements',
    labelFull: 'Statement Cycles',
    labelShort: 'Cycles',
    icon: FaCalendarAlt,
    isActive: (pathname) => pathname.startsWith('/credit-cards/statements'),
  },
  {
    path: '/credit-cards/debt-payoff',
    labelFull: 'Debt Payoff Planner',
    labelShort: 'Payoff',
    icon: FaChartLine,
    isActive: (pathname) => pathname.startsWith('/credit-cards/debt-payoff'),
  },
  {
    path: '/credit-cards/reconcile',
    labelFull: 'Auto-Reconciliation',
    labelShort: 'Reconcile',
    icon: FaBalanceScale,
    isActive: (pathname) => pathname.startsWith('/credit-cards/reconcile'),
  },
];

const CreditCardSubNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="cc-subnav-container" aria-label="Credit Cards Navigation">
      <div className="cc-subnav-track">
        {TABS.map((tab) => {
          const active = tab.isActive(currentPath);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`cc-subnav-link ${active ? 'active' : ''}`}
              title={tab.labelFull}
            >
              <Icon className="cc-subnav-icon" />
              <span className="cc-subnav-label-full">{tab.labelFull}</span>
              <span className="cc-subnav-label-short">{tab.labelShort}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default CreditCardSubNav;
