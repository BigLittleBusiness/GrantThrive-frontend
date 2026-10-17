import React, { useState, useEffect, useCallback } from 'react';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Trophy, DollarSign, CheckCircle2, Loader2, AlertCircle, Calendar, Building2, Tag } from 'lucide-react';
import { getPublicResults } from '../../utils/api.js';

const numberValue = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const PublicResults = ({ user, onNavigate, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await getPublicResults();
      setData(json && typeof json === 'object' ? json : {});
    } catch (err) {
      setError(err.message || 'Could not load public results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadResults(); }, [loadResults]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', minimumFractionDigits: 0,
  }).format(numberValue(amount));

  if (loading) {
    return <div className="min-h-screen bg-slate-50"><CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="public-results" /><div className="flex items-center justify-center py-24"><div className="flex flex-col items-center gap-3 text-slate-500"><Loader2 className="h-8 w-8 animate-spin" /><p className="text-sm">Loading results…</p></div></div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-50"><CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="public-results" /><div className="flex justify-center px-6 py-24"><div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" /><h1 className="font-semibold text-slate-900">Public results are unavailable</h1><p className="mt-2 text-sm text-slate-600">Please retry to load the latest published outcomes.</p><button type="button" onClick={loadResults} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Retry</button></div></div></div>;
  }

  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};
  const impactByCategory = Array.isArray(data?.impact_by_category) ? data.impact_by_category : [];
  const recentSuccesses = Array.isArray(data?.recent_successes) ? data.recent_successes : [];
  const completedGrants = Array.isArray(data?.completed_grants) ? data.completed_grants : [];
  const categories = ['All', ...impactByCategory.map((category) => category?.category).filter(Boolean)];
  const filteredSuccesses = activeCategory === 'All' ? recentSuccesses : recentSuccesses.filter((success) => success?.category === activeCategory);
  const maxFunding = Math.max(...impactByCategory.map((category) => numberValue(category?.funding)), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="public-results" />
      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <header className="mb-8"><div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"><Trophy className="h-3.5 w-3.5" />Grant outcomes</div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Public Results</h1><p className="mt-2 text-sm text-slate-600">Approved grant recipients and funding outcomes across all council programs.</p></header>

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Public results summary">
          <Card className="rounded-2xl border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 p-6"><div className="rounded-2xl bg-emerald-50 p-4"><DollarSign className="h-7 w-7 text-emerald-700" /></div><div><p className="text-sm text-slate-500">Total funding awarded</p><p className="text-3xl font-bold text-slate-900">{formatCurrency(summary.total_funded)}</p></div></CardContent></Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 p-6"><div className="rounded-2xl bg-blue-50 p-4"><CheckCircle2 className="h-7 w-7 text-blue-700" /></div><div><p className="text-sm text-slate-500">Projects funded</p><p className="text-3xl font-bold text-slate-900">{numberValue(summary.total_projects).toLocaleString()}</p></div></CardContent></Card>
        </section>

        {impactByCategory.length > 0 && <Card className="mb-8 rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-lg">Funding by category</CardTitle><CardDescription>Total funding awarded per grant category.</CardDescription></CardHeader><CardContent className="space-y-4">{impactByCategory.map((category, index) => { const funding = numberValue(category?.funding); const projects = numberValue(category?.projects); const percentage = Math.round((funding / maxFunding) * 100); return <div key={category?.category || index}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium text-slate-800">{category?.category || 'Uncategorised'}</span><span className="text-slate-500">{projects} project{projects !== 1 ? 's' : ''} · {formatCurrency(funding)}</span></div><div className="h-2.5 w-full rounded-full bg-slate-200"><div className="h-2.5 rounded-full bg-amber-500" style={{ width: `${percentage}%` }} /></div></div>; })}</CardContent></Card>}

        {categories.length > 1 && <div className="mb-4 flex flex-wrap gap-2" aria-label="Filter results by category">{categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === category ? 'border-amber-400 bg-amber-100 text-amber-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{category}</button>)}</div>}

        {filteredSuccesses.length === 0 ? <Card className="rounded-3xl border-slate-200 shadow-sm"><CardContent className="py-16 text-center text-slate-500"><Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p>No approved projects to display yet.</p></CardContent></Card> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredSuccesses.map((project, index) => <Card key={project?.id || index} className="rounded-3xl border-slate-200 shadow-sm"><CardHeader className="pb-2"><div className="flex items-start justify-between gap-2"><CardTitle className="text-base leading-snug">{project?.title || 'Untitled project'}</CardTitle><div className="shrink-0 rounded-full bg-emerald-100 p-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-700" /></div></div></CardHeader><CardContent className="space-y-3 text-sm">{project?.organisation && <div className="flex items-center gap-2 text-slate-600"><Building2 className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{project.organisation}</span></div>}{project?.grant_title && <div className="flex items-center gap-2 text-slate-600"><Tag className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{project.grant_title}</span></div>}{project?.approved_at && <div className="flex items-center gap-2 text-slate-500"><Calendar className="h-4 w-4 shrink-0 text-slate-400" /><span>{new Date(project.approved_at).toLocaleDateString('en-AU')}</span></div>}<div className="flex items-center justify-between pt-2">{project?.category && <Badge variant="outline" className="rounded-full text-xs">{project.category}</Badge>}<span className="font-bold text-slate-900">{formatCurrency(project?.amount)}</span></div></CardContent></Card>)}</div>}

        {completedGrants.length > 0 && <Card className="mt-10 rounded-3xl border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-lg">Completed grant programs</CardTitle><CardDescription>Grant programs that have closed and finalised recipients.</CardDescription></CardHeader><CardContent><div className="divide-y divide-slate-100">{completedGrants.map((grant, index) => <div key={grant?.id || index} className="flex items-center justify-between py-3"><div><p className="font-medium text-slate-900">{grant?.title || 'Untitled grant program'}</p><div className="mt-1 flex items-center gap-2 text-xs text-slate-500">{grant?.category && <Badge variant="outline" className="rounded-full text-xs">{grant.category}</Badge>}{grant?.closes_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Closed {new Date(grant.closes_at).toLocaleDateString('en-AU')}</span>}</div></div><div className="text-right"><p className="font-semibold text-slate-900">{formatCurrency(grant?.total_budget)}</p><p className="mt-0.5 text-xs text-slate-500">{numberValue(grant?.approved_count)} recipient{numberValue(grant?.approved_count) !== 1 ? 's' : ''}</p></div></div>)}</div></CardContent></Card>}
      </main>
    </div>
  );
};

export default PublicResults;
