import React, { useEffect, useState } from 'react';
import { TenantProvider, useTenant } from '@shared/tenancy/TenantContext';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import Login from './pages/Login.jsx';
import Registration from './pages/Registration.jsx';
import AdminApprovalDashboard from './pages/AdminApprovalDashboard.jsx';

import CouncilAdminDashboard from './dashboards/CouncilAdminDashboard.jsx';
import CouncilStaffDashboard from './dashboards/CouncilStaffDashboard.jsx';
import CommunityMemberDashboard from './dashboards/CommunityMemberDashboard.jsx';
import ProfessionalConsultantDashboard from './dashboards/ProfessionalConsultantDashboard.jsx';

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

// ── Inner app (has access to TenantContext) ───────────────────────────────────
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

  // Listen for global logout events (dispatched by useTenantApi on 401)
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
    navigate('/portal/dashboard', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('gt_auth_token');
    localStorage.removeItem('gt_auth_user');
    setCurrentUser(null);
    navigate('/portal/login', { replace: true });
  };

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

  // Guard: If not logged in, only allow auth routes
  if (!currentUser && !isAuthRoute) {
    return <Navigate to="/portal/login" replace />;
  }

  const pageProps = { user: currentUser, council, onLogout: handleLogout };

  const Dashboard = () => {
    const role = currentUser?.role || currentUser?.userType;

    switch (role) {
      case 'council_admin':
        return <CouncilAdminDashboard {...pageProps} />;
      case 'council_staff':
        return <CouncilStaffDashboard {...pageProps} />;
      case 'community_member':
        return <CommunityMemberDashboard {...pageProps} />;
      case 'professional_consultant':
        return <ProfessionalConsultantDashboard {...pageProps} />;
      default:
        return <CommunityMemberDashboard {...pageProps} />;
    }
  };

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="login" element={<Login council={council} onLogin={handleLogin} />} />
      <Route path="register" element={<Registration council={council} onLogin={handleLogin} />} />

      {/* App routes */}
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="admin-approvals" element={<AdminApprovalDashboard {...pageProps} />} />
      <Route path="create-grant" element={<GrantCreationWizard {...pageProps} />} />
      <Route path="grants" element={<GrantsListing {...pageProps} />} />
      <Route path="grant-details" element={<GrantDetails {...pageProps} />} />
      <Route path="application-form" element={<ApplicationForm {...pageProps} />} />
      <Route path="community-forum" element={<CommunityForum {...pageProps} />} />
      <Route path="resource-hub" element={<ResourceHub {...pageProps} />} />
      <Route path="winners-showcase" element={<WinnersShowcase {...pageProps} />} />
      <Route path="communication-settings" element={<CommunicationSettings {...pageProps} />} />
      <Route path="qr-code-management" element={<QRCodeManagement {...pageProps} />} />
      <Route path="community-voting" element={<CommunityVoting {...pageProps} />} />
      <Route path="grant-map" element={<PublicGrantMap {...pageProps} />} />

      {/* Default under /portal */}
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function PortalApp() {
  return (
    <TenantProvider>
      <PortalInner />
    </TenantProvider>
  );
}