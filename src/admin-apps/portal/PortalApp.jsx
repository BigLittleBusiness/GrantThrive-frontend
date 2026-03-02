import React, { useState, useEffect } from 'react';
import { TenantProvider, useTenant } from '@shared/tenancy/TenantContext';
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
  const [currentPage, setCurrentPage] = useState('login');

  // Listen for global logout events (dispatched by useTenantApi on 401)
  useEffect(() => {
    const handleGlobalLogout = () => {
      localStorage.removeItem('gt_auth_token');
      localStorage.removeItem('gt_auth_user');
      setCurrentUser(null);
      setCurrentPage('login');
    };
    window.addEventListener('gt:logout', handleGlobalLogout);
    return () => window.removeEventListener('gt:logout', handleGlobalLogout);
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('gt_auth_user');
    const storedToken = localStorage.getItem('gt_auth_token');
    if (storedUser && storedToken) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        setCurrentPage('dashboard');
      } catch {
        localStorage.removeItem('gt_auth_user');
        localStorage.removeItem('gt_auth_token');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('gt_auth_user', JSON.stringify(userData));
    setCurrentUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('gt_auth_token');
    localStorage.removeItem('gt_auth_user');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const navigateToPage = (page) => setCurrentPage(page);

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

  // Common props forwarded to every page
  const pageProps = { user: currentUser, council, onNavigate: navigateToPage, onLogout: handleLogout };

  // Show login page if no user is authenticated
  if (!currentUser) {
    if (currentPage === 'register') {
      return <Registration council={council} onLogin={handleLogin} />;
    }
    return <Login council={council} onLogin={handleLogin} />;
  }

  // Route to appropriate dashboard based on user role
  const renderDashboard = () => {
    const role = currentUser.role || currentUser.userType;
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

  // Route to specific pages
  switch (currentPage) {
    case 'dashboard':           return renderDashboard();
    case 'admin-approvals':     return <AdminApprovalDashboard {...pageProps} />;
    case 'create-grant':        return <GrantCreationWizard {...pageProps} />;
    case 'grants':              return <GrantsListing {...pageProps} />;
    case 'grant-details':       return <GrantDetails {...pageProps} />;
    case 'application-form':    return <ApplicationForm {...pageProps} />;
    case 'community-forum':     return <CommunityForum {...pageProps} />;
    case 'resource-hub':        return <ResourceHub {...pageProps} />;
    case 'winners-showcase':    return <WinnersShowcase {...pageProps} />;
    case 'communication-settings': return <CommunicationSettings {...pageProps} />;
    case 'qr-code-management':  return <QRCodeManagement {...pageProps} />;
    case 'community-voting':    return <CommunityVoting {...pageProps} />;
    case 'grant-map':           return <PublicGrantMap {...pageProps} />;
    default:                    return renderDashboard();
  }
}

// ── Root export (wraps everything in TenantProvider) ─────────────────────────
export default function PortalApp() {
  return (
    <TenantProvider>
      <PortalInner />
    </TenantProvider>
  );
}

