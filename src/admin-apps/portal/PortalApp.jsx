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
import AdminApprovalDashboard from './pages/AdminApprovalDashboard.jsx';

import CouncilAdminDashboard from './dashboards/CouncilAdminDashboard.jsx';
import CouncilStaffDashboard from './dashboards/CouncilStaffDashboard.jsx';
import CommunityMemberDashboard from './dashboards/CommunityMemberDashboard.jsx';

import GrantsListing from './pages/GrantsListing.jsx';
import GrantDetails from './pages/GrantDetails.jsx';
import ApplicationForm from './pages/ApplicationForm.jsx';
import CommunityForum from './pages/CommunityForum.jsx';
import ResourceHub from './pages/ResourceHub.jsx';
import WinnersShowcase from './pages/WinnersShowcase.jsx';
import GrantCreationWizard from './pages/GrantCreationWizard.jsx';
import CommunicationSettings from './pages/CommunicationSettings.jsx';
import QRCodeManagement from './pages/QRCodeManagement.jsx';
import CommunityVoting from './pages/CommunityVoting.jsx';
import PublicGrantMap from './pages/PublicGrantMap.jsx';
import StaffManagement from './pages/StaffManagement.jsx';
import AccountBilling from './pages/AccountBilling.jsx';
import Profile from './pages/Profile.jsx';
import PendingApprovals from './pages/PendingApprovals.jsx';
import PricingPage from './pages/PricingPage.jsx';

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

  // Restore session from localStorage on mount
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

  // Listen for global logout events
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

  const handleLogin = (userData) => {
    localStorage.setItem('gt_auth_user', JSON.stringify(userData));
    setCurrentUser(userData);

    const role = getUserRole(userData);
    navigate(ROLE_HOME[role] || '/portal/community/dashboard', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('gt_auth_token');
    localStorage.removeItem('gt_auth_user');
    setCurrentUser(null);
    navigate('/portal/login', { replace: true });
  };

  const role = useMemo(() => getUserRole(currentUser), [currentUser]);

  // Show a minimal loading screen while the tenant is being resolved
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

  const isAuthRoute =
    location.pathname === '/portal/login' ||
    location.pathname === '/portal/register';

  // If not logged in, only allow auth routes
  if (!currentUser && !isAuthRoute) {
    return <Navigate to="/portal/login" replace />;
  }

  // If logged in and user lands on auth pages, redirect to correct dashboard
  if (currentUser && isAuthRoute) {
    return <Navigate to={ROLE_HOME[role] || '/portal/community/dashboard'} replace />;
  }

  // Build a role-aware navigation helper so dashboard components can navigate
  // using short keys like 'staff-management' rather than full paths.
  const handleNavigate = useCallback((key) => {
    // If the key already contains a slash, treat it as a full portal-relative path
    if (key.includes('/')) {
      navigate(`/portal/${key}`);
      return;
    }
    // Otherwise prefix with the role segment
    const prefix =
      role === ROLES.COUNCIL_ADMIN   ? 'council' :
      role === ROLES.COUNCIL_STAFF   ? 'staff'   :
      role === ROLES.COMMUNITY_MEMBER ? 'community' : 'community';
    navigate(`/portal/${prefix}/${key}`);
  }, [navigate, role]);

  const pageProps = {
    user: currentUser,
    council,
    onLogout: handleLogout,
    onNavigate: handleNavigate,
  };

  return (
    <Routes>
      {/* Auth routes */}
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
            <Navigate to={ROLE_HOME[role] || '/portal/community/dashboard'} replace />
          ) : (
            <Navigate to="/portal/login" replace />
          )
        }
      />

      {/* ── Council Admin Routes ───────────────────────────────────────── */}
      <Route
        path="council/dashboard"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <CouncilAdminDashboard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/admin-approvals"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <AdminApprovalDashboard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/create-grant"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <GrantCreationWizard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/grants"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <GrantsListing {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/grant-details"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <GrantDetails {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/communication-settings"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <CommunicationSettings {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/qr-code-management"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <QRCodeManagement {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/community-voting"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <CommunityVoting {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/grant-map"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <PublicGrantMap {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/resource-hub"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <ResourceHub {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/staff-management"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_ADMIN]} onLogout={handleLogout}>
            <StaffManagement {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="council/account-billing"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_ADMIN]} onLogout={handleLogout}>
            <AccountBilling {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="council/profile"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_ADMIN]} onLogout={handleLogout}>
            <Profile {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="council/community-forum"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_ADMIN]} onLogout={handleLogout}>
            <CommunityForum {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="council/pricing"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_ADMIN]} onLogout={handleLogout}>
            <PricingPage {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="council/pending-approvals"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_ADMIN]} onLogout={handleLogout}>
            <PendingApprovals {...pageProps} />
          </ProtectedRoute>
        }
      />

      {/* ── Council Staff Routes ─────────────────────────────────────────────── */}
      <Route
        path="staff/dashboard"   element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <CouncilStaffDashboard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/grants"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <GrantsListing {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/grant-details"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <GrantDetails {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/admin-approvals"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <AdminApprovalDashboard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/community-voting"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <CommunityVoting {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/grant-map"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <PublicGrantMap {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/resource-hub"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <ResourceHub {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="staff/profile"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_STAFF]} onLogout={handleLogout}>
            <Profile {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="staff/pending-approvals"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_STAFF]} onLogout={handleLogout}>
            <PendingApprovals {...pageProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="staff/community-forum"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_STAFF]} onLogout={handleLogout}>
            <CommunityForum {...pageProps} />
          </ProtectedRoute>
        }
      />

      {/* ── Community Member Routes ─────────────────────────────────────────────── */}
      <Route
        path="community/dashboard"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <CommunityMemberDashboard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/grants"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <GrantsListing {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/grant-details"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <GrantDetails {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/application-form"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <ApplicationForm {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/community-forum"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <CommunityForum {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/resource-hub"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <ResourceHub {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/winners-showcase"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <WinnersShowcase {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/community-voting"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <CommunityVoting {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/grant-map"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <PublicGrantMap {...pageProps} />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={
          currentUser ? (
            <Navigate to={ROLE_HOME[role] || '/portal/community/dashboard'} replace />
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