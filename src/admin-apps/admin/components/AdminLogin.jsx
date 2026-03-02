/**
 * AdminLogin — GrantThrive System Administration
 * ================================================
 * Dedicated login screen for system_admin users only.
 *
 * Features:
 *  - Calls the real backend via @grantthrive/auth login()
 *  - Role guard: only system_admin tokens are accepted after login
 *  - Client-side rate limiting (5 attempts → 15-minute lockout)
 *  - Countdown timer displayed during lockout
 *  - Show/hide password toggle
 *  - "Remember me" persists the email in localStorage
 *  - Accessible: proper aria-labels, focus management, keyboard submit
 *  - Dark background to visually distinguish from the general portal login
 *
 * Domain: admin.grantthrive.com  →  /admin/login
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  LogIn,
} from 'lucide-react';
import { login, ROLES, setAuth } from '@grantthrive/auth';
import logoSrc from '../assets/grantthrive_official_logo.png';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS      = 5;          // failed attempts before lockout
const LOCKOUT_SECONDS   = 15 * 60;    // 15 minutes in seconds
const REMEMBER_KEY      = 'gt_admin_remember_email';
const LOCKOUT_UNTIL_KEY = 'gt_admin_lockout_until';
const ATTEMPT_COUNT_KEY = 'gt_admin_attempt_count';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getLockoutState() {
  try {
    const until   = parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || '0', 10);
    const count   = parseInt(localStorage.getItem(ATTEMPT_COUNT_KEY) || '0', 10);
    const now     = Date.now();
    const locked  = until > now;
    const remaining = locked ? Math.ceil((until - now) / 1000) : 0;
    return { locked, remaining, count, until };
  } catch {
    return { locked: false, remaining: 0, count: 0, until: 0 };
  }
}

function recordFailedAttempt() {
  try {
    const count = parseInt(localStorage.getItem(ATTEMPT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(ATTEMPT_COUNT_KEY, String(count));
    if (count >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_SECONDS * 1000;
      localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until));
    }
    return count;
  } catch {
    return 1;
  }
}

function clearLockout() {
  try {
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
    localStorage.removeItem(ATTEMPT_COUNT_KEY);
  } catch { /* ignore */ }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminLogin({ onAuthenticated }) {
  // Form state
  const [email, setEmail]               = useState(() => {
    try { return localStorage.getItem(REMEMBER_KEY) || ''; } catch { return ''; }
  });
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(() => {
    try { return !!localStorage.getItem(REMEMBER_KEY); } catch { return false; }
  });
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [status, setStatus]             = useState('idle'); // idle | loading | success | error | locked | wrong_role
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown]       = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);

  const countdownRef  = useRef(null);
  const emailRef      = useRef(null);
  const passwordRef   = useRef(null);

  // ── Lockout timer ────────────────────────────────────────────────────────────

  const startCountdown = useCallback((seconds) => {
    setCountdown(seconds);
    setStatus('locked');
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          clearLockout();
          setStatus('idle');
          setAttemptsLeft(MAX_ATTEMPTS);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── On mount: restore lockout state ─────────────────────────────────────────

  useEffect(() => {
    const { locked, remaining, count } = getLockoutState();
    if (locked) {
      setAttemptsLeft(0);
      startCountdown(remaining);
    } else {
      setAttemptsLeft(Math.max(0, MAX_ATTEMPTS - count));
    }
    // Focus email field on mount (unless locked)
    if (!locked && emailRef.current) {
      const target = email ? passwordRef.current : emailRef.current;
      target?.focus();
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit handler ───────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading' || status === 'locked' || status === 'success') return;

    // Re-check lockout in case the timer just expired
    const lockState = getLockoutState();
    if (lockState.locked) {
      startCountdown(lockState.remaining);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        // Increment failed attempt counter
        const newCount = recordFailedAttempt();
        const remaining = MAX_ATTEMPTS - newCount;

        if (remaining <= 0) {
          startCountdown(LOCKOUT_SECONDS);
          setAttemptsLeft(0);
          setErrorMessage(
            `Too many failed attempts. Your access has been locked for 15 minutes.`
          );
          setStatus('locked');
        } else {
          setAttemptsLeft(remaining);
          setErrorMessage(
            result.error || 'Invalid email or password. Please try again.'
          );
          setStatus('error');
          passwordRef.current?.focus();
        }
        return;
      }

      // ── Role guard ────────────────────────────────────────────────────────────
      if (result.user?.role !== ROLES.SYSTEM_ADMIN) {
        // Clear the token — this user has no business here
        setAuth(null, null);
        try {
          localStorage.removeItem('gt_auth_token');
          localStorage.removeItem('gt_auth_user');
        } catch { /* ignore */ }

        setStatus('wrong_role');
        setErrorMessage(
          `Access denied. The GrantThrive Admin Dashboard is restricted to ` +
          `System Administrators. Your account role is "${result.user?.role || 'unknown'}".`
        );
        passwordRef.current?.focus();
        return;
      }

      // ── Success ───────────────────────────────────────────────────────────────
      clearLockout();

      if (rememberMe) {
        try { localStorage.setItem(REMEMBER_KEY, email.trim()); } catch { /* ignore */ }
      } else {
        try { localStorage.removeItem(REMEMBER_KEY); } catch { /* ignore */ }
      }

      setStatus('success');

      // Brief success flash before handing off
      setTimeout(() => {
        onAuthenticated(result.user);
      }, 800);

    } catch (err) {
      const newCount = recordFailedAttempt();
      const remaining = MAX_ATTEMPTS - newCount;

      if (remaining <= 0) {
        startCountdown(LOCKOUT_SECONDS);
        setAttemptsLeft(0);
        setStatus('locked');
        setErrorMessage('Too many failed attempts. Your access has been locked for 15 minutes.');
      } else {
        setAttemptsLeft(remaining);
        setStatus('error');
        setErrorMessage(
          err.message === 'Too many requests. Please try again later.'
            ? 'The server is rate-limiting requests. Please wait a moment and try again.'
            : err.message || 'An unexpected error occurred. Please try again.'
        );
        passwordRef.current?.focus();
      }
    }
  };

  // ── Derived UI flags ─────────────────────────────────────────────────────────

  const isLocked    = status === 'locked';
  const isLoading   = status === 'loading';
  const isSuccess   = status === 'success';
  const hasError    = status === 'error' || status === 'wrong_role';
  const isDisabled  = isLocked || isLoading || isSuccess;
  const showWarning = !isLocked && !isSuccess && attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">

      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"
      />

      <div className="relative w-full max-w-md">

        {/* ── Logo & heading ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logoSrc}
            alt="GrantThrive"
            className="h-14 w-auto mb-4 drop-shadow-lg"
            draggable={false}
          />
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            Admin Sign In
          </h1>
          <p className="text-gray-400 text-sm text-center mt-1">
            Restricted to authorised system administrators only
          </p>
        </div>

        {/* ── Card ───────────────────────────────────────────────────────────── */}
        <Card className="bg-gray-900 border border-gray-800 shadow-2xl">
          <CardContent className="p-8">

            {/* ── Success banner ─────────────────────────────────────────────── */}
            {isSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-3 bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 mb-6"
              >
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" aria-hidden="true" />
                <p className="text-green-300 text-sm font-medium">
                  Authenticated. Redirecting to dashboard…
                </p>
              </div>
            )}

            {/* ── Lockout banner ─────────────────────────────────────────────── */}
            {isLocked && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 bg-red-900/30 border border-red-800 rounded-lg px-4 py-4 mb-6"
              >
                <Clock className="w-5 h-5 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-red-300 text-sm font-semibold mb-1">
                    Account temporarily locked
                  </p>
                  <p className="text-red-400 text-xs">
                    Too many failed attempts. Please wait{' '}
                    <span className="font-mono font-bold text-red-300">
                      {formatCountdown(countdown)}
                    </span>{' '}
                    before trying again.
                  </p>
                </div>
              </div>
            )}

            {/* ── Error / wrong-role banner ───────────────────────────────────── */}
            {hasError && !isLocked && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 mb-6"
              >
                {status === 'wrong_role'
                  ? <Shield className="w-5 h-5 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                  : <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                }
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* ── Attempts warning ────────────────────────────────────────────── */}
            {showWarning && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-3 bg-yellow-900/30 border border-yellow-800 rounded-lg px-4 py-3 mb-6"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" aria-hidden="true" />
                <p className="text-yellow-300 text-xs">
                  {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before your
                  account is locked for 15 minutes.
                </p>
              </div>
            )}

            {/* ── Login form ──────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate aria-label="Admin sign-in form">

              {/* Email */}
              <div className="mb-5">
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="admin-email"
                    ref={emailRef}
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@grantthrive.com"
                    required
                    disabled={isDisabled}
                    aria-required="true"
                    aria-describedby={hasError ? 'admin-login-error' : undefined}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="admin-password"
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isDisabled}
                    aria-required="true"
                    className="pl-10 pr-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    disabled={isDisabled}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors disabled:pointer-events-none"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                      : <Eye    className="w-4 h-4" aria-hidden="true" />
                    }
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2 mb-6">
                <input
                  id="admin-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isDisabled}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/20 cursor-pointer"
                />
                <label
                  htmlFor="admin-remember"
                  className="text-sm text-gray-400 cursor-pointer select-none"
                >
                  Remember my email on this device
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isDisabled || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isLoading ? 'Signing in…' : 'Sign in to Admin Dashboard'}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Verifying credentials…
                  </span>
                ) : isSuccess ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    Authenticated
                  </span>
                ) : isLocked ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    Locked — {formatCountdown(countdown)}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    Sign In to Admin Dashboard
                  </span>
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* ── Security notice ─────────────────────────────────────────────────── */}
        <div className="mt-6 flex items-start gap-3 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-4">
          <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="text-gray-300 font-medium">Authorised access only.</span>{' '}
              All login attempts are logged and monitored. Unauthorised access or
              attempted access is a violation of the GrantThrive Terms of Service
              and may be subject to legal action.
            </p>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-600 mt-6">
          &copy; {new Date().getFullYear()} GrantThrive &mdash; System Administration Portal
        </p>

      </div>
    </div>
  );
}
