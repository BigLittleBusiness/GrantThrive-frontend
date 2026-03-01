/**
 * GrantThrive Unified Frontend — Entry Point
 * ===========================================
 * Single entry point for the merged marketing website + admin dashboard.
 *
 * Routes:
 *   /          → Marketing website (public, no auth required)
 *   /features  → Marketing features page
 *   /pricing   → Marketing pricing page
 *   /roi-calculator → Marketing ROI calculator page
 *   /resources → Marketing resources page
 *   /contact   → Marketing contact page
 *   /admin/*   → Admin dashboard (system_admin role required via AdminAuthGate)
 *
 * Domain: grantthrive.com
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// Marketing website — public, no auth
import MarketingApp from './marketing/MarketingApp.jsx'

// Admin dashboard — gated by AdminAuthGate (system_admin role only)
import AdminAuthGate from './admin/components/AdminAuthGate.jsx'
import AdminApp from './admin/AdminApp.jsx'

// Import admin-specific CSS (scoped to admin section)
import './admin/AdminApp.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Admin section ─────────────────────────────────────────────── */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthGate>
              <AdminApp />
            </AdminAuthGate>
          }
        />

        {/* ── Marketing website (all other routes) ──────────────────────── */}
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
