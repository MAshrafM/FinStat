// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { logoutUser as apiLogoutUser } from '../services/authService';

const AUTH_CHANGE_EVENT = 'app:auth-change';

export const AuthContext = createContext(null);

/**
 * Safely parses the stored user object from localStorage.
 */
export const getStoredUser = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[AuthContext] Failed to parse stored user:', err);
    return null;
  }
};

/**
 * Safely reads the access token from localStorage.
 */
export const getStoredToken = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return localStorage.getItem('token') || null;
};

/**
 * Dispatches an in-tab auth change notification event.
 */
export const dispatchAuthChange = (user) => {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { user } }));
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  // Fail-closed role diagnostics & computation
  if (user && !user.role) {
    console.warn('[AuthContext] User has no role — defaulting to viewer. This may indicate corrupted localStorage.');
  }

  const role = user?.role || 'viewer';
  const canModify = role === 'admin' || role === 'manager';
  const isViewer = role === 'viewer';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isAuthenticated = Boolean(token && user);

  // Login handler
  const login = useCallback((newToken, newUser) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (newToken) localStorage.setItem('token', newToken);
      if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
    }
    setToken(newToken || null);
    setUser(newUser || null);
    dispatchAuthChange(newUser || null);
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiLogoutUser();
    } catch (e) {
      // Ignore API logout failures during client cleanup
    } finally {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      }
      setToken(null);
      setUser(null);
      dispatchAuthChange(null);
    }
  }, []);

  // Profile / user update handler
  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...userData };
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('user', JSON.stringify(merged));
      }
      dispatchAuthChange(merged);
      return merged;
    });
  }, []);

  // Synchronize with cross-tab (storage) and in-tab (app:auth-change) events
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'user' || event.key === 'token' || event.key === null) {
        setUser(getStoredUser());
        setToken(getStoredToken());
      }
    };

    const handleAuthChange = (event) => {
      if (event.detail && event.detail.user !== undefined) {
        if (event.detail.user === null) {
          setUser(null);
          setToken(null);
        } else {
          setUser(event.detail.user);
          setToken(getStoredToken());
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      canModify,
      isViewer,
      isAdmin,
      isManager,
      isAuthenticated,
      login,
      logout,
      updateUser,
    }),
    [user, token, role, canModify, isViewer, isAdmin, isManager, isAuthenticated, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access the full authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Lightweight hook returning permission booleans and role.
 * Includes graceful fallback to localStorage when rendered outside AuthProvider.
 */
export const useCanModify = () => {
  const context = useContext(AuthContext);
  if (context) {
    return {
      canModify: context.canModify,
      isViewer: context.isViewer,
      isAdmin: context.isAdmin,
      isManager: context.isManager,
      role: context.role,
    };
  }

  // Graceful fallback for components rendered outside AuthProvider (e.g. unit tests)
  const user = getStoredUser();
  if (user && !user.role) {
    console.warn('[AuthContext] User has no role — defaulting to viewer. This may indicate corrupted localStorage.');
  }
  const role = user?.role || 'viewer';
  return {
    canModify: role === 'admin' || role === 'manager',
    isViewer: role === 'viewer',
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    role,
  };
};

export default AuthContext;
