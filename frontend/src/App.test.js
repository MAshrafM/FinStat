// frontend/src/App.test.js
jest.mock('react-router-dom', () => {
  return require('../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock lazy-loaded page components to isolate App router and route guard behavior
jest.mock('./pages/LandingPage', () => () => <div data-testid="landing-page">Landing Page</div>);
jest.mock('./pages/Dashboard', () => () => <div data-testid="dashboard-page">Dashboard Page</div>);
jest.mock('./pages/admin/TaxConfigPage', () => () => <div data-testid="tax-config-page">Tax Brackets Admin Config</div>);
jest.mock('./pages/admin/AdminDashboard', () => () => <div data-testid="admin-dashboard-page">Admin Dashboard</div>);
jest.mock('./pages/salary/SalaryProfilePage', () => () => <div data-testid="salary-profiles-page">Salary Profiles Page</div>);
jest.mock('./pages/paycheck/PaycheckLog', () => () => <div data-testid="paycheck-log-page">Paycheck Log Page</div>);
jest.mock('./pages/trades/AddTradePage', () => () => <div data-testid="add-trade-page">Add Trade Page</div>);
jest.mock('./pages/analysis/PayrollAnalyticsPage', () => () => <div data-testid="payroll-analytics-page">Payroll Analytics Page</div>);
jest.mock('./pages/salary/PayrollRulesHub', () => () => <div data-testid="payroll-rules-hub">Payroll Rules Hub</div>);

describe('Step 5B.2: [AUD-TEST-002] Frontend App Route Guards & Role Access Controls', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const seedAuth = (role = 'manager', username = 'testuser') => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'user_123',
        username,
        role,
      })
    );
  };

  it('1. redirects unauthenticated user from protected route (/dashboard) to landing page (/)', async () => {
    window.history.pushState({}, '', '/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  it('2. redirects unauthenticated user from admin route (/admin/tax-brackets) to landing page (/)', async () => {
    window.history.pushState({}, '', '/admin/tax-brackets');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('tax-config-page')).not.toBeInTheDocument();
  });

  it('3. renders authenticated shell and dashboard for manager without ViewOnlyBanner', async () => {
    seedAuth('manager');
    window.history.pushState({}, '', '/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    // ViewOnlyBanner should not be rendered for manager
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/read-only mode/i)).not.toBeInTheDocument();
  });

  it('4. displays ViewOnlyBanner for viewer role upon entering authenticated route', async () => {
    seedAuth('viewer');
    window.history.pushState({}, '', '/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/You are viewing in read-only mode/i);
  });

  it('5. redirects manager attempting to access admin-only route (/admin/tax-brackets) back to /dashboard', async () => {
    seedAuth('manager');
    window.history.pushState({}, '', '/admin/tax-brackets');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('tax-config-page')).not.toBeInTheDocument();
  });

  it('6. permits admin access to strictly admin-only route (/admin/tax-brackets)', async () => {
    seedAuth('admin');
    window.history.pushState({}, '', '/admin/tax-brackets');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('tax-config-page')).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('7. blocks viewer from general /admin route and redirects to /dashboard', async () => {
    seedAuth('viewer');
    window.history.pushState({}, '', '/admin');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('admin-dashboard-page')).not.toBeInTheDocument();
  });

  it('8. executes legacy route alias redirects (/salary-profile -> /salary/profiles, /paycheck-log -> /salary/paychecks)', async () => {
    seedAuth('manager');
    window.history.pushState({}, '', '/salary-profile');

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('salary-profiles-page')).toBeInTheDocument();
    });
    unmount();

    // Verify /paycheck-log redirect
    window.history.pushState({}, '', '/paycheck-log');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('paycheck-log-page')).toBeInTheDocument();
    });
  });

  it('9. executes Phase 6A legacy redirects (/summary -> /dashboard, /analysis/calendar & /analysis/fiscal -> /analysis/payroll, /taxes & /social-insurance -> /salary/rules)', async () => {
    seedAuth('manager');

    // 1. /summary -> /dashboard
    window.history.pushState({}, '', '/summary');
    const r1 = render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    r1.unmount();

    // 2. /analysis/calendar -> /analysis/payroll?cycle=calendar
    window.history.pushState({}, '', '/analysis/calendar');
    const r2 = render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('payroll-analytics-page')).toBeInTheDocument();
    });
    expect(window.location.search).toContain('cycle=calendar');
    r2.unmount();

    // 3. /analysis/fiscal -> /analysis/payroll?cycle=fiscal
    window.history.pushState({}, '', '/analysis/fiscal');
    const r3 = render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('payroll-analytics-page')).toBeInTheDocument();
    });
    expect(window.location.search).toContain('cycle=fiscal');
    r3.unmount();

    // 4. /taxes -> /salary/rules?tab=taxes
    window.history.pushState({}, '', '/taxes');
    const r4 = render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('payroll-rules-hub')).toBeInTheDocument();
    });
    expect(window.location.search).toContain('tab=taxes');
    r4.unmount();

    // 5. /social-insurance -> /salary/rules?tab=insurance
    window.history.pushState({}, '', '/social-insurance');
    const r5 = render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('payroll-rules-hub')).toBeInTheDocument();
    });
    expect(window.location.search).toContain('tab=insurance');
    r5.unmount();
  });
});
