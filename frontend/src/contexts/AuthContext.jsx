/**
 * AuthContext — GrantThrive Core Platform
 * =========================================
 * React context wrapper around the shared @grantthrive/auth library.
 * All token storage (localStorage key: gt_auth_token), API calls, and role
 * helpers are delegated to the shared library so that authentication behaviour
 * is identical across all five GrantThrive UI apps.
 *
 * Backwards-compatible: all previously exported values are preserved so that
 * existing components (Login, Navbar, dashboards, etc.) require no changes.
 *
 * Domain: grantthrive.com
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as sharedLogin,
  logout as sharedLogout,
  verifyToken,
  setAuth,
  getToken,
  getStoredUser,
  clearAuth,
  getAuthHeaders,
  ROLES,
} from '@grantthrive/auth';
import apiClient from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // On mount: verify the stored token with the backend and refresh user profile
  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const verifiedUser = await verifyToken();
      setUser(verifiedUser || null);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const result = await sharedLogin(email, password);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      setError(result.error);
      return { success: false, error: result.error };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);
      // Registration still uses the existing apiClient — it calls /auth/register
      const response = await apiClient.register(userData);
      if (response.user) {
        if (response.token) {
          setAuth(response.token, response.user);
          setUser(response.user);
        }
        return {
          success: true,
          user: response.user,
          requiresApproval: response.requires_approval || false,
        };
      }
      throw new Error('Registration failed');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const demoLogin = useCallback(async (demoType) => {
    try {
      setError(null);
      setLoading(true);
      const response = await apiClient.demoLogin(demoType);
      if (response.user && response.token) {
        setAuth(response.token, response.user);
        setUser(response.user);
        return { success: true, user: response.user };
      }
      throw new Error('Demo login failed');
    } catch (err) {
      const msg = err.message || 'Demo login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await sharedLogout(true);
    } catch {
      // Always clear local state even if the server call fails
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    if (updatedUser) {
      setAuth(getToken(), updatedUser);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ── Role helpers (backwards-compatible names) ─────────────────────────────
  const isAdmin = useCallback(() =>
    !!(user && (user.role === ROLES.COUNCIL_ADMIN || user.role === ROLES.SYSTEM_ADMIN)),
  [user]);

  const isCouncilStaff = useCallback(() =>
    !!(user && [ROLES.COUNCIL_ADMIN, ROLES.COUNCIL_STAFF, ROLES.SYSTEM_ADMIN].includes(user.role)),
  [user]);

  const isCommunityMember = useCallback(() =>
    !!(user && user.role === ROLES.COMMUNITY_MEMBER),
  [user]);

  const isProfessionalConsultant = useCallback(() =>
    !!(user && user.role === ROLES.PROFESSIONAL_CONSULTANT),
  [user]);

  const isSystemAdmin = useCallback(() =>
    !!(user && user.role === ROLES.SYSTEM_ADMIN),
  [user]);

  const hasRole = useCallback((role) =>
    !!(user && user.role === role),
  [user]);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    demoLogin,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
    getAuthHeaders,
    isAuthenticated: !!user,
    isAdmin,
    isCouncilStaff,
    isCommunityMember,
    isProfessionalConsultant,
    isSystemAdmin,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthContext;
