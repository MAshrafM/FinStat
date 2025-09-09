// frontend/src/components/ProtectedRoute.js
import React, {useState, useMemo} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
// Lazy import contexts to reduce initial bundle size
const DataProvider = React.lazy(() => import('../context/DataContext').then(m => ({ default: m.DataProvider })));
const GoldProvider = React.lazy(() => import('../context/GoldContext').then(m => ({ default: m.GoldProvider })));
const MFProvider = React.lazy(() => import('../context/MFContext').then(m => ({ default: m.MFProvider })));
const CertProvider = React.lazy(() => import('../context/CertContext').then(m => ({ default: m.CertProvider })));
const CurrProvider = React.lazy(() => import('../context/CurrContext').then(m => ({ default: m.CurrProvider })));
const BankProvider = React.lazy(() => import('../context/BankContext').then(m => ({ default: m.BankProvider })));
const CreditProvider = React.lazy(() => import('../context/CreditContext').then(m => ({ default: m.CreditProvider })));
// Route configuration for better maintainability
const ROUTE_CONFIG = {
  basicRoutes: ['/dashboard', '/salary-profile', '/paycheck-log', '/expenditures', '/trades', '/social-insurance'],
  contextRoutes: {
    data: ['/trades/new', '/trades/edit', '/trade-summary'],
    gold: ['/gold-wallet/summary'],
    mf: ['/mutual-funds/summary'],
    cert: ['/certificates'],
    curr: ['/currency'],
    bank: ['/bank-accounts'],
    credit: ['/credit-cards']
  },
  fullDataRoutes: ['/summary'] // Routes that need all data
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
    const token = localStorage.getItem('token');
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const handleSidebarToggle = () => setSidebarOpen(prev => !prev);

    // Memoize required providers to avoid recalculation on every render
    const requiredProviders = useMemo(() => 
        getRequiredProviders(location.pathname), 
        [location.pathname]
    );

    const needsDataLoader = requiredProviders.length > 0;

    if (!token) {
        return <Navigate to="/" replace />;
    }

   return (
    <div className="App">
      <Navbar onSidebarToggle={handleSidebarToggle} />
      <Sidebar />
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <React.Suspense fallback={<div>Loading...</div>}>
          {requiredProviders.length > 0 ? (
            <ProviderWrapper providers={requiredProviders}>
              {needsDataLoader ? (
                  <Outlet />
              ) : (
                <Outlet />
              )}
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