import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import {
  BarChart2,
  DollarSign,
  FileText,
  CheckCircle2,
  Vote,
  TrendingUp,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TransparencyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/public/api/transparency`);
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message || 'Failed to load transparency data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(amount || 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading transparency data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { summary, category_stats, monthly_trends, recent_grants } = data;

  const summaryCards = [
    { label: 'Total grants published', value: summary.total_grants.toLocaleString(), icon: <FileText className="h-6 w-6 text-blue-700" />, bg: 'bg-blue-50' },
    { label: 'Active grants', value: summary.active_grants.toLocaleString(), icon: <TrendingUp className="h-6 w-6 text-emerald-700" />, bg: 'bg-emerald-50' },
    { label: 'Total funding available', value: formatCurrency(summary.total_budget), icon: <DollarSign className="h-6 w-6 text-teal-700" />, bg: 'bg-teal-50' },
    { label: 'Funding approved', value: formatCurrency(summary.total_approved_funding), icon: <CheckCircle2 className="h-6 w-6 text-green-700" />, bg: 'bg-green-50' },
    { label: 'Applications submitted', value: summary.total_applications.toLocaleString(), icon: <BarChart2 className="h-6 w-6 text-violet-700" />, bg: 'bg-violet-50' },
    { label: 'Approval rate', value: `${summary.approval_rate}%`, icon: <CheckCircle2 className="h-6 w-6 text-amber-700" />, bg: 'bg-amber-50' },
    { label: 'Community votes cast', value: summary.total_votes.toLocaleString(), icon: <Vote className="h-6 w-6 text-pink-700" />, bg: 'bg-pink-50' },
    { label: 'Active voting sessions', value: summary.active_voting_sessions.toLocaleString(), icon: <Vote className="h-6 w-6 text-rose-700" />, bg: 'bg-rose-50' },
  ];

  // Find max for bar chart scaling
  const maxApps = Math.max(...monthly_trends.map((m) => m.applications), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
            <BarChart2 className="h-3.5 w-3.5" />
            Public transparency
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Transparency Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Open data on grant programs, funding outcomes, and community participation across all councils.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`rounded-2xl ${card.bg} p-3`}>{card.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Monthly application trend */}
          <div className="lg:col-span-2">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Application trend</CardTitle>
                <CardDescription>Monthly applications submitted over the past 12 months.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-48 items-end gap-2">
                  {monthly_trends.map((m) => (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-xs font-medium text-slate-700">
                        {m.applications > 0 ? m.applications : ''}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-emerald-500 transition-all"
                        style={{ height: `${Math.max((m.applications / maxApps) * 160, m.applications > 0 ? 4 : 1)}px` }}
                      />
                      <span className="text-[10px] text-slate-400 rotate-45 origin-left whitespace-nowrap">
                        {m.month.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown */}
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Grants by category</CardTitle>
              <CardDescription>Number of published grants per category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {category_stats.length === 0 ? (
                <p className="text-sm text-slate-500">No data yet.</p>
              ) : (
                category_stats.map((cat) => {
                  const pct = Math.round((cat.count / summary.total_grants) * 100);
                  return (
                    <div key={cat.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">{cat.category}</span>
                        <span className="text-slate-500">{cat.count} grants</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent grants */}
        {recent_grants.length > 0 && (
          <Card className="mt-8 rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recently published grants</CardTitle>
              <CardDescription>Grants added in the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {recent_grants.map((grant) => (
                  <div key={grant.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-900">{grant.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        {grant.category && (
                          <Badge variant="outline" className="rounded-full text-xs">{grant.category}</Badge>
                        )}
                        {grant.closes_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Closes {new Date(grant.closes_at).toLocaleDateString('en-AU')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(grant.total_budget)}</p>
                      <Badge
                        className={`mt-1 text-xs ${
                          grant.status === 'open'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {grant.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TransparencyDashboard;
