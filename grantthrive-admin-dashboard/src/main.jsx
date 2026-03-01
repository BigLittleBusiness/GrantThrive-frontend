import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminAuthGate from './components/AdminAuthGate.jsx'

/**
 * The AdminAuthGate verifies the shared SSO token on load.
 * Only users with the `system_admin` role can access this dashboard.
 * All others are redirected to app.grantthrive.com/login.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminAuthGate>
      <App />
    </AdminAuthGate>
  </StrictMode>,
)
