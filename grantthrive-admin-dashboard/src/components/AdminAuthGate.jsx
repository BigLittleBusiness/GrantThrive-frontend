/**
 * AdminAuthGate — GrantThrive Admin Dashboard
 * =============================================
 * Wraps the entire admin dashboard. On mount it verifies the shared SSO token
 * (stored in localStorage under key `gt_auth_token` by @grantthrive/auth).
 *
 * Access rules:
 *   - No token present       → redirect to app.grantthrive.com/login
 *   - Valid token, wrong role → show "Access Denied" screen
 *   - Valid token, system_admin role → render children (the dashboard)
 *
 * Domain: grantthrive.com
 */

import React, { useState, useEffect } from 'react';
import {
  verifyToken,
  clearAuth,
  ROLES,
  LOGIN_URL,
} from '@grantthrive/auth';
import { Shield, Loader2, AlertTriangle, LogOut } from 'lucide-react';

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
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
            <AlertTriangle className="w-10 h-10 text-red-400" />
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
          <LogOut className="w-4 h-4" />
          Log out and switch account
        </button>
      </div>
    </div>
  );
}

// ── Main gate component ───────────────────────────────────────────────────────

export default function AdminAuthGate({ children }) {
  const [status, setStatus]   = useState('loading'); // 'loading' | 'authorised' | 'denied'
  const [user, setUser]       = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const verified = await verifyToken();

      if (cancelled) return;

      if (!verified) {
        // No valid token — redirect to the shared login page
        const redirect = encodeURIComponent(window.location.href);
        window.location.href = `${LOGIN_URL}?redirect=${redirect}`;
        return;
      }

      setUser(verified);

      if (verified.role === ROLES.SYSTEM_ADMIN) {
        setStatus('authorised');
      } else {
        setStatus('denied');
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  function handleLogout() {
    clearAuth();
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = `${LOGIN_URL}?redirect=${redirect}`;
  }

  if (status === 'loading')    return <LoadingScreen />;
  if (status === 'denied')     return <AccessDenied user={user} onLogout={handleLogout} />;
  return children;
}
