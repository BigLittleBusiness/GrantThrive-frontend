import React, { useState, useEffect, useCallback } from 'react';
import NotificationBell from '../../components/common/NotificationBell';
import StaffNavbar from '../../components/layout/StaffNavbar.jsx';
import apiClient from '../../utils/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { 
  FileText, 
  Clock, 
  CheckCircle,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  User,
  Eye,
  Edit,
  Download,
  LogOut,
  ClipboardList,
  MapPin
} from 'lucide-react';

const CouncilStaffDashboard = ({ user, onNavigate, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Load dashboard summary and assigned applications in parallel
      const [dashRes, appsRes] = await Promise.all([
        apiClient.councilGetDashboard().catch(() => null),
        apiClient.councilGetApplications({ assigned_to_me: true }).catch(() => ({ applications: [] })),
      ]);
      setDashboardData(dashRes);
      const apps = appsRes?.applications || appsRes || [];
      setMyApplications(apps.map(app => ({
        id: app.id,
        applicant: app.organization_name || app.applicant_name || '—',
        contact: app.primary_contact_name || '—',
        email: app.primary_contact_email || '',
        phone: app.primary_contact_phone || '',
        program: app.grant_title || app.category || '—',
        amount: app.requested_amount || app.amount_requested || 0,
        status: app.status || 'submitted',
        priority: app.priority || 'medium',
        assignedDate: app.assigned_at || app.created_at || '',
        dueDate: app.review_due_at || app.closes_at || '',
        completionPercent: app.completion_percent ?? 0,
        lastAction: app.last_action || app.latest_note || '',
      })));
    } catch (err) {
      setLoadError(err?.response?.data?.error || err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Derive metrics from live data
  const staffMetrics = {
    assignedApplications: myApplications.length,
    pendingReview: myApplications.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
    awaitingDocuments: myApplications.filter(a => a.status === 'awaiting_documents').length,
    completedToday: dashboardData?.completed_today ?? 0,
    averageReviewTime: dashboardData?.average_review_time_days ?? '—',
    communityContacts: dashboardData?.community_contacts ?? '—',
  };

  // Tasks are derived from high-priority applications needing action
  const todaysTasks = myApplications
    .filter(a => a.status !== 'approved' && a.status !== 'declined')
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      task: a.lastAction || `Review application: ${a.applicant}`,
      type: a.status === 'awaiting_documents' ? 'communication' : 'review',
      priority: a.priority,
      estimatedTime: '—',
      dueTime: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—',
    }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'review_in_progress': return 'bg-blue-100 text-blue-800';
      case 'awaiting_documents': return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_approval': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'review': return <FileText className="w-4 h-4" />;
      case 'communication': return <MessageSquare className="w-4 h-4" />;
      case 'documentation': return <Edit className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StaffNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StaffNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-4">{loadError}</p>
            <button onClick={loadDashboard} className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="dashboard" />
      <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Grant Reviews Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || 'Staff Member'}. Manage your assigned applications and community engagement tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell onNavigate={onNavigate} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button className="h-14 bg-green-700 hover:bg-green-800" onClick={() => onNavigate('grants')}>
          <FileText className="w-5 h-5 mr-2" />
          Start Review
        </Button>
        <Button variant="outline" className="h-14" onClick={() => onNavigate('pending-approvals')}>
          <ClipboardList className="w-5 h-5 mr-2" />
          Pending Approvals
        </Button>
        <Button variant="outline" className="h-14" onClick={() => onNavigate('resource-hub')}>
          <Download className="w-5 h-5 mr-2" />
          Resources &amp; Reports
        </Button>
        <Button variant="outline" className="h-14" onClick={() => onNavigate('community-forum')}>
          <MessageSquare className="w-5 h-5 mr-2" />
          Community Forum
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Button variant="outline" className="h-12" onClick={() => onNavigate('communication-settings')}>
          <Mail className="w-4 h-4 mr-2" />
          Contact Applicant
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('profile')}>
          <User className="w-4 h-4 mr-2" />
          My Profile
        </Button>
        <Button variant="outline" className="h-12" onClick={() => onNavigate('grant-map')}>
          <MapPin className="w-4 h-4 mr-2" />
          Grant Map
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('grants')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned to Me</p>
                <p className="text-3xl font-bold text-blue-600">{staffMetrics.assignedApplications}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('grants')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-orange-600">{staffMetrics.pendingReview}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">{staffMetrics.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
                <p className="text-3xl font-bold text-purple-600">{staffMetrics.averageReviewTime}d</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Applications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{app.applicant}</h4>
                        <p className="text-sm text-gray-600">{app.program}</p>
                        <p className="text-sm font-semibold text-green-600">{formatCurrency(app.amount)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(app.priority)}>
                          {app.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{app.contact}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{app.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{app.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Review Progress</span>
                        <span>{app.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${app.completionPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <p><strong>Last Action:</strong> {app.lastAction}</p>
                      <p><strong>Due:</strong> {app.dueDate}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => onNavigate('grant-details')}>
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onNavigate('communication-settings')}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onNavigate('grant-details')}>
                        <Edit className="w-4 h-4 mr-1" />
                        Update
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
        </div>

        {/* Today's Tasks */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0">
                        {getTaskIcon(task.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.task}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">{task.estimatedTime}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Due: {task.dueTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>This Week's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Applications Reviewed</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recommendations Made</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Community Contacts</span>
                  <span className="font-semibold">{staffMetrics.communityContacts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="font-semibold">2.3 hours</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => onNavigate('resource-hub')}>
                View Resources
              </Button>
            </CardContent>
          </Card>
         </div>
      </div>
      </div>
    </div>
  );
};
export default CouncilStaffDashboard;
