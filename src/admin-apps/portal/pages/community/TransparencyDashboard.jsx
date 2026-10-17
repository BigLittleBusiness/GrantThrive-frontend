import React, { useState, useEffect, useCallback } from 'react';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import {
  BarChart2, DollarSign, FileText, CheckCircle2, Vote, TrendingUp, Loader2, AlertCircle, Calendar,
} from 'lucide-react';
import { getTransparencyData } from '../../utils/api.js';

const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const TransparencyDashboard = ({ user, onNavigate, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransparency = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await getTransparencyData();
      setData(json && typeof json === 'object' ? json : {});
    } catch (err) {
      setError(err.message || 'Could not load transparency data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTransparency(); }, [loadTransparency]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', minimumFractionDigits: 0,
  }).format(numberValue(amount));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="transparency" />
        <div className="flex items-center justify-center py-24"><div className="flex flex-col items-center gap-3 text-slate-500"><Loader2 className="h-8 w-8 animate-spin" /><p className="text-sm">Loading transparency data…</p></div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="transparency" />
        <div className="flex justify-center px-6 py-24"><div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" /><h1 className="font-semibold text-slate-900">Transparency data is unavailable</h1><p className="mt-2 text-sm text-slate-600">Please retry to load the latest public information.</p><button type="button" onClick={loadTransparency} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Retry</button></div></div>
      </div>
    );
  }

  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};
  const categoryStats = Array.isArray(data?.category_stats) ? data.category_stats : [];
  const monthlyTrends = Array.isArray(data?.monthly_trends) ? data.monthly_trends : [];
  const recentGrants = Array.isArray(data?.recent_grants) ? data.recent_grants : [];
  const totalGrants = numberValue(summary.total_grants);
  const maxApps = Math.max(...monthlyTrends.map((item) => numberValue(item?.applications)), 1);
  const summaryCards = [
    { label: 'Total grants published', value: totalGrants.toLocaleString(), icon: <FileText className="h-6 w-6 text-blue-700" />, bg: 'bg-blue-50' },
    { label: 'Active grants', value: numberValue(summary.active_grants).toLocaleString(), icon: <TrendingUp className="h-6 w-6 text-emerald-700" />, bg: 'bg-emerald-50' },
    { label: 'Total funding available', value: formatCurrency(summary.total_budget), icon: <DollarSign className="h-6 w-6 text-teal-700" />, bg: 'bg-teal-50' },
    { label: 'Funding approved', value: formatCurrency(summary.total_approved_funding), icon: <CheckCircle2 className="h-6 w-6 text-green-700" />, bg: 'bg-green-50' },
    { label: 'Applications submitted', value: numberValue(summary.total_applications).toLocaleString(), icon: <BarChart2 className="h-6 w-6 text-violet-700" />, bg: 'bg-violet-50' },
    { label: 'Approval rate', value: `${numberValue(summary.approval_rate)}%`, icon: <CheckCircle2 className="h-6 w-6 text-amber-700" />, bg: 'bg-amber-50' },
    { label: 'Community votes cast', value: numberValue(summary.total_votes).toLocaleString(), icon: <Vote className="h-6 w-6 text-pink-700" />, bg: 'bg-pink-50' },
    { label: 'Active voting sessions', value: numberValue(summary.active_voting_sessions).toLocaleString(), icon: <Vote className="h-6 w-6 text-rose-700" />, bg: 'bg-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="transparency" />
      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <header className="mb-8"><div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800"><BarChart2 className="h-3.5 w-3.5" />Public transparency</div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Transparency Dashboard</h1><p className="mt-2 text-sm text-slate-600">Open data on grant programs, funding outcomes, and community participation across all councils.</p></header>

        <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Transparency summary">
          {summaryCards.map((card) => <Card key={card.label} className="rounded-2xl border-slate-200 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">{card.label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p></div><div className={`rounded-2xl ${card.bg} p-3`}>{card.icon}</div></div></CardContent></Card>)}
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="rounded-3xl border-slate-200 shadow-sm lg:col-span-2"><CardHeader><CardTitle className="text-lg">Application trend</CardTitle><CardDescription>Monthly applications submitted over the past 12 months.</CardDescription></CardHeader><CardContent>{monthlyTrends.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">No trend data is available yet.</p> : <div className="flex h-48 items-end gap-2">{monthlyTrends.map((item, index) => { const applications = numberValue(item?.applications); return <div key={item?.month || index} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs font-medium text-slate-700">{applications > 0 ? applications : ''}</span><div className="w-full rounded-t-lg bg-emerald-500" style={{ height: `${Math.max((applications / maxApps) * 160, applications > 0 ? 4 : 1)}px` }} /><span className="origin-left rotate-45 whitespace-nowrap text-[10px] text-slate-400">{typeof item?.month === 'string' ? item.month.split(' ')[0] : ''}</span></div>; })}</div>}</CardContent></Card>
          <Card className="rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-lg">Grants by category</CardTitle><CardDescription>Number of published grants per category.</CardDescription></CardHeader><CardContent className="space-y-3">{categoryStats.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : categoryStats.map((category, index) => { const count = numberValue(category?.count); const percentage = totalGrants > 0 ? Math.round((count / totalGrants) * 100) : 0; return <div key={category?.category || index}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium text-slate-800">{category?.category || 'Uncategorised'}</span><span className="text-slate-500">{count} grants</span></div><div className="h-2 w-full rounded-full bg-slate-200"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} /></div></div>; })}</CardContent></Card>
        </div>

        {recentGrants.length > 0 && <Card className="mt-8 rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-lg">Recently published grants</CardTitle><CardDescription>Grants added in the last 30 days.</CardDescription></CardHeader><CardContent><div className="divide-y divide-slate-100">{recentGrants.map((grant, index) => <div key={grant?.id || index} className="flex items-center justify-between py-3"><div><p className="font-medium text-slate-900">{grant?.title || 'Untitled grant'}</p><div className="mt-1 flex items-center gap-2 text-xs text-slate-500">{grant?.category && <Badge variant="outline" className="rounded-full text-xs">{grant.category}</Badge>}{grant?.closes_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Closes {new Date(grant.closes_at).toLocaleDateString('en-AU')}</span>}</div></div><div className="text-right"><p className="font-semibold text-slate-900">{formatCurrency(grant?.total_budget)}</p>{grant?.status && <Badge className={`mt-1 text-xs ${grant.status === 'open' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{grant.status}</Badge>}</div></div>)}</div></CardContent></Card>}
      </main>
    </div>
  );
};

export default TransparencyDashboard;
