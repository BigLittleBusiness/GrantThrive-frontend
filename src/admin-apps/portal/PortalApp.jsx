import React, { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from './utils/api.js';
import { TenantProvider, useTenant } from '@shared/tenancy/TenantContext';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import Login from './pages/Login.jsx';
import Registration from './pages/Registration.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import CouncilAdminRoutes from './routes/CouncilAdminRoutes.jsx';
import CouncilStaffRoutes from './routes/CouncilStaffRoutes.jsx';
import CommunityRoutes from './routes/CommunityRoutes.jsx';

// ── RBAC constants ────────────────────────────────────────────────────────────
const ROLES = {
  COUNCIL_ADMIN: 'council_admin',
  COUNCIL_STAFF: 'council_staff',
  COMMUNITY_MEMBER: 'community_member',
};

const ROLE_HOME = {
  [ROLES.COUNCIL_ADMIN]: '/portal/council/dashboard',
  [ROLES.COUNCIL_STAFF]: '/portal/staff/dashboard',
  [ROLES.COMMUNITY_MEMBER]: '/portal/community/dashboard',
};

function getUserRole(user) {
  return user?.role || user?.userType || null;
}

function isAllowedRole(user, allowedRoles = []) {
  const role = getUserRole(user);
  return allowedRoles.includes(role);
}

// ── Simple access denied screen ──────────────────────────────────────────────
function AccessDenied({ onLogout }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-red-700">Access denied</h1>
        <p className="mt-3 text-sm text-gray-600">
          You do not have permission to access this section.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Route guard ───────────────────────────────────────────────────────────────
function ProtectedRoute({ user, allowedRoles, onLogout, children }) {
  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }

  if (!isAllowedRole(user, allowedRoles)) {
    return <AccessDenied onLogout={onLogout} />;
  }

  return children;
}

// ── Inner app (has access to TenantContext) ──────────────────────────────────
function PortalInner() {
  const { council, isLoading: tenantLoading } = useTenant();
  const [currentUser, setCurrentUser] = useState(null);
  // authInitialised prevents the auth guards from firing before localStorage
  // has been read — avoids a race condition where currentUser is briefly null
  // on first render even when a valid session exists.
  const [authInitialised, setAuthInitialised] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('gt_auth_user');
    const storedToken = localStorage.getItem('gt_auth_token');

    if (storedUser && storedToken) {
      // Validate the stored token against the backend before trusting it.
      // This prevents a stale/expired session from auto-redirecting to the dashboard.
      apiClient.setToken(storedToken);
      apiClient.verifyToken()
        .then((verifiedUser) => {
          if (verifiedUser) {
            // Token is valid — restore the session
            try {
              setCurrentUser(JSON.parse(storedUser));
            } catch {
              localStorage.removeItem('gt_auth_user');
              localStorage.removeItem('gt_auth_token');
            }
          } else {
            // Token is invalid or expired — clear the stale session
            localStorage.removeItem('gt_auth_user');
            localStorage.removeItem('gt_auth_token');
            apiClient.setToken(null);
          }
        })
        .catch(() => {
          // Network error during verification — clear session to be safe
          localStorage.removeItem('gt_auth_user');
          localStorage.removeItem('gt_auth_token');
          apiClient.setToken(null);
        })
        .finally(() => {
          setAuthInitialised(true);
        });
    } else {
      // No stored session — mark as initialised immediately
      setAuthInitialised(true);
    }
  }, []);

  useEffect(() => {
    const handleGlobalLogout = () => {
      localStorage.removeItem('gt_auth_token');
      localStorage.removeItem('gt_auth_user');
      setCurrentUser(null);
      navigate('/portal/login', { replace: true });
    };

    window.addEventListener('gt:logout', handleGlobalLogout);
    return () => window.removeEventListener('gt:logout', handleGlobalLogout);
  }, [navigate]);

  const handleLogin = useCallback(
    (userData) => {
      localStorage.setItem('gt_auth_user', JSON.stringify(userData));
      setCurrentUser(userData);

      const nextRole = getUserRole(userData);
      navigate(ROLE_HOME[nextRole] || '/portal/community/dashboard', {
        replace: true,
      });
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('gt_auth_token');
    localStorage.removeItem('gt_auth_user');
    setCurrentUser(null);
    navigate('/portal/login', { replace: true });
  }, [navigate]);

  const role = useMemo(() => getUserRole(currentUser), [currentUser]);

  const isAuthRoute = useMemo(
    () =>
      location.pathname === '/portal/login' ||
      location.pathname === '/portal/register' ||
      location.pathname === '/portal/forgot-password' ||
      location.pathname === '/portal/reset-password',
    [location.pathname]
  );

  // Build a role-aware navigation helper so dashboard components can navigate
  // using short keys like 'staff-management' rather than full paths.
  // An optional second argument `state` is forwarded as React Router location state.
  const handleNavigate = useCallback(
    (key, state) => {
      const opts = state ? { state } : undefined;

      if (key.includes('/')) {
        navigate(`/portal/${key}`, opts);
        return;
      }

      const prefix =
        role === ROLES.COUNCIL_ADMIN
          ? 'council'
          : role === ROLES.COUNCIL_STAFF
            ? 'staff'
            : 'community';

      navigate(`/portal/${prefix}/${key}`, opts);
    },
    [navigate, role]
  );

  const pageProps = useMemo(
    () => ({
      user: currentUser,
      council,
      onLogout: handleLogout,
      onNavigate: handleNavigate,
      onUpdateUser: (updatedUser) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('gt_auth_user', JSON.stringify(updatedUser));
      },
    }),
    [currentUser, council, handleLogout, handleNavigate]
  );

  // Do not render auth guards until both the tenant and the auth session
  // have been fully resolved. This prevents the login-redirect race condition.
  if (tenantLoading || !authInitialised) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !isAuthRoute) {
    return <Navigate to="/portal/login" replace />;
  }

  if (currentUser && isAuthRoute) {
    return (
      <Navigate
        to={ROLE_HOME[role] || '/portal/community/dashboard'}
        replace
      />
    );
  }

  return (
    <Routes>
      {/* Auth */}
      <Route
        path="login"
        element={<Login council={council} onLogin={handleLogin} />}
      />
      <Route
        path="register"
        element={<Registration council={council} onLogin={handleLogin} />}
      />
      <Route
        path="forgot-password"
        element={<ForgotPassword council={council} />}
      />
      <Route
        path="reset-password"
        element={<ResetPassword council={council} />}
      />

      {/* Generic /portal entry */}
      <Route
        index
        element={
          currentUser ? (
            <Navigate
              to={ROLE_HOME[role] || '/portal/community/dashboard'}
              replace
            />
          ) : (
            <Navigate to="/portal/login" replace />
          )
        }
      />

      {/* Role-based route groups */}
      {CouncilAdminRoutes({
        ProtectedRoute,
        currentUser,
        handleLogout,
        pageProps,
        ROLES,
      })}

      {CouncilStaffRoutes({
        ProtectedRoute,
        currentUser,
        handleLogout,
        pageProps,
        ROLES,
      })}

      {CommunityRoutes({
        ProtectedRoute,
        currentUser,
        handleLogout,
        pageProps,
        ROLES,
      })}

      {/* Fallback */}
      <Route
        path="*"
        element={
          currentUser ? (
            <Navigate
              to={ROLE_HOME[role] || '/portal/community/dashboard'}
              replace
            />
          ) : (
            <Navigate to="/portal/login" replace />
          )
        }
      />
    </Routes>
  );
}

// ── Root export ──────────────────────────────────────────────────────────────
export default function PortalApp() {
  return (
    <TenantProvider>
      <PortalInner />
    </TenantProvider>
  );
}