// frontend/src/pages/security/__tests__/SecuritySettingsA11y.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SecuritySettingsPage from '../SecuritySettingsPage';
import {
  getCurrentUser,
  setup2FA,
  verify2FASetup,
  getAuditLogs,
} from '../../../services/authService';

expect.extend(toHaveNoViolations);

jest.mock('../../../services/authService', () => ({
  getCurrentUser: jest.fn(),
  setup2FA: jest.fn(),
  verify2FASetup: jest.fn(),
  disable2FA: jest.fn(),
  getAuditLogs: jest.fn(),
}));

jest.mock('../../../services/apiClient', () => ({
  dispatchToast: jest.fn(),
}));

describe('Phase 10B: SecuritySettingsPage Accessibility (jest-axe + APG Modal)', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = originalMatchMedia;
    getCurrentUser.mockResolvedValue({
      user: { username: 'admin_user', role: 'admin', totpEnabled: false },
    });
    getAuditLogs.mockResolvedValue({
      logs: [
        {
          _id: 'log-1',
          success: true,
          timestamp: '2026-01-15T08:45:00.000Z',
          ip: '192.168.1.42',
          userAgent: 'Chrome/131 Windows',
        },
      ],
      page: 1,
      pages: 1,
      total: 1,
    });
    setup2FA.mockResolvedValue({
      secret: 'JBSWY3DPEHPK3PXP',
      formattedSecret: 'JBSW Y3DP EHPK 3PXP',
    });
    verify2FASetup.mockResolvedValue({
      backupCodes: ['AAAA-1111', 'BBBB-2222'],
    });
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('1. default view has zero jest-axe violations', async () => {
    const { container } = render(<SecuritySettingsPage />);
    await screen.findByTestId('security-audit-table');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('2. 2FA setup modal has zero jest-axe violations and supports Escape close', async () => {
    const { container } = render(<SecuritySettingsPage />);
    const enableBtn = await screen.findByRole('button', { name: /Enable 2FA/i });
    fireEvent.click(enableBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('3. backup codes modal has zero jest-axe violations', async () => {
    const { container } = render(<SecuritySettingsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Enable 2FA/i }));
    await screen.findByText('JBSW Y3DP EHPK 3PXP');

    fireEvent.change(screen.getByLabelText(/Enter the 6-digit verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify & Activate/i }));

    await screen.findByText('AAAA-1111');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('4. disable 2FA modal has zero jest-axe violations and accessible password toggle', async () => {
    getCurrentUser.mockResolvedValueOnce({
      user: { username: 'admin_user', role: 'admin', totpEnabled: true },
    });
    const { container } = render(<SecuritySettingsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Disable 2FA/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: /Show password/i })).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('5. mobile D19 cards have zero jest-axe violations', async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { container } = render(<SecuritySettingsPage />);
    await screen.findByTestId('security-mobile-cards');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
