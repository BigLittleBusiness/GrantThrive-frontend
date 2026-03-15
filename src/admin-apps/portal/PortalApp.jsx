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
import AdminApprovalDashboard from './routes/council-admin/AdminApprovalDashboard.jsx';

import CouncilAdminDashboard from './routes/council-admin/CouncilAdminDashboard.jsx';
import CouncilStaffDashboard from './routes/council-staff/CouncilStaffDashboard.jsx';
import CommunityMemberDashboard from './routes/community/CommunityMemberDashboard.jsx';

import GrantsListing from './routes/community/GrantsListing.jsx';
import GrantDetails from './routes/community/GrantDetails.jsx';
import ApplicationForm from './routes/community/ApplicationForm.jsx';
import CommunityForum from './routes/community/CommunityForum.jsx';
import ResourceHub from './routes/community/ResourceHub.jsx';
import WinnersShowcase from './routes/community/WinnersShowcase.jsx';
import GrantCreationWizard from './routes/council-admin/GrantCreationWizard.jsx';
import CommunicationSettings from './routes/council-admin/CommunicationSettings.jsx';
import QRCodeManagement from './routes/council-admin/QRCodeManagement.jsx';
import CommunityVoting from './routes/community/CommunityVoting.jsx';
import PublicGrantMap from './routes/community/PublicGrantMap.jsx';
import StaffManagement from './routes/council-admin/StaffManagement.jsx';
import AccountBilling from './routes/council-admin/AccountBilling.jsx';
import CouncilAdminProfile from './routes/council-admin/Profile.jsx';
import CouncilStaffProfile from './routes/council-staff/Profile.jsx';
import PendingApprovals from './routes/council-staff/PendingApprovals.jsx';
import PricingPage from './routes/council-admin/PricingPage.jsx';
import TransparencyDashboard from './routes/community/TransparencyDashboard.jsx';
import PublicResults from './routes/community/PublicResults.jsx';

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

  const handleLogin = useCallback((userData) => {
    localStorage.setItem('gt_auth_user', JSON.stringify(userData));
    setCurrentUser(userData);

    const role = getUserRole(userData);
    navigate(ROLE_HOME[role] || '/portal/community/dashboard', { replace: true });
  }, [navigate]);

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

  // Build a role-aware navigation helper so dashboard components can navigate
  // using short keys like 'staff-management' rather than full paths.
  const handleNavigate = useCallback((key) => {
    if (key.includes('/')) {
      navigate(`/portal/${key}`);
      return;
    }

    const prefix =
      role === ROLES.COUNCIL_ADMIN
        ? 'council'
        : role === ROLES.COUNCIL_STAFF
          ? 'staff'
          : 'community';

    navigate(`/portal/${prefix}/${key}`);
  }, [navigate, role]);

  const pageProps = useMemo(
    () => ({
      user: currentUser,
      council,
      onLogout: handleLogout,
      onNavigate: handleNavigate,
    }),
    [currentUser, council, handleLogout, handleNavigate]
  );

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

  // If not logged in, only allow auth routes
  if (!currentUser && !isAuthRoute) {
    return <Navigate to="/portal/login" replace />;
  }

  // If logged in and user lands on auth pages, redirect to correct dashboard
  if (currentUser && isAuthRoute) {
    return <Navigate to={ROLE_HOME[role] || '/portal/community/dashboard'} replace />;
  }

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
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <StaffManagement {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/account-billing"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <AccountBilling {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/profile"
        element={
          <ProtectedRoute user={currentUser} allowedRoles={[ROLES.COUNCIL_ADMIN]} onLogout={handleLogout}>
            <CouncilAdminProfile {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/community-forum"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <CommunityForum {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/pricing"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <PricingPage {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="council/pending-approvals"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <PendingApprovals {...pageProps} />
          </ProtectedRoute>
        }
      />

      {/* ── Council Staff Routes ─────────────────────────────────────────────── */}
      <Route
        path="staff/dashboard"
        element={
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
            <CouncilStaffProfile {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/pending-approvals"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <PendingApprovals {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="staff/community-forum"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <CommunityForum {...pageProps} />
          </ProtectedRoute>
        }
      />

      {/* ── Community Member Routes ───────────────────────────────────── */}
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

      <Route
        path="community/transparency"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <TransparencyDashboard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community/public-results"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COMMUNITY_MEMBER]}
            onLogout={handleLogout}
          >
            <PublicResults {...pageProps} />
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