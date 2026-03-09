import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import {
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  MessageSquare,
  Trophy,
  BookOpen,
  Eye,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Vote,
  Map,
  LogOut,
  Sparkles,
  Target,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import apiClient from '../utils/api.js';

const CommunityMemberDashboard = ({ user, onNavigate, onLogout }) => {
  const [applications, setApplications] = useState([]);
  const [recommendedGrants, setRecommendedGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derived metrics computed from live application data
  const memberMetrics = React.useMemo(() => {
    const total = applications.length;
    const active = applications.filter(
      (a) => ['submitted', 'under_review', 'in_progress'].includes(a.status)
    ).length;
    const approved = applications.filter((a) => a.status === 'approved').length;
    const fundingReceived = applications
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + (a.amount_requested || 0), 0);
    const decided = applications.filter((a) =>
      ['approved', 'rejected'].includes(a.status)
    ).length;
    const successRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
    return { totalApplications: total, activeApplications: active, approvedApplications: approved, totalFundingReceived: fundingReceived, successRate };
  }, [applications]);

  // Next-actions derived from real application states
  const nextActions = React.useMemo(() => {
    const actions = [];
    applications.forEach((app) => {
      if (app.status === 'in_progress' || app.status === 'draft') {
        actions.push({
          id: `action-${app.id}`,
          title: 'Action required',
          detail: app.title || app.grant_title || 'Your application',
          tone: 'amber',
        });
      }
    });
    if (actions.length === 0) {
      actions.push({
        id: 'explore',
        title: 'Explore matched grants',
        detail: 'Browse open opportunities',
        tone: 'green',
      });
    }
    return actions.slice(0, 3);
  }, [applications]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load own applications
        const appsData = await apiClient.getApplications();
        const appsList = Array.isArray(appsData)
          ? appsData
          : appsData?.applications || appsData?.data || [];
        setApplications(appsList);

        // Load open grants for recommendations panel
        try {
          const grantsData = await apiClient.getGrants({ status: 'open', limit: 4 });
          const grantsList = Array.isArray(grantsData)
            ? grantsData
            : grantsData?.grants || grantsData?.data || [];
          setRecommendedGrants(grantsList.slice(0, 4));
        } catch {
          // Recommended grants are non-critical — silently ignore
          setRecommendedGrants([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load your dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const getStatusMeta = (status) => {
    switch (status) {
      case 'under_review':
        return {
          label: 'Under review',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="h-4 w-4" />,
        };
      case 'approved':
        return {
          label: 'Approved',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="h-4 w-4" />,
        };
      case 'in_progress':
      case 'draft':
        return {
          label: 'Action needed',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertCircle className="h-4 w-4" />,
        };
      case 'rejected':
        return {
          label: 'Unsuccessful',
          className: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertCircle className="h-4 w-4" />,
        };
      default:
        return {
          label: 'Submitted',
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <FileText className="h-4 w-4" />,
        };
    }
  };

  const getProgressFromStatus = (status) => {
    switch (status) {
      case 'draft': return 10;
      case 'submitted': return 30;
      case 'under_review': return 60;
      case 'in_progress': return 40;
      case 'approved': return 100;
      case 'rejected': return 100;
      default: return 20;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              Community portal
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track your applications, discover matching grants, and keep your submissions moving.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800"
              onClick={() => onNavigate('community/grants')}
            >
              Browse grants
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => onNavigate('community/application-form')}
            >
              Continue application
            </Button>
            <Button variant="outline" onClick={onLogout} className="rounded-xl">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Applications</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {memberMetrics.totalApplications}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3">
                  <FolderOpen className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active now</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {memberMetrics.activeApplications}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3">
                  <Clock className="h-6 w-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Success rate</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {memberMetrics.successRate}%
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <TrendingUp className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Funding received</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatCurrency(memberMetrics.totalFundingReceived)}
                  </p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-3">
                  <DollarSign className="h-6 w-6 text-teal-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* Main content */}
          <div className="xl:col-span-2 space-y-8">
            {/* My applications */}
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">My applications</CardTitle>
                  <CardDescription>
                    Track progress, decisions, and outstanding actions.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {memberMetrics.activeApplications} active
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {applications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                    <FolderOpen className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="font-medium">No applications yet</p>
                    <p className="mt-1 text-sm">Browse available grants to get started.</p>
                    <Button
                      className="mt-4 rounded-xl bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => onNavigate('community/grants')}
                    >
                      Browse grants
                    </Button>
                  </div>
                ) : (
                  applications.slice(0, 5).map((app) => {
                    const statusMeta = getStatusMeta(app.status);
                    const progress = getProgressFromStatus(app.status);

                    return (
                      <div
                        key={app.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {app.title || app.grant_title || 'Application'}
                              </h3>
                              <Badge className={`border ${statusMeta.className}`}>
                                <span className="flex items-center gap-1">
                                  {statusMeta.icon}
                                  {statusMeta.label}
                                </span>
                              </Badge>
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                              {app.grant_program || app.program || ''}
                            </p>

                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                              <p>
                                <span className="font-medium text-slate-900">Amount:</span>{' '}
                                {formatCurrency(app.amount_requested)}
                              </p>
                              {app.council_name && (
                                <p>
                                  <span className="font-medium text-slate-900">Council:</span>{' '}
                                  {app.council_name}
                                </p>
                              )}
                              {app.submitted_at && (
                                <p>
                                  <span className="font-medium text-slate-900">Submitted:</span>{' '}
                                  {new Date(app.submitted_at).toLocaleDateString('en-AU')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="w-full lg:max-w-[240px]">
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="text-slate-500">Progress</span>
                              <span className="font-medium text-slate-900">{progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-slate-900"
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            <div className="mt-4 flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 rounded-xl"
                                onClick={() => onNavigate('community/grant-details')}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View
                              </Button>

                              {(app.status === 'in_progress' || app.status === 'draft') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => onNavigate('community/application-form')}
                                >
                                  Update
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {applications.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => onNavigate('community/grants')}
                  >
                    Browse more grants
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recommended grants */}
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recommended grants</CardTitle>
                  <CardDescription>
                    Open opportunities available in your area.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => onNavigate('community/grants')}
                >
                  View all
                </Button>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {recommendedGrants.length === 0 ? (
                  <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No open grants found at this time.
                  </div>
                ) : (
                  recommendedGrants.map((grant) => (
                    <div
                      key={grant.id}
                      className="rounded-2xl border border-slate-200 p-5 transition-shadow hover:shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          Open
                        </Badge>
                        {grant.category && (
                          <Badge variant="outline" className="rounded-full">
                            {grant.category}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">{grant.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">
                        {grant.description}
                      </p>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Amount</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(grant.max_amount || grant.amount)}
                          </span>
                        </div>
                        {grant.closing_date && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Closes</span>
                            <span className="font-medium text-slate-900">
                              {new Date(grant.closing_date).toLocaleDateString('en-AU')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 flex gap-2">
                        <Button
                          className="flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => onNavigate('community/application-form')}
                        >
                          Apply now
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => onNavigate('community/grant-details')}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Next actions</CardTitle>
                <CardDescription>
                  Stay on top of the most important things to do.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nextActions.map((action) => (
                  <div key={action.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-slate-100 p-2">
                        <Target className="h-4 w-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{action.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{action.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Helpful resources</CardTitle>
                <CardDescription>
                  Guidance to strengthen your grant applications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Start early so you have time to refine your submission.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Use workshops and community sessions to improve quality.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Respond quickly when extra information is requested.</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onNavigate('community/resource-hub')}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Resources
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onNavigate('community/community-forum')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Forum
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Explore community</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={() => onNavigate('community/community-voting')}
                >
                  <Vote className="mr-2 h-4 w-4" />
                  Community voting
                </Button>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={() => onNavigate('community/grant-map')}
                >
                  <Map className="mr-2 h-4 w-4" />
                  Grant map
                </Button>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={() => onNavigate('community/winners-showcase')}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Winners showcase
                </Button>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={() => onNavigate('community/transparency')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Transparency dashboard
                </Button>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={() => onNavigate('community/public-results')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Public results
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMemberDashboard;
