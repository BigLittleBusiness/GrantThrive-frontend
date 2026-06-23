import React, { useState, useEffect, useCallback } from 'react';
import NotificationBell from '../../components/common/NotificationBell';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import apiClient from '../../utils/api.js';
import { 
  Users, 
  FileText, 
  DollarSign, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Settings,
  BarChart3,
  Plus,
  UserCheck,
  QrCode,
  Vote,
  Map,
  LogOut,
  ClipboardList,
  CreditCard,
  User,
  UserPlus,
  MessageCircle,
  X,
} from 'lucide-react';

const CouncilAdminDashboard = ({ user, onNavigate, onLogout }) => {
  // ── SMS add-on prompt ─────────────────────────────────────────────────────
  const [showSmsBanner, setShowSmsBanner] = useState(false);
  const [smsBannerDismissed, setSmsBannerDismissed] = useState(
    () => sessionStorage.getItem('gt_sms_banner_dismissed') === 'true'
  );

  // ── Dashboard live data ───────────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [grantPrograms, setGrantPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [dashRes, appsRes, grantsRes] = await Promise.all([
        apiClient.councilGetDashboard().catch(() => null),
        apiClient.councilGetApplications({ status: 'submitted,under_review,pending_documents,committee_review' }).catch(() => ({ applications: [] })),
        apiClient.councilGetGrants().catch(() => ({ grants: [] })),
      ]);
      setDashboardData(dashRes);
      const apps = appsRes?.applications || appsRes || [];
      setPendingApplications(apps.slice(0, 10).map(app => ({
        id: app.id,
        applicant: app.organization_name || app.applicant_name || '—',
        program: app.grant_title || app.category || '—',
        amount: app.requested_amount || app.amount_requested || 0,
        submittedDate: app.submitted_at || app.created_at || '',
        daysWaiting: app.submitted_at
          ? Math.floor((Date.now() - new Date(app.submitted_at)) / 86400000)
          : 0,
        priority: app.priority || 'medium',
        status: app.status || 'submitted',
      })));
      const grants = grantsRes?.grants || grantsRes || [];
      setGrantPrograms(grants.map(g => ({
        id: g.id,
        name: g.title || g.name || '—',
        budget: g.total_budget || g.budget || 0,
        allocated: g.allocated_budget || g.allocated || 0,
        applications: g.application_count ?? 0,
        approved: g.approved_count ?? 0,
        status: g.status || 'active',
        deadline: g.closes_at || g.deadline || '',
      })));
    } catch (err) {
      setLoadError(err?.response?.data?.error || err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Derive admin metrics from live data
  const adminMetrics = {
    totalPrograms: grantPrograms.length || dashboardData?.total_grants || 0,
    activeApplications: pendingApplications.length || dashboardData?.active_applications || 0,
    pendingReviews: pendingApplications.filter(a => a.status === 'under_review' || a.status === 'committee_review').length || dashboardData?.pending_reviews || 0,
    totalBudget: grantPrograms.reduce((s, g) => s + g.budget, 0) || dashboardData?.total_budget || 0,
    approvedThisMonth: dashboardData?.approved_this_month || 0,
    rejectedThisMonth: dashboardData?.rejected_this_month || 0,
    communityMembers: dashboardData?.community_members || 0,
    averageProcessingTime: dashboardData?.average_processing_time_days || '—',
  };

  useEffect(() => {
    if (user?.role !== 'council_admin' || smsBannerDismissed) return;
    const councilId = user?.council_id;
    if (!councilId) return;
    apiClient.get(`/api/councils/${councilId}/sms-tiers`)
      .then(res => {
        const data = res.data || res;
        if (!data.current_tier && data.council_plan !== 'trial') {
          setShowSmsBanner(true);
        }
      })
      .catch(() => {});
  }, [user, smsBannerDismissed]);

  const handleDismissSmsBanner = () => {
    setShowSmsBanner(false);
    sessionStorage.setItem('gt_sms_banner_dismissed', 'true');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'pending_documents': return 'bg-yellow-100 text-yellow-800';
      case 'committee_review': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{loadError}</p>
          <button onClick={loadDashboard} className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Council Administration Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name || 'Administrator'}. Manage grant programs and oversee community funding.</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell onNavigate={onNavigate} />
              <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* SMS Add-on Prompt Banner */}
      {showSmsBanner && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 shrink-0 text-green-700" />
            <div>
              <p className="font-semibold text-green-900">Boost community engagement with SMS notifications</p>
              <p className="mt-0.5 text-sm text-green-800">
                Keep applicants informed at every stage. Plans start at just $19/month for up to 500 messages.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              className="bg-green-700 hover:bg-green-800 text-white"
              onClick={() => { handleDismissSmsBanner(); onNavigate('account-billing'); }}
            >
              View SMS Plans
            </Button>
            <button
              onClick={handleDismissSmsBanner}
              className="rounded-lg p-1.5 text-green-600 hover:bg-green-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button 
          className="h-14 bg-green-700 hover:bg-green-800"
          onClick={() => onNavigate('create-grant')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Grant Program
        </Button>
        <Button variant="outline" className="h-14" onClick={() => onNavigate('grants')}>
          <FileText className="w-5 h-5 mr-2" />
          Review Applications
        </Button>
        <Button variant="outline" className="h-14" onClick={() => onNavigate('admin-approvals')}>
          <UserCheck className="w-5 h-5 mr-2" />
          Staff Approvals
        </Button>
        <Button variant="outline" className="h-14" onClick={() => onNavigate('communication-settings')}>
          <BarChart3 className="w-5 h-5 mr-2" />
          Reports &amp; Settings
        </Button>
      </div>

      {/* Secondary Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Button variant="outline" className="h-12" onClick={() => onNavigate('analytics')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('review-workflow')}>
          <ClipboardList className="w-4 h-4 mr-2" />
          Review Workflow
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('winners-showcase')}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Winners Showcase
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Button variant="outline" className="h-12" onClick={() => onNavigate('community-voting')}>
          <Vote className="w-4 h-4 mr-2" />
          Community Voting
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('qr-code-management')}>
          <QrCode className="w-4 h-4 mr-2" />
          QR Codes
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('grant-map')}>
          <Map className="w-4 h-4 mr-2" />
          Grant Map
        </Button>
      </div>

      {/* Management & Account Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Button variant="outline" className="h-12" onClick={() => onNavigate('staff-management')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Manage Staff
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('pending-approvals')}>
          <ClipboardList className="w-4 h-4 mr-2" />
          Pending Approvals
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('community-forum')}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Community Forum
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('account-billing')}>
          <CreditCard className="w-4 h-4 mr-2" />
          Account &amp; Billing
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('profile')}>
          <User className="w-4 h-4 mr-2" />
          My Profile
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('grants')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Programs</p>
                <p className="text-3xl font-bold text-blue-600">{adminMetrics.totalPrograms}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('grants')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-3xl font-bold text-orange-600">{adminMetrics.pendingReviews}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(adminMetrics.totalBudget)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Community Members</p>
                <p className="text-3xl font-bold text-purple-600">{adminMetrics.communityMembers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Applications Requiring Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Applications Requiring Review</span>
              <Badge variant="destructive">{adminMetrics.pendingReviews} Pending</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApplications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{app.applicant}</h4>
                      <p className="text-sm text-gray-600">{app.program}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(app.priority)}>
                        {app.priority}
                      </Badge>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(app.amount)}
                    </span>
                    <span className="text-gray-500">
                      {app.daysWaiting} days waiting
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" onClick={() => onNavigate('grant-details')}>
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onNavigate('communication-settings')}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => onNavigate('grants')}>
                View All Applications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grant Programs Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Grant Programs Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {grantPrograms.map((program) => (
                <div key={program.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{program.name}</h4>
                      <p className="text-sm text-gray-600">
                        {program.applications} applications • {program.approved} approved
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget Allocated</span>
                      <span>{Math.round((program.allocated / program.budget) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(program.allocated / program.budget) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatCurrency(program.allocated)}</span>
                      <span>{formatCurrency(program.budget)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Deadline: {program.deadline}</span>
                    <Button size="sm" variant="outline" onClick={() => onNavigate('grant-details')}>
                      <Settings className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => onNavigate('create-grant')}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Grant Program
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Summary */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>This Month's Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{adminMetrics.approvedThisMonth}</p>
                <p className="text-sm text-gray-600">Applications Approved</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{adminMetrics.rejectedThisMonth}</p>
                <p className="text-sm text-gray-600">Applications Rejected</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">{adminMetrics.averageProcessingTime}</p>
                <p className="text-sm text-gray-600">Avg. Processing Days</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((adminMetrics.approvedThisMonth / (adminMetrics.approvedThisMonth + adminMetrics.rejectedThisMonth)) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Approval Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};
export default CouncilAdminDashboard;
