// frontend/src/pages/admin/__tests__/AdminA11y.test.js
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AdminDashboard from '../AdminDashboard';

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);
import TaxConfigPage from '../TaxConfigPage';
import InsuranceConfigPage from '../InsuranceConfigPage';
import BackupPage from '../BackupPage';
import {
  getUsers,
  getTaxBracketConfigs,
  getSocialInsuranceConfigs,
} from '../../../services/adminService';
import { getBackupStatus } from '../../../services/backupService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

expect.extend(toHaveNoViolations);

jest.mock('../../../services/adminService', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
  deleteUser: jest.fn(),
  getTaxBracketConfigs: jest.fn(),
  createTaxBracketConfig: jest.fn(),
  updateTaxBracketConfig: jest.fn(),
  deleteTaxBracketConfig: jest.fn(),
  toggleTaxBracketConfig: jest.fn(),
  getSocialInsuranceConfigs: jest.fn(),
  createSocialInsuranceConfig: jest.fn(),
  updateSocialInsuranceConfig: jest.fn(),
  deleteSocialInsuranceConfig: jest.fn(),
  toggleSocialInsuranceConfig: jest.fn(),
}));

jest.mock('../../../services/backupService', () => ({
  getBackupStatus: jest.fn(),
  exportBackup: jest.fn(),
  importBackup: jest.fn(),
}));

jest.mock('../../../services/apiClient', () => ({
  dispatchToast: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  useCanModify: () => ({ canModify: true }),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: jest.fn(),
}));

describe('Phase 10C Admin Accessibility (jest-axe)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));
    useAuth.mockReturnValue({
      user: { _id: 'u-1', username: 'admin_user', role: 'admin' },
      isAdmin: true,
      isManager: false,
      isViewer: false,
    });
    useToast.mockReturnValue({ addToast: jest.fn() });
    getUsers.mockResolvedValue({
      users: [
        {
          _id: 'u-1',
          username: 'admin_user',
          email: 'admin@finstat.local',
          role: 'admin',
          totpEnabled: true,
          createdAt: '2025-11-01T09:00:00.000Z',
        },
      ],
      totalPages: 1,
      totalUsers: 1,
    });
    getTaxBracketConfigs.mockResolvedValue({
      taxBrackets: [
        {
          _id: 'tax-1',
          year: 2025,
          country: 'Egypt',
          personalExemption: 20000,
          isActive: true,
          brackets: [{ level: 1, from: 0, to: 40000, rate: 0 }],
        },
      ],
    });
    getSocialInsuranceConfigs.mockResolvedValue({
      socialInsuranceConfigs: [
        {
          _id: 'ins-1',
          year: 2025,
          country: 'Egypt',
          employeeShare: 11,
          employerShare: 18.75,
          minInsurableIncome: 2300,
          maxInsurableIncome: 14500,
          isActive: true,
        },
      ],
    });
    getBackupStatus.mockResolvedValue({ importAvailable: true });
  });

  it('AdminDashboard passes axe with 0 violations and closes Add User modal on Escape', async () => {
    const { container } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-table')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole('button', { name: /Add New User/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('TaxConfigPage passes axe with 0 violations', async () => {
    const { container } = render(<TaxConfigPage />);

    await waitFor(() => {
      expect(screen.getByText('2025 Tax Brackets')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('InsuranceConfigPage passes axe with 0 violations', async () => {
    const { container } = render(<InsuranceConfigPage />);

    await waitFor(() => {
      expect(screen.getByText('2025 Social Insurance')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('BackupPage passes axe with 0 violations', async () => {
    const { container } = render(<BackupPage />);

    await waitFor(() => {
      expect(screen.getByText('Dev Mode — Restore Enabled')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
