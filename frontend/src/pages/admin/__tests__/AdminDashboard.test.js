// frontend/src/pages/admin/__tests__/AdminDashboard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '../AdminDashboard';
import { getUsers, createUser, deleteUser } from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';

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

jest.mock('../../../services/adminService', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('../../../services/apiClient', () => ({
  dispatchToast: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
  useCanModify: () => ({ canModify: true }),
}));

const MOCK_USERS = [
  {
    _id: 'u-1',
    username: 'admin_user',
    email: 'admin@finstat.local',
    role: 'admin',
    totpEnabled: true,
    createdAt: '2025-11-01T09:00:00.000Z',
  },
  {
    _id: 'u-2',
    username: 'omar_viewer',
    email: 'omar@finstat.local',
    role: 'viewer',
    totpEnabled: false,
    managedBy: { _id: 'u-1', username: 'admin_user' },
    createdAt: '2026-01-05T11:15:00.000Z',
  },
];

const renderDashboard = () => render(<AdminDashboard />);

describe('AdminDashboard', () => {
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
    getUsers.mockResolvedValue({
      users: MOCK_USERS,
      totalPages: 1,
      totalUsers: 2,
    });
  });

  it('renders users table, quick cards, and 2FA status badges', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-table')).toBeInTheDocument();
    });

    expect(screen.getByText('Tax Brackets')).toBeInTheDocument();
    expect(screen.getByText('Social Insurance')).toBeInTheDocument();
    expect(screen.getByText('admin_user')).toBeInTheDocument();
    expect(screen.getByText('omar_viewer')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('opens Add User modal, creates a user, and refreshes list', async () => {
    createUser.mockResolvedValue({ user: { username: 'new_viewer' } });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-table')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add New User/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'new_viewer' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'new@finstat.local' } });
    fireEvent.change(screen.getByLabelText(/Temporary Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'new_viewer',
          email: 'new@finstat.local',
          role: 'viewer',
        })
      );
    });
  });

  it('opens Delete User modal and deletes selected user on confirmation', async () => {
    deleteUser.mockResolvedValue({ success: true });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-table')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete omar_viewer' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Delete User/i }));

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith('u-2');
    });
  });

  it('collapses to D19 mobile cards on viewports <= 768px', async () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-users-mobile-cards')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('admin-users-table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand omar_viewer' }));
    expect(screen.getByText('omar@finstat.local')).toBeInTheDocument();
  });
});
