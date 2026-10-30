// frontend/src/components/__tests__/SidebarHubs.test.js
jest.mock('react-router-dom', () => {
  return require('../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { AuthProvider } from '../../context/AuthContext';

// Mock authService logout
jest.mock('../../services/authService', () => ({
  logoutUser: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Step 6A.2: [SIMP-004] Sidebar Hubs & Navigation Rationalization Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderSidebar = (initialRoute = '/dashboard', role = 'admin') => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'testuser', role }));

    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  test('1. renders all 5 hub headers (Overview, Income & Payroll, Daily Spending, Investments & Wealth, System & Settings)', () => {
    renderSidebar('/dashboard', 'admin');

    expect(screen.getByText('Overview', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Income & Payroll')).toBeInTheDocument();
    expect(screen.getByText('Daily Spending')).toBeInTheDocument();
    expect(screen.getByText('Investments & Wealth')).toBeInTheDocument();
    expect(screen.getByText('System & Settings')).toBeInTheDocument();
  });

  test('2. initializes with only the active route hub expanded and other hubs collapsed by default', () => {
    renderSidebar('/dashboard', 'admin');

    // Overview contains Dashboard -> items in Overview should be visible
    expect(screen.getByText('Rebalancing')).toBeInTheDocument();

    // Daily Spending contains Budget Tracker -> should be collapsed by default
    expect(screen.queryByText('Budget Tracker')).not.toBeInTheDocument();
    // Investments contains Mutual Funds -> should be collapsed by default
    expect(screen.queryByText('Mutual Funds')).not.toBeInTheDocument();
  });

  test('3. clicking a hub header toggles its open/closed state', () => {
    renderSidebar('/dashboard', 'admin');

    // Daily Spending is collapsed initially
    expect(screen.queryByText('Budget Tracker')).not.toBeInTheDocument();

    // Click Daily Spending header to expand
    const spendingHeader = screen.getByText(/Daily Spending/i);
    fireEvent.click(spendingHeader);

    expect(screen.getByText('Budget Tracker')).toBeInTheDocument();

    // Click Daily Spending header again to collapse
    fireEvent.click(spendingHeader);
    expect(screen.queryByText('Budget Tracker')).not.toBeInTheDocument();
  });

  test('4. auto-expands the matching hub when active route belongs to that hub', () => {
    renderSidebar('/expenditures', 'admin');

    // On /expenditures, Daily Spending should auto-expand
    expect(screen.getByText('Expenditure Log')).toBeInTheDocument();
    expect(screen.getByText('Budget Tracker')).toBeInTheDocument();

    // Overview should be collapsed by default when on /expenditures
    expect(screen.queryByText('Rebalancing')).not.toBeInTheDocument();
  });

  test('5. honors manual collapse within active hub (Option A behavior)', () => {
    renderSidebar('/dashboard', 'admin');

    // Overview is expanded initially
    expect(screen.getByText('Rebalancing')).toBeInTheDocument();

    // Manually collapse Overview
    const overviewHeader = screen.getByText('Overview', { exact: true });
    fireEvent.click(overviewHeader);

    // Rebalancing should now be hidden
    expect(screen.queryByText('Rebalancing')).not.toBeInTheDocument();
  });

  test('6. filters admin-only items (Tax Brackets, Social Insurance, Database Backup) for viewer role', () => {
    renderSidebar('/dashboard', 'viewer');

    // Expand System & Settings
    const systemHeader = screen.getByText(/System & Settings/i);
    fireEvent.click(systemHeader);

    // Common settings links should be visible
    expect(screen.getByText('Security & 2FA')).toBeInTheDocument();

    // Admin-only links must NOT be rendered for viewer
    expect(screen.queryByText('Tax Brackets')).not.toBeInTheDocument();
    expect(screen.queryByText('Social Insurance')).not.toBeInTheDocument();
    expect(screen.queryByText('Database Backup')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Users')).not.toBeInTheDocument();
  });

  test('7. displays Manage Viewers link appropriately for manager role', () => {
    renderSidebar('/dashboard', 'manager');

    // Expand System & Settings
    const systemHeader = screen.getByText(/System & Settings/i);
    fireEvent.click(systemHeader);

    expect(screen.getByText('Manage Viewers')).toBeInTheDocument();
    // Admin-only items still blocked for manager
    expect(screen.queryByText('Tax Brackets')).not.toBeInTheDocument();
    expect(screen.queryByText('Database Backup')).not.toBeInTheDocument();
  });
});
