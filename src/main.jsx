/**
 * GrantThrive Unified Frontend — Entry Point
 * ===========================================
 * Single entry point for all five GrantThrive apps.
 *
 * Structure:
 *   src/
 *   ├── admin-apps/
 *   │   ├── admin/    → Super-admin dashboard  (system_admin role, SSO-gated)
 *   │   └── portal/   → Council portal         (council_admin, staff, community)
 *   ├── public-apps/
 *   │   ├── marketing/ → Marketing website     (public, no auth)
 *   │   ├── map/       → Interactive grant map (public, no auth)
 *   │   └── roi/       → ROI calculator        (public, no auth)
 *   └── shared/
 *       ├── lib/       → Shared utilities (cn, etc.)
 *       └── hooks/     → Shared React hooks (use-mobile, etc.)
 *
 * Routes:
 *   /app/*   → Council portal
 *   /admin/* → Super-admin dashboard (system_admin only)
 *   /map     → Interactive grant map
 *   /roi     → ROI calculator
 *   /*       → Marketing website (catch-all)
 *
 * Domain: grantthrive.com
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// ── Super-admin dashboard (system_admin only) ─────────────────────────────
import AdminAuthGate from './admin-apps/admin/components/AdminAuthGate.jsx'
import AdminApp from './admin-apps/admin/AdminApp.jsx'
import './admin-apps/admin/AdminApp.css'

// ── Council portal (council_admin, council_staff, community_member) ───────
import PortalApp from './admin-apps/portal/PortalApp.jsx'
import './admin-apps/portal/PortalApp.css'

// ── Interactive grant map (public) ────────────────────────────────────────
import MapApp from './public-apps/map/MapApp.jsx'
import './public-apps/map/MapApp.css'

// ── ROI calculator (public) ───────────────────────────────────────────────
import ROIApp from './public-apps/roi/ROIApp.jsx'
import './public-apps/roi/ROIApp.css'

// ── Marketing website (public, catch-all) ────────────────────────────────
import MarketingApp from './public-apps/marketing/MarketingApp.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Super-admin dashboard ───────────────────────────────────── */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthGate>
              <AdminApp />
            </AdminAuthGate>
          }
        />

        {/* ── Council portal ──────────────────────────────────────────── */}
        <Route path="/portal/*" element={<PortalApp />} />

        {/* ── Interactive grant map ───────────────────────────────────── */}
        <Route path="/map" element={<MapApp />} />

        {/* ── ROI calculator ──────────────────────────────────────────── */}
        <Route path="/roi" element={<ROIApp />} />

        {/* ── Marketing website (all other routes) ────────────────────── */}
        <Route path="/*" element={<MarketingApp />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
