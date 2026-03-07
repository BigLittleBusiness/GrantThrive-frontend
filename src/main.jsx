/**
 * GrantThrive Unified Frontend — Entry Point
 * ==========================================
 * Single entry point for all GrantThrive frontend surfaces.
 *
 * Final RBAC:
 *   - system_admin     → admin.grantthrive.com
 *   - council_admin    → portal.grantthrive.com
 *   - council_staff    → portal.grantthrive.com
 *   - community_member → portal.grantthrive.com
 *
 * Apps:
 *   src/
 *   ├── admin-apps/
 *   │   ├── admin/      → Platform admin app
 *   │   └── portal/     → Council + community portal
 *   ├── public-apps/
 *   │   ├── marketing/  → Public marketing site
 *   │   ├── map/        → Public map
 *   │   └── roi/        → Public ROI calculator
 *   └── shared/
 *
 * Routes:
 *   /admin/*   → Platform admin (system_admin only)
 *   /portal/*  → Council + community portal
 *   /map       → Public grant map
 *   /roi       → Public ROI calculator
 *   /*         → Marketing website
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// ── Platform admin app (system_admin only) ────────────────────────────────
import AdminAuthGate from './admin-apps/admin/components/AdminAuthGate.jsx';
import AdminApp from './admin-apps/admin/AdminApp.jsx';
import './admin-apps/admin/AdminApp.css';

// ── Portal app (council_admin, council_staff, community_member) ──────────
import PortalApp from './admin-apps/portal/PortalApp.jsx';
import './admin-apps/portal/PortalApp.css';

// ── Public apps ───────────────────────────────────────────────────────────
import MapApp from './public-apps/map/MapApp.jsx';
import './public-apps/map/MapApp.css';

import ROIApp from './public-apps/roi/ROIApp.jsx';
import './public-apps/roi/ROIApp.css';

import MarketingApp from './public-apps/marketing/MarketingApp.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Platform admin */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthGate>
              <AdminApp />
            </AdminAuthGate>
          }
        />

        {/* Unified portal for council + community users */}
        <Route path="/portal/*" element={<PortalApp />} />

        {/* Optional convenience redirects */}
        <Route path="/login" element={<Navigate to="/portal/login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/portal" element={<Navigate to="/portal/login" replace />} />

        {/* Public tools */}
        <Route path="/map" element={<MapApp />} />
        <Route path="/roi" element={<ROIApp />} />

        {/* Public marketing */}
        <Route path="/*" element={<MarketingApp />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);