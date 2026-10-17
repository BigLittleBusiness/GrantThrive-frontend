import React from 'react';
import { Routes, Route } from 'react-router-dom';

import CouncilStaffDashboard from '../pages/council-staff/CouncilStaffDashboard.jsx';
import CouncilStaffProfile from '../pages/council-staff/Profile.jsx';
import PendingApprovals from '../pages/council-staff/PendingApprovals.jsx';

import AdminApprovalDashboard from '../pages/council-admin/AdminApprovalDashboard.jsx';
import CommunicationSettings from '../pages/council-admin/CommunicationSettings.jsx';

import GrantsListing from '../pages/community/GrantsListing.jsx';
import GrantDetails from '../pages/community/GrantDetails.jsx';
import CommunityForum from '../pages/community/CommunityForum.jsx';
import ResourceHub from '../pages/community/ResourceHub.jsx';
import CommunityVoting from '../pages/community/CommunityVoting.jsx';
import PublicGrantMap from '../pages/community/PublicGrantMap.jsx';

export default function CouncilStaffRoutes({
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
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <CouncilStaffDashboard {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="grants"
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
        path="grant-details/:id"
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
        path="admin-approvals"
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
        path="community-voting"
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
        path="grant-map"
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
        path="resource-hub"
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
        path="profile"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <CouncilStaffProfile {...pageProps} />
          </ProtectedRoute>
        }
      />

      <Route
        path="pending-approvals"
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
        path="community-forum"
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

      <Route
        path="communication-settings"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.COUNCIL_STAFF]}
            onLogout={handleLogout}
          >
            <CommunicationSettings {...pageProps} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
