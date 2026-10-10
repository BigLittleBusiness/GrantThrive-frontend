import { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';

const ROLE_LABELS = {
  system_admin: 'System admin',
  council_admin: 'Council admin',
  council_staff: 'Council staff',
  community_member: 'Community member',
  professional_consultant: 'Professional consultant',
};

const ALERT_STYLES = {
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-700',
    buttonClass: 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100',
  },
  error: {
    icon: AlertCircle,
    border: 'border-red-200 bg-red-50',
    iconClass: 'text-red-700',
    buttonClass: 'border-red-300 bg-white text-red-800 hover:bg-red-100',
  },
  info: {
    icon: AlertCircle,
    border: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-700',
    buttonClass: 'border-blue-300 bg-white text-blue-800 hover:bg-blue-100',
  },
};

function formatDate(value) {
  if (!value) return 'No sign-in recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatCard({ label, value, description, icon: Icon, onClick }) {
  const inner = (
    <Card className={onClick ? 'transition-shadow hover:shadow-md' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{Number(value || 0).toLocaleString()}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3"><Icon className="h-6 w-6 text-emerald-700" /></div>
        </div>
      </CardContent>
    </Card>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 rounded-xl">
      {inner}
    </button>
  ) : inner;
}

export default function AdminDashboardOverview({ dashboard, loading, error, onRefresh, onNavigate }) {
  const stats = dashboard?.stats || {};
  const alerts = dashboard?.alerts || [];
  const recentUsers = dashboard?.recent_users || [];
  const updatedAt = useMemo(() => formatDate(dashboard?.generated_at), [dashboard?.generated_at]);

  if (loading && !dashboard) {
    return <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin" />Loading live platform data…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform overview</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Live operational counts and action items for GrantThrive system administrators.</p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="font-semibold">Live dashboard data could not be loaded.</p><p className="mt-1">{error}</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active users" value={stats.active_users} description="Active accounts across the platform" icon={Users} />
        <StatCard label="Active councils" value={stats.active_councils} description="Provisioned, active council tenants" icon={Building2} onClick={() => onNavigate('councils')} />
        <StatCard label="Grant programs" value={stats.total_grants} description="Draft and published grants on the platform" icon={FileText} />
        <StatCard label="Submitted applications" value={stats.submitted_applications} description="Applications received, excluding drafts" icon={ClipboardList} />
      </div>

      <Card id="admin-alerts" className="scroll-mt-6">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-amber-700" />Action items</CardTitle>
              <CardDescription className="mt-1">Only live, actionable records are shown here. No synthetic service-health or revenue figures are displayed.</CardDescription>
            </div>
            <span className="text-sm font-medium text-slate-600">{alerts.length} open</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {alerts.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div><p className="font-semibold">No administrative action is currently required.</p><p className="mt-1">New council registrations, web enquiries, notification delivery failures and expiring trials will appear here when present.</p></div>
            </div>
          ) : alerts.map((alert) => {
            const style = ALERT_STYLES[alert.severity] || ALERT_STYLES.info;
            const Icon = style.icon;
            return (
              <div key={alert.id} className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${style.border}`}>
                <div className="flex min-w-0 items-start gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
                  <div><p className="font-semibold text-slate-900">{alert.title}</p><p className="mt-1 text-sm leading-5 text-slate-700">{alert.description}</p></div>
                </div>
                {alert.tab && <Button variant="outline" size="sm" className={`shrink-0 ${style.buttonClass}`} onClick={() => onNavigate(alert.tab)}>{alert.action_label || 'Review'}</Button>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-lg"><UserCheck className="h-5 w-5 text-emerald-700" />Recent account activity</CardTitle><CardDescription>Latest accounts created or used, sourced from the platform database.</CardDescription></CardHeader>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? <p className="p-6 text-sm text-slate-500">No user activity has been recorded yet.</p> : <div className="divide-y divide-slate-100">{recentUsers.map((user) => <div key={user.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate font-medium text-slate-900">{user.full_name || 'Unnamed user'}</p><p className="mt-0.5 truncate text-xs text-slate-500">{ROLE_LABELS[user.role] || user.role}{user.council_name ? ` · ${user.council_name}` : ''}</p></div><div className="shrink-0 text-right"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{user.is_active ? 'Active' : 'Pending'}</span><p className="mt-1 text-xs text-slate-500">{formatDate(user.last_login || user.created_at)}</p></div></div>)}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b"><CardTitle className="text-lg">Quick actions</CardTitle><CardDescription>Direct links to implemented administration tasks.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
            <Button variant="outline" className="h-auto min-h-20 justify-start whitespace-normal px-4 py-4 text-left" onClick={() => onNavigate('approvals')}><UserCheck className="mr-3 h-5 w-5 shrink-0 text-emerald-700" /><span><span className="block font-semibold">Review council registrations</span><span className="mt-1 block text-xs font-normal text-slate-500">Approve or decline pending council administrators.</span></span></Button>
            <Button variant="outline" className="h-auto min-h-20 justify-start whitespace-normal px-4 py-4 text-left" onClick={() => onNavigate('form-submissions')}><ClipboardList className="mr-3 h-5 w-5 shrink-0 text-emerald-700" /><span><span className="block font-semibold">Review form submissions</span><span className="mt-1 block text-xs font-normal text-slate-500">Handle protected contact and waitlist records.</span></span></Button>
            <Button variant="outline" className="h-auto min-h-20 justify-start whitespace-normal px-4 py-4 text-left" onClick={() => onNavigate('councils')}><Building2 className="mr-3 h-5 w-5 shrink-0 text-emerald-700" /><span><span className="block font-semibold">Manage councils</span><span className="mt-1 block text-xs font-normal text-slate-500">Provision, inspect or update council tenants.</span></span></Button>
            <Button variant="outline" className="h-auto min-h-20 justify-start whitespace-normal px-4 py-4 text-left" onClick={() => onNavigate('pricing')}><FileText className="mr-3 h-5 w-5 shrink-0 text-emerald-700" /><span><span className="block font-semibold">Manage pricing</span><span className="mt-1 block text-xs font-normal text-slate-500">Review the plans displayed to prospective councils.</span></span></Button>
          </CardContent>
        </Card>
      </div>

      {dashboard?.generated_at && <p className="text-right text-xs text-slate-400">Last refreshed {updatedAt}</p>}
    </div>
  );
}
