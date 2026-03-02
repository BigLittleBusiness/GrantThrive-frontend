/**
 * useAdminAuth — GrantThrive Admin Dashboard
 * ============================================
 * React hook that provides the current admin user and a logout helper
 * to any component inside the admin dashboard.
 *
 * Usage:
 *   import { useAdminAuth } from '../hooks/useAdminAuth';
 *   const { user, logout } = useAdminAuth();
 *
 * logout() dispatches the `gt:logout` custom event which AdminAuthGate
 * listens for, clearing the token and returning to the AdminLogin screen.
 *
 * Domain: admin.grantthrive.com
 */

import { useCallback } from 'react';
import { getStoredUser, clearAuth } from '@grantthrive/auth';

export function useAdminAuth() {
  const user = getStoredUser();

  const logout = useCallback(() => {
    clearAuth();
    // Notify AdminAuthGate to return to the login screen
    window.dispatchEvent(new CustomEvent('gt:logout'));
  }, []);

  return {
    user,
    logout,
    isSystemAdmin: user?.role === 'system_admin',
  };
}
