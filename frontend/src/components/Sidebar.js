// frontend/src/components/Sidebar.js
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccountSwitcher from './layout/AccountSwitcher';
import './Sidebar.css';

const HUB_DEFINITIONS = [
  {
    id: 'overview',
    title: 'Overview',
    icon: '📊',
    items: [
      { path: '/dashboard', icon: '📊', title: 'Dashboard', description: 'Main overview' },
      { path: '/portfolio', icon: '📈', title: 'Portfolio', description: 'Unified investments & performance' },
      { path: '/portfolio/rebalancing', icon: '⚖️', title: 'Rebalancing', description: 'Target weights & suggestions' },
    ],
  },
  {
    id: 'income',
    title: 'Income & Payroll',
    icon: '👔',
    items: [
      { path: '/salary/profiles', icon: '👔', title: 'Salary Profile', description: 'Track salary information' },
      { path: '/salary/paychecks', icon: '📋', title: 'Paycheck Log', description: 'Manage paycheck entries' },
      { path: '/salary/paychecks/new', icon: '🧮', title: 'Paycheck Calculator', description: 'Smart preview & breakdown' },
      { path: '/analysis/payroll', icon: '📅', title: 'Payroll Analytics', description: 'Calendar & fiscal year cycles' },
      { path: '/salary/rules', icon: '🧾', title: 'Payroll Rules Hub', description: 'Tax brackets & social insurance' },
    ],
  },
  {
    id: 'spending',
    title: 'Daily Spending',
    icon: '💰',
    items: [
      { path: '/expenditures', icon: '💰', title: 'Expenditure Log', description: 'Track transactions' },
      { path: '/expenditures/budgets', icon: '🎯', title: 'Budget Tracker', description: 'Budget vs. actual tracking' },
      { path: '/expenditures/rules', icon: '🏷️', title: 'Auto-Categorization', description: 'Smart rule engine' },
      { path: '/expenditures/recurring', icon: '🔁', title: 'Recurring Expenses', description: 'Subscription scanner' },
      { path: '/expenditure-analysis', icon: '🥧', title: 'Spending Analysis', description: 'Spending visualizations' },
      { path: '/credit-cards', icon: '💳', title: 'Credit Cards & Debt', description: 'Cycles, payoff & alerts' },
      { path: '/lending', icon: '🤝', title: 'Lending Tracker', description: 'Personal loans & receivables' },
    ],
  },
  {
    id: 'wealth',
    title: 'Investments & Wealth',
    icon: '📈',
    items: [
      { path: '/trades', icon: '📊', title: 'Stock Trading', description: 'Trade logging' },
      { path: '/corporate-actions', icon: '🪄', title: 'Corporate Actions', description: 'Splits & bonus issues' },
      { path: '/trade-summary', icon: '📖', title: 'Trade Summary', description: 'Trading results' },
      { path: '/mutual-funds', icon: '🏢', title: 'Mutual Funds', description: 'Fund investments' },
      { path: '/mutual-funds/summary', icon: '📚', title: 'Fund Summary', description: 'Investment results' },
      { path: '/gold-wallet', icon: '🏅', title: 'Gold Logs', description: 'Track gold investments' },
      { path: '/gold-wallet/summary', icon: '📘', title: 'Gold Summary', description: 'Gold investment results' },
      { path: '/certificates', icon: '🏛️', title: 'Bank Certificates', description: 'Fixed income' },
      { path: '/currency', icon: '💱', title: 'Foreign Currency', description: 'Currency wallet' },
      { path: '/real-estate', icon: '🏘️', title: 'Real Estate', description: 'Property portfolio' },
      { path: '/reports/financial', icon: '📑', title: 'Financial Report', description: 'Comprehensive report & print PDF' },
    ],
  },
  {
    id: 'system',
    title: 'System & Settings',
    icon: '⚙️',
    items: [
      { path: '/profile', icon: '👤', title: 'User Profile', description: 'Personal & account profile' },
      { path: '/settings', icon: '⚙️', title: 'Settings', description: 'Preferences & cost basis' },
      { path: '/security', icon: '🔒', title: 'Security & 2FA', description: '2FA & audit logs' },
    ],
  },
];

const findHubForPath = (pathname, hubs) => {
  for (const hub of hubs) {
    if (hub.items.some(item => pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path)))) {
      return hub.id;
    }
  }
  // Check common legacy alias mappings
  if (pathname.startsWith('/salary-profile')) return 'income';
  if (pathname.startsWith('/paycheck-log')) return 'income';
  if (pathname.startsWith('/taxes') || pathname.startsWith('/social-insurance')) return 'income';
  if (pathname.startsWith('/analysis')) return 'income';
  if (pathname.startsWith('/admin')) return 'system';
  return 'overview';
};

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCurrentlyExpanded = isMobile ? mobileOpen : isExpanded;
  const navigate = useNavigate();
  const location = useLocation();

  const { role: userRole, logout } = useAuth();

  // Construct active hubs based on role
  const hubs = useMemo(() => {
    return HUB_DEFINITIONS.map(hub => {
      if (hub.id !== 'system') return hub;

      const dynamicItems = [...hub.items];

      if (userRole === 'admin') {
        dynamicItems.push(
          { path: '/admin', icon: '👥', title: 'Admin Users', description: 'User management' },
          { path: '/admin/tax-brackets', icon: '📊', title: 'Tax Brackets', description: 'Admin tax configuration' },
          { path: '/admin/social-insurance', icon: '🛡️', title: 'Social Insurance', description: 'Admin insurance rules' },
          { path: '/admin/backup', icon: '💾', title: 'Database Backup', description: 'Export & dev import' }
        );
      } else if (userRole === 'manager') {
        dynamicItems.push(
          { path: '/admin', icon: '👥', title: 'Manage Viewers', description: 'Viewer management' }
        );
      }

      return { ...hub, items: dynamicItems };
    });
  }, [userRole]);

  // Initial state: only active route's hub expanded (Option A)
  const [openHubs, setOpenHubs] = useState(() => {
    const activeHub = findHubForPath(location.pathname, HUB_DEFINITIONS);
    return { [activeHub]: true };
  });

  const prevPathRef = useRef(location.pathname);

  // Auto-expand destination hub on cross-hub navigation without collapsing others (Option A)
  useEffect(() => {
    const prevHub = findHubForPath(prevPathRef.current, hubs);
    const currentHub = findHubForPath(location.pathname, hubs);

    if (currentHub && currentHub !== prevHub) {
      setOpenHubs(prev => ({ ...prev, [currentHub]: true }));
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, hubs]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsExpanded(false);
    }
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleHub = (hubId) => {
    setOpenHubs(prev => ({
      ...prev,
      [hubId]: !prev[hubId],
    }));
  };

  return (
    <>
      <button className="mobile-toggle" onClick={() => handleSidebarToggle()}>
        ☰
      </button>
      <div
        className={`sidebar ${isCurrentlyExpanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-header">
          <div className="logo">
            {!isCurrentlyExpanded && (
              <span className="menu-icon">☰</span>
            )}
            {isCurrentlyExpanded && (
              <span className="logo-text">FinanceHub</span>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {hubs.map((hub) => {
            const isOpen = !!openHubs[hub.id];
            return (
              <div key={hub.id} className="sidebar-hub-group">
                {/* Hub Header */}
                <div
                  className="sidebar-hub-header"
                  onClick={() => toggleHub(hub.id)}
                  title={hub.title}
                >
                  <div className="sidebar-hub-header-left">
                    <span style={{ fontSize: '14px' }}>{hub.icon}</span>
                    <span className="sidebar-hub-title">{hub.title}</span>
                  </div>
                  <span className="sidebar-hub-chevron">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>

                {/* Hub Child Items */}
                {isOpen && (
                  <div className="sidebar-hub-items">
                    {hub.items.map((item, index) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={index}
                          to={item.path}
                          className={`sidebar-item ${isActive ? 'active' : ''}`}
                          title={item.title}
                        >
                          <div className="sidebar-icon">
                            <span className="icon-emoji">{item.icon}</span>
                          </div>
                          <div className="sidebar-content">
                            <span className="sidebar-title">{item.title}</span>
                            <span className="sidebar-description">{item.description}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Account Switcher & Dedicated Logout Button */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <AccountSwitcher isExpanded={isCurrentlyExpanded} />
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Sign Out"
          >
            <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: isCurrentlyExpanded ? '12px' : '0' }}>
              <LogOut size={18} />
            </div>
            {isCurrentlyExpanded && (
              <div className="sidebar-content">
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Sign Out</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;
