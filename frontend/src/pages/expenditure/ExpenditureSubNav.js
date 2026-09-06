// frontend/src/pages/expenditure/ExpenditureSubNav.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaListAlt, FaSlidersH, FaChartPie, FaSyncAlt } from 'react-icons/fa';
import './ExpenditureSubNav.css';

const TABS = [
  {
    path: '/expenditures',
    labelFull: 'Expenditure Log',
    labelShort: 'Log',
    icon: FaListAlt,
    isActive: (pathname) =>
      pathname === '/expenditures' ||
      pathname.startsWith('/expenditures/new') ||
      pathname.startsWith('/expenditures/edit')
  },
  {
    path: '/expenditures/rules',
    labelFull: 'Auto-Categorization Rules',
    labelShort: 'Rules',
    icon: FaSlidersH,
    isActive: (pathname) => pathname.startsWith('/expenditures/rules')
  },
  {
    path: '/expenditures/budgets',
    labelFull: 'Budget Tracker',
    labelShort: 'Budgets',
    icon: FaChartPie,
    isActive: (pathname) => pathname.startsWith('/expenditures/budgets')
  },
  {
    path: '/expenditures/recurring',
    labelFull: 'Recurring Detection',
    labelShort: 'Recurring',
    icon: FaSyncAlt,
    isActive: (pathname) => pathname.startsWith('/expenditures/recurring')
  }
];

const ExpenditureSubNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="expenditure-subnav-container" aria-label="Expenditure Navigation">
      <div className="expenditure-subnav-track">
        {TABS.map((tab) => {
          const active = tab.isActive(currentPath);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`expenditure-subnav-link ${active ? 'active' : ''}`}
              title={tab.labelFull}
            >
              <Icon className="subnav-icon" />
              <span className="subnav-label-full">{tab.labelFull}</span>
              <span className="subnav-label-short">{tab.labelShort}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default ExpenditureSubNav;
