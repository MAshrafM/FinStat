// frontend/src/context/AuthContext.test.js
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth, useCanModify } from './AuthContext';

// Mock authService logout
jest.mock('../services/authService', () => ({
  logoutUser: jest.fn().mockResolvedValue({ success: true }),
}));

describe('AuthContext & useCanModify Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const TestConsumer = () => {
    const { user, token, role, canModify, isViewer, isAdmin, isManager, login, logout, updateUser } = useAuth();
    return (
      <div>
        <span data-testid="username">{user?.username || 'none'}</span>
        <span data-testid="token">{token || 'none'}</span>
        <span data-testid="role">{role}</span>
        <span data-testid="canModify">{canModify ? 'yes' : 'no'}</span>
        <span data-testid="isViewer">{isViewer ? 'yes' : 'no'}</span>
        <span data-testid="isAdmin">{isAdmin ? 'yes' : 'no'}</span>
        <span data-testid="isManager">{isManager ? 'yes' : 'no'}</span>
        <button onClick={() => login('token-123', { id: 'u1', username: 'testuser', role: 'manager' })}>Login</button>
        <button onClick={() => logout()}>Logout</button>
        <button onClick={() => updateUser({ username: 'updatedName' })}>Update</button>
      </div>
    );
  };

  it('1. Initializes with user and token from localStorage', () => {
    localStorage.setItem('token', 'jwt-admin-token');
    localStorage.setItem('user', JSON.stringify({ id: 'a1', username: 'adminUser', role: 'admin' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('username')).toHaveTextContent('adminUser');
    expect(screen.getByTestId('token')).toHaveTextContent('jwt-admin-token');
    expect(screen.getByTestId('role')).toHaveTextContent('admin');
    expect(screen.getByTestId('canModify')).toHaveTextContent('yes');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('yes');
    expect(screen.getByTestId('isViewer')).toHaveTextContent('no');
  });

  it('2. Computed properties correctly identify viewer role', () => {
    localStorage.setItem('token', 'jwt-viewer-token');
    localStorage.setItem('user', JSON.stringify({ id: 'v1', username: 'viewerUser', role: 'viewer' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('role')).toHaveTextContent('viewer');
    expect(screen.getByTestId('canModify')).toHaveTextContent('no');
    expect(screen.getByTestId('isViewer')).toHaveTextContent('yes');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('no');
    expect(screen.getByTestId('isManager')).toHaveTextContent('no');
  });

  it('3. login() persists to localStorage and dispatches app:auth-change', () => {
    const authChangeSpy = jest.fn();
    window.addEventListener('app:auth-change', authChangeSpy);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('username')).toHaveTextContent('none');

    act(() => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    expect(screen.getByTestId('role')).toHaveTextContent('manager');
    expect(screen.getByTestId('canModify')).toHaveTextContent('yes');
    expect(localStorage.getItem('token')).toBe('token-123');
    expect(JSON.parse(localStorage.getItem('user')).username).toBe('testuser');
    expect(authChangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { user: expect.objectContaining({ username: 'testuser' }) },
      })
    );

    window.removeEventListener('app:auth-change', authChangeSpy);
  });

  it('4. logout() clears state and localStorage and dispatches app:auth-change with null', async () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: 'm1', username: 'manager1', role: 'manager' }));

    const authChangeSpy = jest.fn();
    window.addEventListener('app:auth-change', authChangeSpy);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('username')).toHaveTextContent('manager1');

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(authChangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { user: null },
      })
    );

    window.removeEventListener('app:auth-change', authChangeSpy);
  });

  it('5. updateUser() merges properties and notifies subscribers', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'oldName', role: 'manager' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByText('Update').click();
    });

    expect(screen.getByTestId('username')).toHaveTextContent('updatedName');
    expect(JSON.parse(localStorage.getItem('user')).username).toBe('updatedName');
  });

  it('6. app:auth-change event updates state in-tab and ignores undefined user', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'user1', role: 'viewer' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('username')).toHaveTextContent('user1');

    // Grace window: detail with undefined user should NOT wipe state
    act(() => {
      window.dispatchEvent(new CustomEvent('app:auth-change', { detail: { user: undefined } }));
    });
    expect(screen.getByTestId('username')).toHaveTextContent('user1');

    // Legitimate update via event
    act(() => {
      window.dispatchEvent(
        new CustomEvent('app:auth-change', {
          detail: { user: { id: 'u1', username: 'eventUpdated', role: 'admin' } },
        })
      );
    });
    expect(screen.getByTestId('username')).toHaveTextContent('eventUpdated');
    expect(screen.getByTestId('role')).toHaveTextContent('admin');
    expect(screen.getByTestId('canModify')).toHaveTextContent('yes');
  });

  it('7. useCanModify() graceful fallback when used outside AuthProvider', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'admin' }));

    const StandaloneComponent = () => {
      const { canModify, isViewer, role } = useCanModify();
      return (
        <div>
          <span data-testid="fallback-role">{role}</span>
          <span data-testid="fallback-modify">{canModify ? 'yes' : 'no'}</span>
          <span data-testid="fallback-viewer">{isViewer ? 'yes' : 'no'}</span>
        </div>
      );
    };

    render(<StandaloneComponent />);

    expect(screen.getByTestId('fallback-role')).toHaveTextContent('admin');
    expect(screen.getByTestId('fallback-modify')).toHaveTextContent('yes');
    expect(screen.getByTestId('fallback-viewer')).toHaveTextContent('no');
  });

  it('8. Fail-closed: missing role defaults to viewer and logs console.warn', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('user', JSON.stringify({ id: 'u_norole', username: 'corruptedUser' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('role')).toHaveTextContent('viewer');
    expect(screen.getByTestId('canModify')).toHaveTextContent('no');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AuthContext] User has no role — defaulting to viewer')
    );

    warnSpy.mockRestore();
  });
});
