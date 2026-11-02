import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import HelpGuidancePage from '../pages/HelpGuidancePage.jsx';

export default function ConsultantRoutes({
  ProtectedRoute,
  currentUser,
  handleLogout,
  pageProps,
  ROLES,
}) {
  return (
    <Routes>
      <Route
        path="help"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.PROFESSIONAL_CONSULTANT]}
            onLogout={handleLogout}
          >
            <HelpGuidancePage {...pageProps} navigationVariant="consultant" />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute
            user={currentUser}
            allowedRoles={[ROLES.PROFESSIONAL_CONSULTANT]}
            onLogout={handleLogout}
          >
            <Navigate to="/portal/consultant/help" replace />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
