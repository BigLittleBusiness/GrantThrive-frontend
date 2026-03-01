/**
 * GrantThrive Unified Frontend — Entry Point
 * ===========================================
 * Single entry point for all five GrantThrive apps.
 *
 * Routes:
 *   /app/*         → Council portal (council_admin, council_staff, community_member)
 *   /admin/*       → Admin dashboard (system_admin role required via AdminAuthGate)
 *   /map           → Interactive grant map (public, no auth)
 *   /roi           → ROI calculator (public, no auth)
 *   /              → Marketing website (public, no auth — all other routes)
 *   /features      → Marketing features page
 *   /pricing       → Marketing pricing page
 *   /roi-calculator → Marketing ROI calculator page
 *   /resources     → Marketing resources page
 *   /contact       → Marketing contact page
 *
 * Domain: grantthrive.com
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// ── Admin dashboard — system_admin role only ──────────────────────────────
import AdminAuthGate from './admin/components/AdminAuthGate.jsx'
import AdminApp from './admin/AdminApp.jsx'
import './admin/AdminApp.css'

// ── Council portal — authenticated users (council_admin, staff, community) ─
import PortalApp from './portal/PortalApp.jsx'
import './portal/PortalApp.css'

// ── Interactive grant map — public ────────────────────────────────────────
import MapApp from './map/MapApp.jsx'
import './map/MapApp.css'

// ── ROI calculator — public ───────────────────────────────────────────────
import ROIApp from './roi/ROIApp.jsx'
import './roi/ROIApp.css'

// ── Marketing website — public (catch-all) ───────────────────────────────
import MarketingApp from './marketing/MarketingApp.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Admin dashboard ─────────────────────────────────────────── */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthGate>
              <AdminApp />
            </AdminAuthGate>
          }
        />

        {/* ── Council portal ──────────────────────────────────────────── */}
        <Route path="/app/*" element={<PortalApp />} />

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
