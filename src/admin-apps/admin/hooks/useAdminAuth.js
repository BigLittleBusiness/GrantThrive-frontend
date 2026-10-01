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
 * listens for, returning to the AdminLogin screen.
 */

import { useCallback } from 'react';
import { getStoredUser } from '@shared/auth';
import { logout as endSession } from '@shared/api/session';

export function useAdminAuth() {
  const user = getStoredUser();

  const logout = useCallback(async () => {
    // The dedicated admin endpoint writes an audit event.
    await endSession('/admin/logout');
    window.dispatchEvent(new CustomEvent('gt:logout'));
  }, []);

  return {
    user,
    logout,
    isSystemAdmin: user?.role === 'system_admin',
  };
}
