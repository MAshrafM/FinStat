// frontend/src/context/__tests__/AuthContextDelegation.test.js
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import * as userService from '../../services/userService';

// Mock authService and userService
jest.mock('../../services/authService', () => ({
  logoutUser: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../services/userService', () => ({
  switchAccountApi: jest.fn(),
  getSwitchableAccounts: jest.fn(),
  getFamilyRollup: jest.fn(),
  createDelegation: jest.fn(),
  revokeDelegation: jest.fn(),
}));

describe('AuthContext Account Delegation & Switching Extension Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const DelegationConsumer = () => {
    const {
      user,
      token,
      isDelegatedSession,
      originalUser,
      switchAccount,
      switchBackToPrimary,
    } = useAuth();

    return (
      <div>
        <span data-testid="userId">{user?.id || 'none'}</span>
        <span data-testid="username">{user?.username || 'none'}</span>
        <span data-testid="role">{user?.role || 'none'}</span>
        <span data-testid="token">{token || 'none'}</span>
        <span data-testid="isDelegatedSession">{isDelegatedSession ? 'yes' : 'no'}</span>
        <span data-testid="originalUser">{originalUser || 'none'}</span>
        <button
          onClick={async () => {
            try {
              await switchAccount('delegate-user-2');
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Switch Account
        </button>
        <button
          onClick={async () => {
            try {
              await switchBackToPrimary();
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Switch Back
        </button>
      </div>
    );
  };

  it('1. Initializes isDelegatedSession as false and originalUser as null for standard primary login', () => {
    localStorage.setItem('token', 'jwt-primary-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'primary-1',
        username: 'alice_parent',
        role: 'manager',
      })
    );

    render(
      <AuthProvider>
        <DelegationConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('userId')).toHaveTextContent('primary-1');
    expect(screen.getByTestId('username')).toHaveTextContent('alice_parent');
    expect(screen.getByTestId('isDelegatedSession')).toHaveTextContent('no');
    expect(screen.getByTestId('originalUser')).toHaveTextContent('none');
  });

  it('2. Populates isDelegatedSession: true and originalUser: parentId when user has delegation metadata', () => {
    localStorage.setItem('token', 'jwt-delegated-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'delegate-2',
        username: 'bob_child',
        role: 'viewer',
        isDelegatedSession: true,
        delegatedFrom: 'primary-1',
      })
    );

    render(
      <AuthProvider>
        <DelegationConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('userId')).toHaveTextContent('delegate-2');
    expect(screen.getByTestId('username')).toHaveTextContent('bob_child');
    expect(screen.getByTestId('isDelegatedSession')).toHaveTextContent('yes');
    expect(screen.getByTestId('originalUser')).toHaveTextContent('primary-1');
  });

  it('3. switchAccount(targetUserId) calls userService.switchAccountApi and updates token, user, and localStorage state', async () => {
    localStorage.setItem('token', 'jwt-primary-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'primary-1',
        username: 'alice_parent',
        role: 'manager',
      })
    );

    userService.switchAccountApi.mockResolvedValueOnce({
      success: true,
      token: 'jwt-delegated-token-switched',
      user: {
        id: 'delegate-user-2',
        username: 'bob_child',
        role: 'viewer',
        isDelegatedSession: true,
        delegatedFrom: 'primary-1',
      },
    });

    render(
      <AuthProvider>
        <DelegationConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('userId')).toHaveTextContent('primary-1');
    expect(screen.getByTestId('isDelegatedSession')).toHaveTextContent('no');

    await act(async () => {
      screen.getByText('Switch Account').click();
    });

    expect(userService.switchAccountApi).toHaveBeenCalledWith('delegate-user-2');
    expect(screen.getByTestId('userId')).toHaveTextContent('delegate-user-2');
    expect(screen.getByTestId('username')).toHaveTextContent('bob_child');
    expect(screen.getByTestId('role')).toHaveTextContent('viewer');
    expect(screen.getByTestId('isDelegatedSession')).toHaveTextContent('yes');
    expect(screen.getByTestId('originalUser')).toHaveTextContent('primary-1');
    expect(localStorage.getItem('token')).toBe('jwt-delegated-token-switched');
    expect(JSON.parse(localStorage.getItem('user')).id).toBe('delegate-user-2');
  });

  it('4. switchBackToPrimary() invokes switchAccount(originalUser) and clears delegated session flags upon return', async () => {
    localStorage.setItem('token', 'jwt-delegated-token-switched');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'delegate-user-2',
        username: 'bob_child',
        role: 'viewer',
        isDelegatedSession: true,
        delegatedFrom: 'primary-1',
      })
    );

    userService.switchAccountApi.mockResolvedValueOnce({
      success: true,
      token: 'jwt-primary-token-restored',
      user: {
        id: 'primary-1',
        username: 'alice_parent',
        role: 'manager',
        isDelegatedSession: false,
        delegatedFrom: undefined,
      },
    });

    render(
      <AuthProvider>
        <DelegationConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('userId')).toHaveTextContent('delegate-user-2');
    expect(screen.getByTestId('isDelegatedSession')).toHaveTextContent('yes');

    await act(async () => {
      screen.getByText('Switch Back').click();
    });

    expect(userService.switchAccountApi).toHaveBeenCalledWith('primary-1');
    expect(screen.getByTestId('userId')).toHaveTextContent('primary-1');
    expect(screen.getByTestId('username')).toHaveTextContent('alice_parent');
    expect(screen.getByTestId('role')).toHaveTextContent('manager');
    expect(screen.getByTestId('isDelegatedSession')).toHaveTextContent('no');
    expect(screen.getByTestId('originalUser')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBe('jwt-primary-token-restored');
    expect(JSON.parse(localStorage.getItem('user')).id).toBe('primary-1');
  });
});
