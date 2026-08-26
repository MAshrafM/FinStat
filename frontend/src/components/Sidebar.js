// frontend/src/components/Sidebar.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logoutUser } from '../services/authService';
import './Sidebar.css';

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCurrentlyExpanded = isMobile ? mobileOpen : isExpanded;
  const navigate = useNavigate();

  // Read user role from localStorage
  const [userRole, setUserRole] = useState('viewer');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed.role) setUserRole(parsed.role);
      } catch (e) {
        // Fallback
      }
    }

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
    await logoutUser();
    navigate('/');
  };

  const baseMenuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      title: 'Dashboard',
      description: 'Main overview',
    },
    {
      path: '/portfolio',
      icon: '📈',
      title: 'Portfolio',
      description: 'Unified investments & performance',
    },
    {
      path: '/salary-profile',
      icon: '👔',
      title: 'Salary Profile',
      description: 'Track salary information',
    },
    {
      path: '/paycheck-log',
      icon: '📋',
      title: 'Paycheck Log',
      description: 'Manage paycheck entries',
    },
    {
      path: '/expenditures',
      icon: '💰',
      title: 'Expenditure Log',
      description: 'Track transactions',
    },
    {
      path: '/analysis/calendar',
      icon: '📅',
      title: 'Calendar Analysis',
      description: 'Jan-Dec income analysis',
    },
    {
      path: '/analysis/fiscal',
      icon: '📈',
      title: 'Fiscal Analysis',
      description: 'July-June fiscal cycle',
    },
    {
      path: '/expenditure-analysis',
      icon: '🥧',
      title: 'Expenditure Analysis',
      description: 'Spending visualizations',
    },
    {
      path: '/social-insurance',
      icon: '🛡️',
      title: 'Social Insurance',
      description: 'Insurance tracking',
    },
    {
      path: '/taxes',
      icon: '🧾',
      title: 'Taxes',
      description: 'Tax management',
    },
    {
      path: '/trades',
      icon: '📊',
      title: 'Stock Trading',
      description: 'Trade logging',
    },
    {
      path: '/trade-summary',
      icon: '📖',
      title: 'Trade Summary',
      description: 'Trading results',
    },
    {
      path: '/mutual-funds',
      icon: '🏢',
      title: 'Mutual Funds',
      description: 'Fund investments',
    },
    {
      path: '/mutual-funds/summary',
      icon: '📚',
      title: 'Fund Summary',
      description: 'Investment results',
    },
    {
      path: '/gold-wallet',
      icon: '🏅',
      title: 'Gold Logs',
      description: 'Track gold investments',
    },
    {
      path: '/gold-wallet/summary',
      icon: '📘',
      title: 'Gold Summary',
      description: 'Gold investment results',
    },
    {
      path: '/certificates',
      icon: '🏛️',
      title: 'Bank Certificates',
      description: 'Fixed investment',
    },
    {
      path: '/currency',
      icon: '💱',
      title: 'Foreign Currency',
      description: 'Currency Wallet',
    },
    {
      path: '/real-estate',
      icon: '🏘️',
      title: 'Real Estate',
      description: 'Property portfolio',
    },
    {
      path: '/credit-cards',
      icon: '💳',
      title: 'Credit Cards',
      description: 'Manage credit cards',
    },
    {
      path: '/security',
      icon: '🔒',
      title: 'Security & 2FA',
      description: '2FA & audit logs',
    },
  ];

  // If user is admin or manager, append management link
  const menuItems = [
    ...baseMenuItems,
    ...(userRole === 'admin'
      ? [
          {
            path: '/admin',
            icon: '👥',
            title: 'Admin Panel',
            description: 'User management',
          },
        ]
      : userRole === 'manager'
      ? [
          {
            path: '/admin',
            icon: '👥',
            title: 'Manage Viewers',
            description: 'Viewer management',
          },
        ]
      : []),
  ];

  return (
    <>
      <style>
        {`
          .logo-text {
            font-size: 18px;
            font-weight: 700;
            color: #6c7ce7;
            white-space: nowrap;
            opacity: ${isExpanded || mobileOpen ? '1' : '0'};
            transition: opacity 0.3s ease;
          }
          .sidebar-content {
            display: flex;
            flex-direction: column;
            opacity: ${isExpanded || mobileOpen ? '1' : '0'};
            transition: opacity 0.3s ease;
            min-width: 0;
          }
          .sidebar-logout-btn {
            display: flex;
            align-items: center;
            width: calc(100% - 16px);
            margin: 12px 8px 16px 8px;
            padding: 10px 12px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: 10px;
            color: #f87171;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .sidebar-logout-btn:hover {
            background: rgba(239, 68, 68, 0.22);
            color: #ef4444;
          }
        `}
      </style>
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
            {!((isMobile && mobileOpen) || (!isMobile && isExpanded)) && (
              <span className="menu-icon">☰</span>
            )}
            {((isMobile && mobileOpen) || (!isMobile && isExpanded)) && (
              <span className="logo-text">FinanceHub</span>
            )}
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="sidebar-item"
              title={!((isMobile && mobileOpen) || (!isMobile && isExpanded)) ? item.title : ''}
            >
              <div className="sidebar-icon">
                <span className="icon-emoji">{item.icon}</span>
              </div>
              {((isMobile && mobileOpen) || (!isMobile && isExpanded)) && (
                <div className="sidebar-content">
                  <span className="sidebar-title">{item.title}</span>
                  <span className="sidebar-description">{item.description}</span>
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Dedicated Logout Button */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
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