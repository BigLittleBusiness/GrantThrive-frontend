import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import {
  Trophy,
  DollarSign,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Calendar,
  Building2,
  Tag,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const PublicResults = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/public/api/results`);
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message || 'Failed to load results.');
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
          <p className="text-sm">Loading results…</p>
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

  const { summary, impact_by_category, recent_successes, completed_grants } = data;

  // Category filter list
  const categories = ['All', ...impact_by_category.map((c) => c.category)];
  const filteredSuccesses =
    activeCategory === 'All'
      ? recent_successes
      : recent_successes.filter((s) => s.category === activeCategory);

  // Max funding for bar scaling
  const maxFunding = Math.max(...impact_by_category.map((c) => c.funding), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <Trophy className="h-3.5 w-3.5" />
            Grant outcomes
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Public Results</h1>
          <p className="mt-2 text-sm text-slate-600">
            Approved grant recipients and funding outcomes across all council programs.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <DollarSign className="h-7 w-7 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total funding awarded</p>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(summary.total_funded)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-blue-50 p-4">
                <CheckCircle2 className="h-7 w-7 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Projects funded</p>
                <p className="text-3xl font-bold text-slate-900">{summary.total_projects.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Impact by category */}
        {impact_by_category.length > 0 && (
          <Card className="mb-8 rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Funding by category</CardTitle>
              <CardDescription>Total funding awarded per grant category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {impact_by_category.map((cat) => {
                const pct = Math.round((cat.funding / maxFunding) * 100);
                return (
                  <div key={cat.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">{cat.category}</span>
                      <span className="text-slate-500">
                        {cat.projects} project{cat.projects !== 1 ? 's' : ''} · {formatCurrency(cat.funding)}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2.5 rounded-full bg-amber-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Approved projects */}
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'border-amber-400 bg-amber-100 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredSuccesses.length === 0 ? (
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="py-16 text-center text-slate-500">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p>No approved projects to display yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSuccesses.map((project) => (
              <Card key={project.id} className="rounded-3xl border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{project.title}</CardTitle>
                    <div className="flex-shrink-0 rounded-full bg-emerald-100 p-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {project.organisation && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{project.organisation}</span>
                    </div>
                  )}
                  {project.grant_title && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Tag className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{project.grant_title}</span>
                    </div>
                  )}
                  {project.approved_at && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span>{new Date(project.approved_at).toLocaleDateString('en-AU')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    {project.category && (
                      <Badge variant="outline" className="rounded-full text-xs">{project.category}</Badge>
                    )}
                    <span className="font-bold text-slate-900">{formatCurrency(project.amount)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Completed grant programs */}
        {completed_grants.length > 0 && (
          <Card className="mt-10 rounded-3xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Completed grant programs</CardTitle>
              <CardDescription>Grant programs that have closed and finalised recipients.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {completed_grants.map((grant) => (
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
                            Closed {new Date(grant.closes_at).toLocaleDateString('en-AU')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(grant.total_budget)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {grant.approved_count} recipient{grant.approved_count !== 1 ? 's' : ''}
                      </p>
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

export default PublicResults;
