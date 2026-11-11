// frontend/src/components/__tests__/ProtectedRoute.test.js
jest.mock('react-router-dom', () => {
  return require('../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { THEMED_PATTERNS, isThemedRoute } from '../ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

// Mock heavy sub-components to test ProtectedRoute in isolation
jest.mock('../Navbar', () => () => <nav data-testid="mock-navbar">Navbar</nav>);
jest.mock('../Sidebar', () => () => <aside data-testid="mock-sidebar">Sidebar</aside>);
jest.mock('../common/ViewOnlyBanner', () => () => <div data-testid="mock-view-only-banner">Banner</div>);
jest.mock('../../services/authService', () => ({
  logoutUser: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Phase 2B: ProtectedRoute & Shell Gating Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.fsTheme;
    // Ensure THEMED_PATTERNS is empty in 2B
    THEMED_PATTERNS.length = 0;
  });

  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.fsTheme;
    THEMED_PATTERNS.length = 0;
  });

  const renderProtectedRoute = (initialRoute = '/dashboard') => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'testuser', role: 'admin' }));

    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div data-testid="dashboard-content">Dashboard View</div>} />
              <Route path="/portfolio" element={<div data-testid="portfolio-content">Portfolio View</div>} />
              <Route path="/test-themed" element={<div data-testid="themed-content">Themed View</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  test('1. renders accessible skip link matching WCAG 2.4.1 targeting #main-content with tabIndex={-1}', () => {
    renderProtectedRoute('/dashboard');

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveClass('fs-skip-link');

    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveAttribute('tabIndex', '-1');
    expect(mainContent).toHaveClass('main-content');
  });

  test('2. empty allowlist in Phase 2B keeps document un-themed and main without fs-page (Invariant I13)', () => {
    expect(THEMED_PATTERNS).toEqual([]);
    expect(isThemedRoute('/dashboard')).toBe(false);
    expect(isThemedRoute('/portfolio')).toBe(false);

    renderProtectedRoute('/dashboard');

    expect(document.documentElement.dataset.fsTheme).toBeUndefined();
    const mainContent = document.getElementById('main-content');
    expect(mainContent).not.toHaveClass('fs-page');
  });

  test('3. correctly sets data-fs-theme="dark" and fs-page class when route matches allowlist', () => {
    THEMED_PATTERNS.push('/test-themed');
    expect(isThemedRoute('/test-themed')).toBe(true);

    const { unmount } = renderProtectedRoute('/test-themed');

    expect(document.documentElement.dataset.fsTheme).toBe('dark');
    const mainContent = document.getElementById('main-content');
    expect(mainContent).toHaveClass('fs-page');

    unmount();
    expect(document.documentElement.dataset.fsTheme).toBeUndefined();
  });

  test('4. sets full-bleed class on /portfolio route while maintaining un-themed state in 2B', () => {
    renderProtectedRoute('/portfolio');

    const mainContent = document.getElementById('main-content');
    expect(mainContent).toHaveClass('full-bleed');
    expect(mainContent).not.toHaveClass('fs-page');
    expect(document.documentElement.dataset.fsTheme).toBeUndefined();
  });
});
