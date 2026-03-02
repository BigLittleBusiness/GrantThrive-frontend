/**
 * AdminAuthGate — GrantThrive Admin Dashboard
 * =============================================
 * Wraps the entire admin dashboard. On mount it verifies the shared SSO token
 * (stored in localStorage under key `gt_auth_token` by @grantthrive/auth).
 *
 * Auth flow:
 *   1. On mount, verify any existing token with the backend.
 *   2. No token / invalid token  → show AdminLogin (dedicated login screen).
 *   3. Valid token, wrong role   → show "Access Denied" screen.
 *   4. Valid token, system_admin → render children (the dashboard).
 *
 * The gate also listens for the custom `gt:logout` event so that the
 * AdminApp can trigger a sign-out from anywhere without prop-drilling.
 *
 * Domain: admin.grantthrive.com
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  verifyToken,
  clearAuth,
  ROLES,
} from '@grantthrive/auth';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';
import AdminLogin from './AdminLogin.jsx';

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" aria-hidden="true" />
        <p className="text-gray-400 text-sm">Verifying credentials…</p>
      </div>
    </div>
  );
}

// ── Access denied screen ──────────────────────────────────────────────────────

function AccessDenied({ user, onLogout }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 border border-red-800 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-red-900/40 rounded-full p-4">
            <AlertTriangle className="w-10 h-10 text-red-400" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-1">
          The GrantThrive Admin Dashboard is restricted to{' '}
          <span className="text-white font-medium">System Administrators</span>.
        </p>
        {user && (
          <p className="text-gray-500 text-sm mt-3 mb-6">
            You are logged in as{' '}
            <span className="text-gray-300">{user.full_name || user.email}</span>{' '}
            with role{' '}
            <span className="text-yellow-400 font-mono">{user.role}</span>.
          </p>
        )}
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Log out and switch account
        </button>
      </div>
    </div>
  );
}

// ── Main gate component ───────────────────────────────────────────────────────

export default function AdminAuthGate({ children }) {
  /**
   * status:
   *   'loading'    — verifying stored token on mount
   *   'login'      — no valid token; show AdminLogin
   *   'authorised' — valid system_admin token; render dashboard
   *   'denied'     — valid token but wrong role; show AccessDenied
   */
  const [status, setStatus] = useState('loading');
  const [user, setUser]     = useState(null);

  // ── Token verification ──────────────────────────────────────────────────────

  const verifyAndRoute = useCallback(async () => {
    setStatus('loading');
    try {
      const verified = await verifyToken();
      if (!verified) {
        setUser(null);
        setStatus('login');
        return;
      }
      setUser(verified);
      setStatus(verified.role === ROLES.SYSTEM_ADMIN ? 'authorised' : 'denied');
    } catch {
      setUser(null);
      setStatus('login');
    }
  }, []);

  useEffect(() => {
    verifyAndRoute();
  }, [verifyAndRoute]);

  // ── Listen for logout events dispatched by the dashboard ───────────────────

  useEffect(() => {
    const handleLogoutEvent = () => handleLogout();
    window.addEventListener('gt:logout', handleLogoutEvent);
    return () => window.removeEventListener('gt:logout', handleLogoutEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Called by AdminLogin after a successful system_admin login.
   * The shared-auth library has already stored the token; we just update state.
   */
  function handleAuthenticated(verifiedUser) {
    setUser(verifiedUser);
    setStatus('authorised');
  }

  function handleLogout() {
    clearAuth();
    setUser(null);
    setStatus('login');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status === 'loading')    return <LoadingScreen />;
  if (status === 'login')      return <AdminLogin onAuthenticated={handleAuthenticated} />;
  if (status === 'denied')     return <AccessDenied user={user} onLogout={handleLogout} />;
  return children;
}
