import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminDashboardOverview from './pages/AdminDashboardOverview.jsx';
import CouncilManagement from './pages/CouncilManagement.jsx';
import CouncilRegistrations from './pages/CouncilRegistrations.jsx';
import SystemAdminManagement from './pages/SystemAdminManagement.jsx';
import PricingManagement from './pages/PricingManagement.jsx';
import TwilioConfig from './pages/TwilioConfig.jsx';
import PlatformSettings from './pages/PlatformSettings.jsx';
import PublicSubmissions from './pages/PublicSubmissions.jsx';
import { useAdminAuth } from './hooks/useAdminAuth.js';
import api from '@shared/api/client';
import { Avatar, AvatarFallback } from '@shared/components/ui/avatar';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Settings,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';
import './AdminApp.css';

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'councils', label: 'Council Management', icon: Building2 },
  { id: 'approvals', label: 'Council Registrations', icon: UserCheck },
  { id: 'form-submissions', label: 'Form Submissions', icon: ClipboardList },
  { id: 'staff', label: 'System Admins', icon: UserCog },
  { id: 'pricing', label: 'Pricing Management', icon: CreditCard },
  { id: 'sms', label: 'SMS / Twilio', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function initialTab() {
  if (typeof window === 'undefined') return 'overview';
  const requested = new URLSearchParams(window.location.search).get('tab');
  return SIDEBAR_ITEMS.some((item) => item.id === requested) ? requested : 'overview';
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const { user: adminUser, logout } = useAdminAuth();

  const adminDisplayName = adminUser?.full_name || adminUser?.first_name || adminUser?.email || 'System administrator';
  const adminInitials = adminDisplayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD';

  const activeItem = useMemo(
    () => SIDEBAR_ITEMS.find((item) => item.id === activeTab) || SIDEBAR_ITEMS[0],
    [activeTab],
  );

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError('');
    try {
      setDashboard(await api.get('/admin/dashboard'));
    } catch (error) {
      setDashboardError(error.message || 'Unable to load the live platform dashboard.');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeTab === 'overview') url.searchParams.delete('tab');
    else url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [activeTab]);

  const navigate = (tab) => setActiveTab(tab);
  const alertCount = dashboard?.alerts?.length || 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`relative shrink-0 bg-white shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="border-b p-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-700 p-2"><LayoutDashboard className="h-6 w-6 text-white" /></div>
            {!sidebarCollapsed && <div><h1 className="text-xl font-bold text-slate-900">GrantThrive</h1><p className="text-sm text-slate-600">Admin Dashboard</p></div>}
          </div>
        </div>

        <nav className="mt-6" aria-label="System administration">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex w-full items-center px-4 py-3 text-left transition-colors hover:bg-emerald-50 ${activeTab === item.id ? 'border-r-2 border-emerald-700 bg-emerald-50 text-emerald-800' : 'text-slate-700'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span className="ml-3 text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4">
          <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0"><h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{activeItem.label}</h2><p className="mt-0.5 text-sm text-slate-600">Manage GrantThrive securely</p></div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('overview')} aria-label="View live action items" title="View live action items">
                <Bell className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Alerts</span>
                {alertCount > 0 && <Badge variant="destructive" className="ml-2">{alertCount}</Badge>}
              </Button>
              <div className="hidden items-center gap-2 lg:flex"><Avatar><AvatarFallback>{adminInitials}</AvatarFallback></Avatar><div className="max-w-36"><p className="truncate text-sm font-medium text-slate-900">{adminDisplayName}</p><p className="text-xs text-slate-500">System admin</p></div></div>
              <Button variant="outline" size="sm" onClick={() => { void logout(); }} aria-label="Log out of GrantThrive system administration" title="Log out"><LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Log out</span></Button>
            </div>
          </div>
        </header>

        <main className="h-full overflow-y-auto p-4 sm:p-6">
          {activeTab === 'overview' && <AdminDashboardOverview dashboard={dashboard} loading={dashboardLoading} error={dashboardError} onRefresh={loadDashboard} onNavigate={navigate} />}
          {activeTab === 'councils' && <CouncilManagement />}
          {activeTab === 'approvals' && <CouncilRegistrations />}
          {activeTab === 'form-submissions' && <PublicSubmissions />}
          {activeTab === 'staff' && <SystemAdminManagement />}
          {activeTab === 'pricing' && <PricingManagement />}
          {activeTab === 'sms' && <TwilioConfig />}
          {activeTab === 'settings' && <PlatformSettings onNavigate={navigate} />}
        </main>
      </div>
    </div>
  );
}
