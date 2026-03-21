import React from 'react';
import { Route } from 'react-router-dom';

import CommunityMemberDashboard from '../pages/community/CommunityMemberDashboard.jsx';
import GrantsListing from '../pages/community/GrantsListing.jsx';
import GrantDetails from '../pages/community/GrantDetails.jsx';
import ApplicationForm from '../pages/community/ApplicationForm.jsx';
import CommunityForum from '../pages/community/CommunityForum.jsx';
import ResourceHub from '../pages/community/ResourceHub.jsx';
import WinnersShowcase from '../pages/community/WinnersShowcase.jsx';
import CommunityVoting from '../pages/community/CommunityVoting.jsx';
import PublicGrantMap from '../pages/community/PublicGrantMap.jsx';
import TransparencyDashboard from '../pages/community/TransparencyDashboard.jsx';
import PublicResults from '../pages/community/PublicResults.jsx';

export default function CommunityRoutes({
  ProtectedRoute,
  currentUser,
  handleLogout,
  pageProps,
  ROLES,
}) {
  return (
    <>
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
    </>
  );
}