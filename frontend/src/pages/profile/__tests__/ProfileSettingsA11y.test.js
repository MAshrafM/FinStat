// frontend/src/pages/profile/__tests__/ProfileSettingsA11y.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ProfilePage from '../ProfilePage';
import SettingsPage from '../SettingsPage';
import RecycleBin from '../RecycleBin';
import { getUserProfile } from '../../../services/userService';
import apiClient from '../../../services/apiClient';

expect.extend(toHaveNoViolations);

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

const mockAddToast = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    showToast: mockShowToast,
  }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({
    canModify: true,
    isViewer: false,
    isAdmin: true,
    isManager: false,
    role: 'admin',
  }),
}));

jest.mock('../../../services/userService', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));

jest.mock('../../../services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('Phase 10A: Profile, Settings & Recycle Bin Accessibility (jest-axe + APG)', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = originalMatchMedia;
    getUserProfile.mockResolvedValue({
      user: {
        username: 'admin_user',
        email: 'admin@finstat.local',
        role: 'admin',
        fullName: 'Ahmed Mansour',
        costBasisMethod: 'average',
      },
    });
    apiClient.get.mockResolvedValue({
      data: [
        {
          _id: 'exp-1',
          date: '2026-01-10T00:00:00.000Z',
          description: 'Cloud Hosting',
          transactionValue: 1250,
          paymentMethod: 'Bank',
          deletedAt: '2026-01-12T09:30:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    });
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('ProfilePage has zero jest-axe violations', async () => {
    const { container } = render(<ProfilePage />);
    await screen.findByLabelText(/Full Name/i);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SettingsPage has zero jest-axe violations', async () => {
    const { container } = render(<SettingsPage />);
    await screen.findByRole('radio', { name: /Weighted Average/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('RecycleBin desktop has zero jest-axe violations and implements APG tab keyboard navigation', async () => {
    const { container } = render(<RecycleBin />);
    await screen.findByTestId('deleted-items-table');

    const tablist = screen.getByRole('tablist', { name: /Recycle bin categories/i });
    const expTab = screen.getByTestId('tab-expenditures');
    const tradesTab = screen.getByTestId('tab-trades');
    const panel = screen.getByRole('tabpanel');

    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    expect(expTab).toHaveAttribute('role', 'tab');
    expect(expTab).toHaveAttribute('aria-selected', 'true');
    expect(panel).toHaveAttribute('aria-labelledby', 'recycle-tab-expenditures');

    expTab.focus();
    fireEvent.keyDown(expTab, { key: 'ArrowRight' });
    expect(tradesTab).toHaveFocus();
    fireEvent.keyDown(tradesTab, { key: 'Enter' });

    await waitFor(() => {
      expect(tradesTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(panel).toHaveAttribute('aria-labelledby', 'recycle-tab-trades');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('RecycleBin mobile D19 cards have zero jest-axe violations', async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { container } = render(<RecycleBin />);
    await screen.findByTestId('recycle-mobile-cards');
    expect(screen.queryByTestId('deleted-items-table')).not.toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: /Show details for Cloud Hosting/i });
    fireEvent.click(expandBtn);
    expect(screen.getByRole('button', { name: /Hide details for Cloud Hosting/i })).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
