import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import CouncilAdminRoutes from './routes/role-based/CouncilAdminRoutes.jsx';
import CouncilStaffRoutes from './routes/role-based/CouncilStaffRoutes.jsx';
import CommunityRoutes from './routes/role-based/CommunityRoutes.jsx';

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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('gt_auth_user');
    const storedToken = localStorage.getItem('gt_auth_token');

    if (storedUser && storedToken) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('gt_auth_user');
        localStorage.removeItem('gt_auth_token');
      }
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

      const role = getUserRole(userData);
      navigate(ROLE_HOME[role] || '/portal/community/dashboard', {
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
      location.pathname === '/portal/register',
    [location.pathname]
  );

<<<<<<< Updated upstream
  // Build a role-aware navigation helper so dashboard components can navigate
  // using short keys like 'staff-management' rather than full paths.
  // An optional second argument `state` is forwarded as React Router location state.
  const handleNavigate = useCallback((key, state) => {
    const opts = state ? { state } : undefined;
    if (key.includes('/')) {
      navigate(`/portal/${key}`, opts);
      return;
    }
=======
  const handleNavigate = useCallback(
    (key) => {
      if (key.includes('/')) {
        navigate(`/portal/${key}`);
        return;
      }
>>>>>>> Stashed changes

      const prefix =
        role === ROLES.COUNCIL_ADMIN
          ? 'council'
          : role === ROLES.COUNCIL_STAFF
            ? 'staff'
            : 'community';

<<<<<<< Updated upstream
    navigate(`/portal/${prefix}/${key}`, opts);
  }, [navigate, role]);
=======
      navigate(`/portal/${prefix}/${key}`);
    },
    [navigate, role]
  );
>>>>>>> Stashed changes

  const pageProps = useMemo(
    () => ({
      user: currentUser,
      council,
      onLogout: handleLogout,
      onNavigate: handleNavigate,
    }),
    [currentUser, council, handleLogout, handleNavigate]
  );

  if (tenantLoading) {
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
      <CouncilAdminRoutes
        ProtectedRoute={ProtectedRoute}
        currentUser={currentUser}
        handleLogout={handleLogout}
        pageProps={pageProps}
        ROLES={ROLES}
      />

      <CouncilStaffRoutes
        ProtectedRoute={ProtectedRoute}
        currentUser={currentUser}
        handleLogout={handleLogout}
        pageProps={pageProps}
        ROLES={ROLES}
      />

      <CommunityRoutes
        ProtectedRoute={ProtectedRoute}
        currentUser={currentUser}
        handleLogout={handleLogout}
        pageProps={pageProps}
        ROLES={ROLES}
      />

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