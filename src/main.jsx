import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';

const AdminAuthGate = lazy(() => import('./admin-apps/admin/components/AdminAuthGate.jsx'));
const AdminApp = lazy(() => import('./admin-apps/admin/AdminApp.jsx'));
const PortalApp = lazy(() => import('./admin-apps/portal/PortalApp.jsx'));
const MapApp = lazy(() => import('./public-apps/map/MapApp.jsx'));
const ROIApp = lazy(() => import('./public-apps/roi/ROIApp.jsx'));
const MarketingApp = lazy(() => import('./public-apps/marketing/MarketingApp.jsx'));

function LoadingSurface() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600" role="status">Loading GrantThrive…</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSurface />}>
        <Routes>
          <Route path="/admin/*" element={<AdminAuthGate><AdminApp /></AdminAuthGate>} />
          <Route path="/portal/*" element={<PortalApp />} />
          <Route path="/login" element={<Navigate to="/portal/login/" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/portal" element={<Navigate to="/portal/login/" replace />} />
          <Route path="/map" element={<MapApp />} />
          <Route path="/roi" element={<ROIApp />} />
          <Route path="/*" element={<MarketingApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
requestAnimationFrame(() => document.dispatchEvent(new Event('render-event')));
