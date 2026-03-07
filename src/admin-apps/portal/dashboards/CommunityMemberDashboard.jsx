import React from 'react';
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
} from 'lucide-react';

const CommunityMemberDashboard = ({ user, onNavigate, onLogout }) => {
  const memberMetrics = {
    totalApplications: 5,
    activeApplications: 2,
    approvedApplications: 2,
    totalFundingReceived: 85000,
    successRate: 67,
  };

  const myApplications = [
    {
      id: 1,
      title: 'Youth Music Program Expansion',
      program: 'Youth Programs Initiative',
      amount: 25000,
      status: 'under_review',
      submittedDate: '2024-02-10',
      council: 'Melbourne City Council',
      progress: 60,
      nextStep: 'Awaiting committee review',
      estimatedDecision: '2024-02-25',
    },
    {
      id: 2,
      title: 'Community Garden Sustainability Project',
      program: 'Environmental Sustainability Fund',
      amount: 45000,
      status: 'approved',
      submittedDate: '2024-01-15',
      council: 'Melbourne City Council',
      progress: 100,
      nextStep: 'Funding agreement signed',
      estimatedDecision: 'Completed',
    },
    {
      id: 3,
      title: 'Senior Citizens Digital Literacy',
      program: 'Community Development Grant',
      amount: 15000,
      status: 'in_progress',
      submittedDate: '2024-02-05',
      council: 'Melbourne City Council',
      progress: 30,
      nextStep: 'Provide additional documentation',
      estimatedDecision: '2024-03-01',
    },
  ];

  const recommendedGrants = [
    {
      id: 1,
      title: 'Arts & Culture Development Grant',
      description: 'Support for community arts initiatives, cultural events, and creative programs.',
      amount: 50000,
      deadline: '2024-03-15',
      council: 'Melbourne City Council',
      category: 'Arts & Culture',
      applicants: 18,
      matchScore: 95,
    },
    {
      id: 2,
      title: 'Community Health & Wellbeing Initiative',
      description: 'Funding for health promotion programs, mental health support, and wellness activities.',
      amount: 35000,
      deadline: '2024-02-28',
      council: 'Port Phillip Council',
      category: 'Health',
      applicants: 12,
      matchScore: 88,
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Grant Writing Workshop',
      date: '2024-02-20',
      time: '2:00 PM - 4:00 PM',
      type: 'Workshop',
      location: 'Melbourne Town Hall',
      spots: 15,
    },
    {
      id: 2,
      title: 'Community Funding Information Session',
      date: '2024-02-25',
      time: '6:00 PM - 7:30 PM',
      type: 'Information Session',
      location: 'Online',
      spots: 50,
    },
  ];

  const nextActions = [
    {
      id: 1,
      title: 'Upload supporting documents',
      detail: 'Senior Citizens Digital Literacy',
      tone: 'amber',
    },
    {
      id: 2,
      title: 'Review decision timeline',
      detail: 'Youth Music Program Expansion',
      tone: 'blue',
    },
    {
      id: 3,
      title: 'Explore matched grants',
      detail: '2 opportunities recommended',
      tone: 'green',
    },
  ];

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);

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
        return {
          label: 'Action needed',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
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
                {myApplications.map((app) => {
                  const statusMeta = getStatusMeta(app.status);

                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{app.title}</h3>
                            <Badge className={`border ${statusMeta.className}`}>
                              <span className="flex items-center gap-1">
                                {statusMeta.icon}
                                {statusMeta.label}
                              </span>
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-slate-600">{app.program}</p>

                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <p>
                              <span className="font-medium text-slate-900">Amount:</span>{' '}
                              {formatCurrency(app.amount)}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Council:</span>{' '}
                              {app.council}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Next step:</span>{' '}
                              {app.nextStep}
                            </p>
                            <p>
                              <span className="font-medium text-slate-900">Expected decision:</span>{' '}
                              {app.estimatedDecision}
                            </p>
                          </div>
                        </div>

                        <div className="w-full lg:max-w-[240px]">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-500">Progress</span>
                            <span className="font-medium text-slate-900">{app.progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-slate-900"
                              style={{ width: `${app.progress}%` }}
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

                            {app.status === 'in_progress' && (
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
                })}

                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => onNavigate('community/grants')}
                >
                  Browse more grants
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Recommended grants */}
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Recommended grants</CardTitle>
                  <CardDescription>
                    Opportunities matched to your profile and activity.
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
                {recommendedGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className="rounded-2xl border border-slate-200 p-5 transition-shadow hover:shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                        {grant.matchScore}% match
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {grant.category}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">{grant.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{grant.description}</p>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(grant.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Deadline</span>
                        <span className="font-medium text-slate-900">{grant.deadline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Applicants</span>
                        <span className="font-medium text-slate-900">{grant.applicants}</span>
                      </div>
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
                ))}
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
                <CardTitle className="text-lg">Upcoming events</CardTitle>
                <CardDescription>
                  Workshops and sessions that can improve your application quality.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {event.date} • {event.time}
                    </p>
                    <p className="text-sm text-slate-600">{event.location}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="rounded-full">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-slate-500">{event.spots} spots left</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full rounded-xl"
                      onClick={() => onNavigate('community/community-forum')}
                    >
                      Register
                    </Button>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMemberDashboard;