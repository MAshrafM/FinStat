// frontend/src/pages/security/__tests__/SecuritySettingsPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SecuritySettingsPage from '../SecuritySettingsPage';
import {
  getCurrentUser,
  setup2FA,
  verify2FASetup,
  disable2FA,
  getAuditLogs,
} from '../../../services/authService';
import { dispatchToast } from '../../../services/apiClient';

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

describe('Phase 10B: SecuritySettingsPage Unit Tests', () => {
  const originalMatchMedia = window.matchMedia;

  const mockLogs = [
    {
      _id: 'log-1',
      success: true,
      timestamp: '2026-01-15T08:45:00.000Z',
      ip: '192.168.1.42',
      userAgent: 'Chrome/131 Windows',
    },
    {
      _id: 'log-2',
      success: false,
      timestamp: '2026-01-14T22:10:00.000Z',
      ip: '10.0.0.19',
      userAgent: 'Safari iPhone',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = originalMatchMedia;
    getCurrentUser.mockResolvedValue({
      user: { username: 'admin_user', role: 'admin', totpEnabled: false },
    });
    getAuditLogs.mockResolvedValue({
      logs: mockLogs,
      page: 1,
      pages: 2,
      total: 12,
    });
    setup2FA.mockResolvedValue({
      secret: 'JBSWY3DPEHPK3PXP',
      formattedSecret: 'JBSW Y3DP EHPK 3PXP',
    });
    verify2FASetup.mockResolvedValue({
      backupCodes: ['AAAA-1111', 'BBBB-2222'],
    });
    disable2FA.mockResolvedValue({ message: 'Disabled' });
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('1. loads user profile, audit logs, and renders neutral/semantic badges', async () => {
    render(<SecuritySettingsPage />);
    expect(screen.getByRole('status', { name: /Loading security settings/i })).toBeInTheDocument();

    await screen.findByTestId('security-audit-table');
    expect(screen.getByText('Disabled')).toHaveClass('fs-badge--warning');
    expect(screen.getByText('Success')).toHaveClass('fs-badge');
    expect(screen.getByText('Failed')).toHaveClass('fs-badge--negative');
    expect(screen.getByText('192.168.1.42')).toHaveClass('fs-mono');
  });

  it('2. renders role-specific permission copy for admin, manager, and viewer', async () => {
    const { unmount } = render(<SecuritySettingsPage />);
    await screen.findByText(/full administrative privileges/i);
    unmount();

    getCurrentUser.mockResolvedValueOnce({
      user: { username: 'mgr_user', role: 'manager', totpEnabled: false },
    });
    const view = render(<SecuritySettingsPage />);
    await screen.findByText(/management permissions to create and edit/i);
    view.unmount();

    getCurrentUser.mockResolvedValueOnce({
      user: { username: 'view_user', role: 'viewer', totpEnabled: false },
    });
    render(<SecuritySettingsPage />);
    await screen.findByText(/read-only access to view financial dashboards/i);
  });

  it('3. completes 2FA setup -> verify -> backup codes reveal flow', async () => {
    render(<SecuritySettingsPage />);
    const enableBtn = await screen.findByRole('button', { name: /Enable 2FA/i });
    expect(enableBtn).toHaveClass('fs-btn-primary');
    fireEvent.click(enableBtn);

    await screen.findByText('JBSW Y3DP EHPK 3PXP');
    const codeInput = screen.getByLabelText(/Enter the 6-digit verification code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify & Activate/i }));

    await waitFor(() => {
      expect(verify2FASetup).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP', '123456');
    });
    expect(await screen.findByText('Save Now')).toHaveClass('fs-badge--warning');
    expect(screen.getByText('AAAA-1111')).toHaveClass('fs-mono');
    expect(dispatchToast).toHaveBeenCalledWith('Two-Factor Authentication enabled successfully!', 'success');
  });

  it('4. shows inline alert on 2FA setup validation error', async () => {
    render(<SecuritySettingsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Enable 2FA/i }));
    await screen.findByText('JBSW Y3DP EHPK 3PXP');

    const codeInput = screen.getByLabelText(/Enter the 6-digit verification code/i);
    fireEvent.change(codeInput, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify & Activate/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/6-digit code/i);
    expect(verify2FASetup).not.toHaveBeenCalled();
  });

  it('5. shows inline alert on 2FA disable validation error', async () => {
    getCurrentUser.mockResolvedValueOnce({
      user: { username: 'admin_user', role: 'admin', totpEnabled: true },
    });
    render(<SecuritySettingsPage />);

    const disableTrigger = await screen.findByRole('button', { name: /Disable 2FA/i });
    expect(disableTrigger).toHaveClass('fs-btn-secondary');
    fireEvent.click(disableTrigger);

    const confirmBtn = await screen.findByRole('button', { name: /Confirm Disable/i });
    expect(confirmBtn).toHaveClass('fs-btn-danger');
    fireEvent.click(confirmBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter your password or current TOTP code/i);
    expect(disable2FA).not.toHaveBeenCalled();
  });

  it('6. completes 2FA disable flow and updates status badge', async () => {
    getCurrentUser.mockResolvedValueOnce({
      user: { username: 'admin_user', role: 'admin', totpEnabled: true },
    });
    render(<SecuritySettingsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Disable 2FA/i }));
    fireEvent.change(await screen.findByLabelText(/Account Password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Disable/i }));

    await waitFor(() => {
      expect(disable2FA).toHaveBeenCalledWith({ password: 'secret123', code: undefined });
    });
    expect(dispatchToast).toHaveBeenCalledWith('Two-Factor Authentication has been disabled.', 'info');
  });

  it('7. supports audit log pagination', async () => {
    render(<SecuritySettingsPage />);
    await screen.findByTestId('security-audit-table');

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(getAuditLogs).toHaveBeenCalledWith(2, 10);
    });
  });

  it('8. refreshes audit logs on Refresh click', async () => {
    render(<SecuritySettingsPage />);
    await screen.findByTestId('security-audit-table');

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => {
      expect(getAuditLogs).toHaveBeenCalledTimes(2);
    });
  });

  it('9. renders D19 mobile cards via guarded matchMedia and omits desktop table', async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    render(<SecuritySettingsPage />);
    await screen.findByTestId('security-mobile-cards');
    expect(screen.queryByTestId('security-audit-table')).not.toBeInTheDocument();

    const expandBtn = screen.getByRole('button', { name: /Show details for Success attempt/i });
    fireEvent.click(expandBtn);
    expect(screen.getByText('Chrome/131 Windows')).toBeInTheDocument();
  });
});
