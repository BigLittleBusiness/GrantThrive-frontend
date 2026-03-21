import React from 'react';
import { Route } from 'react-router-dom';

import AdminApprovalDashboard from '../council-admin/AdminApprovalDashboard.jsx';
import CouncilAdminDashboard from '../council-admin/CouncilAdminDashboard.jsx';
import GrantCreationWizard from '../council-admin/GrantCreationWizard.jsx';
import CommunicationSettings from '../council-admin/CommunicationSettings.jsx';
import QRCodeManagement from '../council-admin/QRCodeManagement.jsx';
import StaffManagement from '../council-admin/StaffManagement.jsx';
import AccountBilling from '../council-admin/AccountBilling.jsx';
import CouncilAdminProfile from '../council-admin/Profile.jsx';
import PricingPage from '../council-admin/PricingPage.jsx';
import PendingApprovals from '../council-staff/PendingApprovals.jsx';
import GrantsListing from '../community/GrantsListing.jsx';
import GrantDetails from '../community/GrantDetails.jsx';
import CommunityForum from '../community/CommunityForum.jsx';
import ResourceHub from '../community/ResourceHub.jsx';
import CommunityVoting from '../community/CommunityVoting.jsx';
import PublicGrantMap from '../community/PublicGrantMap.jsx';

export default function CouncilAdminRoutes({
  ProtectedRoute,
  currentUser,
  handleLogout,
  pageProps,
  ROLES,
}) {
  return (
    <>
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
    </>
  );
}