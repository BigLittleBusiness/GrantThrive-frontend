import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminApprovalDashboard from '../pages/council-admin/AdminApprovalDashboard.jsx';
import CouncilAdminDashboard from '../pages/council-admin/CouncilAdminDashboard.jsx';
import GrantCreationWizard from '../pages/council-admin/GrantCreationWizard.jsx';
import CommunicationSettings from '../pages/council-admin/CommunicationSettings.jsx';
import QRCodeManagement from '../pages/council-admin/QRCodeManagement.jsx';
import StaffManagement from '../pages/council-admin/StaffManagement.jsx';
import AccountBilling from '../pages/council-admin/AccountBilling.jsx';
import CouncilAdminProfile from '../pages/council-admin/Profile.jsx';
import PricingPage from '../pages/council-admin/PricingPage.jsx';
import PendingApprovals from '../pages/council-staff/PendingApprovals.jsx';
import Analytics from '../pages/council-admin/Analytics.jsx';
import ApplicationReviewWorkflow from '../pages/council-admin/ApplicationReviewWorkflow.jsx';
import WinnersShowcase from '../pages/community/WinnersShowcase.jsx';
import GrantsListing from '../pages/community/GrantsListing.jsx';
import GrantDetails from '../pages/community/GrantDetails.jsx';
import CommunityForum from '../pages/community/CommunityForum.jsx';
import ResourceHub from '../pages/community/ResourceHub.jsx';
import CommunityVoting from '../pages/community/CommunityVoting.jsx';
import PublicGrantMap from '../pages/community/PublicGrantMap.jsx';

export default function CouncilAdminRoutes({
  ProtectedRoute,
  currentUser,
  handleLogout,
  pageProps,
  ROLES,
}) {
  return (
    <Routes>
      <Route
        path="dashboard"
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
        path="admin-approvals"
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
        path="create-grant"
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
        path="grants"
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
        path="grant-details/:id"
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
        path="communication-settings"
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
        path="qr-code-management"
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
        path="community-voting"
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
        path="grant-map"
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
        path="resource-hub"
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
        path="staff-management"
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
        path="account-billing"
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
        path="profile"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <CouncilAdminProfile {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="community-forum"
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
        path="pricing"
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
        path="pending-approvals"
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

      <Route
        path="analytics"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <Analytics {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="review-workflow"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <ApplicationReviewWorkflow {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="winners-showcase"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_ADMIN]}
            onLogout={handleLogout}
          >
            <WinnersShowcase {...pageProps} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
