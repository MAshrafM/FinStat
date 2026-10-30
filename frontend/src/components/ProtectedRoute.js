// frontend/src/components/ProtectedRoute.js
import React, { useState, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import ViewOnlyBanner from './common/ViewOnlyBanner';
import { DataProvider } from '../context/DataContext';
import { GoldProvider } from '../context/GoldContext';
import { MFProvider } from '../context/MFContext';
import { CertProvider } from '../context/CertContext';
import { CurrProvider } from '../context/CurrContext';
import { BankProvider } from '../context/BankContext';
import { CreditProvider } from '../context/CreditContext';
// Route configuration for better maintainability
const ROUTE_CONFIG = {
  basicRoutes: ['/portfolio', '/salary-profile', '/paycheck-log', '/expenditures', '/trades', '/real-estate', '/real-estate/new', '/real-estate/edit', '/analysis/payroll', '/salary/rules'],
  contextRoutes: {
    data: ['/trades/new', '/trades/add', '/trades/edit', '/trade-summary', '/corporate-actions'],
    gold: ['/gold-wallet/summary'],
    mf: ['/mutual-funds/summary'],
    cert: ['/certificates'],
    curr: ['/currency'],
    bank: ['/bank-accounts'],
    credit: ['/credit-cards']
  },
  fullDataRoutes: ['/dashboard', '/summary'] // Routes that need all data
};

// Helper function to determine required providers
const getRequiredProviders = (pathname) => {
  const { basicRoutes, contextRoutes, fullDataRoutes } = ROUTE_CONFIG;
  
  // Check if route needs no providers
  if (basicRoutes.includes(pathname)) {
    return [];
  }
  
  // Check if route needs all providers
  if (fullDataRoutes.some(route => pathname.startsWith(route))) {
    return ['data', 'gold', 'mf', 'cert', 'curr', 'bank', 'credit'];
  }
  
  // Check specific context needs
  const requiredProviders = [];
  Object.entries(contextRoutes).forEach(([key, routes]) => {
    if (routes.some(route => pathname.startsWith(route))) {
      requiredProviders.push(key);
    }
  });
  
  return requiredProviders;
};

// Provider wrapper component
const ProviderWrapper = ({ providers, children }) => {
  const providerMap = {
    data: DataProvider,
    gold: GoldProvider,
    mf: MFProvider,
    cert: CertProvider,
    curr: CurrProvider,
    bank: BankProvider,
    credit: CreditProvider
  };

  // Recursively wrap children with required providers
  return providers.reduce((acc, providerKey) => {
    const Provider = providerMap[providerKey];
    return Provider ? <Provider>{acc}</Provider> : acc;
  }, children);
};

const ProtectedRoute = () => {
  const { token, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleSidebarToggle = () => setSidebarOpen(prev => !prev);

  // Memoize required providers to avoid recalculation on every render
  const requiredProviders = useMemo(() => 
    getRequiredProviders(location.pathname), 
    [location.pathname]
  );

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Tax Brackets and Social Insurance configs are strictly Admin-only
  const isAdminOnlyRoute =
    location.pathname.startsWith('/admin/tax-brackets') ||
    location.pathname.startsWith('/admin/social-insurance');
  if (isAdminOnlyRoute && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname.startsWith('/admin') && !isAdmin && !isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  const isFullBleedPage =
    location.pathname.startsWith('/portfolio') ||
    location.pathname.startsWith('/real-estate');

  return (
    <div className="App">
      <Navbar onSidebarToggle={handleSidebarToggle} />
      <Sidebar />
      <main
        className={`main-content ${sidebarOpen ? 'sidebar-open' : ''} ${
          isFullBleedPage ? 'full-bleed' : ''
        }`}
      >
        <ViewOnlyBanner />
        <React.Suspense fallback={<div>Loading...</div>}>
          {requiredProviders.length > 0 ? (
            <ProviderWrapper providers={requiredProviders}>
              <Outlet />
            </ProviderWrapper>
          ) : (
            <Outlet />
          )}
        </React.Suspense>
      </main>
    </div>
  );
};

export default ProtectedRoute;