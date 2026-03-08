/**
 * @grantthrive/auth — Shared SSO Authentication Library
 * =======================================================
 * Single source of truth for authentication across all GrantThrive UI apps:
 *   - admin-apps/portal    (core council platform — all user roles)
 *   - admin-apps/admin     (system_admin only)
 *   - public-apps/map      (public — no auth required)
 *   - public-apps/roi      (public — no auth required)
 *   - public-apps/marketing (public — no auth required)
 *
 * Architecture:
 *   JWT token is stored in localStorage under the key `gt_auth_token`.
 *   All apps on *.grantthrive.com read from the same key, giving seamless
 *   single sign-on across subdomains without a separate auth server.
 *
 *   Login flow:
 *     1. User logs in via the core frontend app (app.grantthrive.com).
 *     2. Backend issues a JWT; this library stores it in localStorage.
 *     3. Any other app (e.g. admin.grantthrive.com) calls `getToken()` on
 *        load — if a valid token exists the user is already authenticated.
 *     4. If no token exists, the app redirects to app.grantthrive.com/login
 *        with a `?redirect=` parameter so the user is sent back after login.
 *
 * Domain: grantthrive.com
 */

// ── Constants ─────────────────────────────────────────────────────────────────

export const TOKEN_KEY      = 'gt_auth_token';
export const USER_KEY       = 'gt_auth_user';
export const API_BASE_URL   = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : 'https://api.grantthrive.com/api';

// The canonical login URL — all apps redirect here when unauthenticated
export const LOGIN_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOGIN_URL
  ? import.meta.env.VITE_LOGIN_URL
  : 'https://app.grantthrive.com/login';

// ── User roles ────────────────────────────────────────────────────────────────

export const ROLES = {
  SYSTEM_ADMIN:           'system_admin',
  COUNCIL_ADMIN:          'council_admin',
  COUNCIL_STAFF:          'council_staff',
  COMMUNITY_MEMBER:       'community_member',
  PROFESSIONAL_CONSULTANT:'professional_consultant',
};

// ── Token storage ─────────────────────────────────────────────────────────────

/**
 * Store the JWT and user profile in localStorage.
 * @param {string} token
 * @param {object} user
 */
export function setAuth(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Retrieve the stored JWT, or null if not present.
 * @returns {string|null}
 */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Retrieve the stored user profile object, or null.
 * @returns {object|null}
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clear all auth data from localStorage (logout).
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Return true if a token is currently stored (does not validate with server).
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getToken();
}

// ── Role helpers ──────────────────────────────────────────────────────────────

/**
 * Return true if the stored user has the given role.
 * @param {string} role
 * @returns {boolean}
 */
export function hasRole(role) {
  const user = getStoredUser();
  return !!(user && user.role === role);
}

export const isSystemAdmin  = () => hasRole(ROLES.SYSTEM_ADMIN);
export const isCouncilAdmin = () => hasRole(ROLES.COUNCIL_ADMIN) || hasRole(ROLES.SYSTEM_ADMIN);
export const isCouncilStaff = () =>
  [ROLES.COUNCIL_ADMIN, ROLES.COUNCIL_STAFF, ROLES.SYSTEM_ADMIN].includes(getStoredUser()?.role);
export const isCommunityMember       = () => hasRole(ROLES.COMMUNITY_MEMBER);
export const isProfessionalConsultant= () => hasRole(ROLES.PROFESSIONAL_CONSULTANT);

// ── HTTP helpers ──────────────────────────────────────────────────────────────

/**
 * Return Authorization headers for API requests.
 * @returns {object}
 */
export function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Make an authenticated API request.
 * @param {string} endpoint  Path relative to API_BASE_URL, e.g. '/grants'
 * @param {object} options   fetch() options
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };
  const response = await fetch(url, config);
  if (response.status === 401) {
    // Token expired or invalid — clear and redirect to login
    clearAuth();
    redirectToLogin();
    return null;
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error ${response.status}`);
  }
  return response.json();
}

// ── Server-side token verification ───────────────────────────────────────────

/**
 * Verify the stored token with the backend and return the user object.
 * Returns null if the token is missing, expired, or invalid.
 * @returns {Promise<object|null>}
 */
export async function verifyToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const data = await apiFetch('/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (data && data.user) {
      // If the backend issued a refreshed token (sliding window for system_admin),
      // store the new token so the session stays alive.
      const activeToken = data.new_token || token;
      setAuth(activeToken, data.user);
      return data.user;
    }
    clearAuth();
    return null;
  } catch {
    clearAuth();
    return null;
  }
}

/**
 * Log in with email and password. Stores token and user on success.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function login(email, password) {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data && data.token && data.user) {
      setAuth(data.token, data.user);
      return { success: true, user: data.user };
    }
    return { success: false, error: 'Login failed — no token returned.' };
  } catch (err) {
    return { success: false, error: err.message || 'Login failed.' };
  }
}

/**
 * Log out: clear local auth state and optionally call the backend.
 * @param {boolean} callBackend  Whether to POST /auth/logout (default true)
 */
export async function logout(callBackend = true) {
  if (callBackend) {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors — always clear local state
    }
  }
  clearAuth();
}

// ── Redirect helpers ──────────────────────────────────────────────────────────

/**
 * Redirect to the central login page, preserving the current URL as ?redirect=
 */
export function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const current = encodeURIComponent(window.location.href);
  window.location.href = `${LOGIN_URL}?redirect=${current}`;
}

/**
 * After a successful login, redirect back to the URL stored in ?redirect=,
 * or fall back to the provided default.
 * @param {string} defaultUrl
 */
export function redirectAfterLogin(defaultUrl = '/') {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  window.location.href = redirect ? decodeURIComponent(redirect) : defaultUrl;
}

// ── React hook (optional — only used in React apps) ───────────────────────────

/**
 * useGrantThriveAuth — React hook providing auth state and actions.
 *
 * Usage:
 *   import { useGrantThriveAuth } from '@grantthrive/auth/react';
 *
 * Returns: { user, loading, isAuthenticated, login, logout, hasRole }
 */
export function useGrantThriveAuth() {
  // Dynamic import of React to avoid hard dependency for non-React consumers
  let useState, useEffect, useCallback;
  try {
    const React = require('react');
    useState    = React.useState;
    useEffect   = React.useEffect;
    useCallback = React.useCallback;
  } catch {
    throw new Error('@grantthrive/auth: useGrantThriveAuth requires React.');
  }

  const [user, setUser]       = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    verifyToken().then((verifiedUser) => {
      if (!cancelled) {
        setUser(verifiedUser);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleLogin = useCallback(async (email, password) => {
    const result = await login(email, password);
    if (result.success) setUser(result.user);
    return result;
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login:  handleLogin,
    logout: handleLogout,
    hasRole: (role) => !!(user && user.role === role),
    isSystemAdmin:           () => !!(user && user.role === ROLES.SYSTEM_ADMIN),
    isCouncilAdmin:          () => !!(user && [ROLES.COUNCIL_ADMIN, ROLES.SYSTEM_ADMIN].includes(user.role)),
    isCouncilStaff:          () => !!(user && [ROLES.COUNCIL_ADMIN, ROLES.COUNCIL_STAFF, ROLES.SYSTEM_ADMIN].includes(user.role)),
    isCommunityMember:       () => !!(user && user.role === ROLES.COMMUNITY_MEMBER),
    isProfessionalConsultant:() => !!(user && user.role === ROLES.PROFESSIONAL_CONSULTANT),
  };
}
