import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { 
  Search, 
  Filter, 
  Eye, 
  Star, 
  MessageSquare, 
  Download, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  DollarSign,
  BarChart3,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Send,
  Lightbulb
} from 'lucide-react';

const ApplicationReviewWorkflow = ({ grantId, user, onNavigate, onLogout }) => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showScoring, setShowScoring] = useState(false);
  const [scores, setScores] = useState({});

  // ── Normalise backend application shape to local shape ────────────────────
  const normaliseApp = (app) => ({
    id: app.id,
    applicantName: app.applicant_name || app.primary_contact_name || 'Unknown',
    organization: app.organization_name || '—',
    submissionDate: app.submitted_at || app.created_at || '',
    status: app.status || 'submitted',
    score: app.total_score ?? null,
    amount: app.requested_amount || app.amount_requested || 0,
    projectTitle: app.project_title || '—',
    category: app.category || '—',
    priority: app.priority || 'medium',
    reviewers: app.assigned_staff?.map(s => s.name || s.email) || [],
    documents: app.documents || [],
    summary: app.project_description || app.summary || '',
  });

  // ── Load applications from API ────────────────────────────────────────────
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const filters = grantId ? { grant_id: grantId } : {};
      const data = await apiClient.councilGetApplications(filters);
      const raw = data?.applications || data || [];
      const normalised = raw.map(normaliseApp);
      setApplications(normalised);
      setFilteredApplications(normalised);
    } catch (err) {
      setLoadError(err?.response?.data?.error || err.message || 'Failed to load applications.');
    } finally {
      setIsLoading(false);
    }
  }, [grantId]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  // ── Compute sidebar analytics from live data ──────────────────────────────
  const computeAnalytics = (apps) => {
    const total = apps.length || 1;
    const underReview = apps.filter(a => a.status === 'under_review').length;
    const approved = apps.filter(a => a.status === 'approved').length;
    const declined = apps.filter(a => a.status === 'declined' || a.status === 'rejected').length;
    const categories = apps.reduce((acc, a) => {
      if (a.category && a.category !== '—') acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {});
    const topThemes = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
    return {
      underReview: Math.round((underReview / total) * 100),
      approved: Math.round((approved / total) * 100),
      declined: Math.round((declined / total) * 100),
      commonThemes: topThemes.length > 0 ? topThemes : ['No data yet'],
      recommendation: underReview > approved
        ? 'Several applications are awaiting review — consider prioritising by deadline.'
        : 'Review pipeline is on track.',
    };
  };

  const analytics = computeAnalytics(applications);

  useEffect(() => {
    let filtered = applications;

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(app => app.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort applications
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'latest':
          return new Date(b.submissionDate) - new Date(a.submissionDate);
        case 'oldest':
          return new Date(a.submissionDate) - new Date(b.submissionDate);
        case 'amount_high':
          return b.amount - a.amount;
        case 'amount_low':
          return a.amount - b.amount;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, activeTab, searchTerm, sortBy]);

  const getStatusBadge = (status, score) => {
    switch(status) {
      case 'under_review':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Under Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-red-600 border-red-600">Declined</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Submitted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScoreBadge = (score) => {
    if (!score) return null;
    
    let colorClass = 'bg-gray-100 text-gray-800';
    if (score >= 70) colorClass = 'bg-green-100 text-green-800';
    else if (score >= 60) colorClass = 'bg-yellow-100 text-yellow-800';
    else colorClass = 'bg-red-100 text-red-800';
    
    return (
      <div className={`px-2 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        {score}
      </div>
    );
  };

  const handleScoreApplication = (applicationId, criteria, score) => {
    setScores(prev => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        [criteria]: score
      }
    }));
  };

  const submitReview = async (applicationId, decision, finalScore, comments, recommendation) => {
    try {
      await apiClient.post(`/api/applications/${applicationId}/review`, {
        total_score:    parseFloat(finalScore) || 0,
        recommendation: recommendation || decision,
        comments:       comments || '',
        is_complete:    true,
      });
      // Optimistically update local state
      setApplications(prev => prev.map(app =>
        app.id === applicationId
          ? { ...app, status: decision, score: parseFloat(finalScore) || 0 }
          : app
      ));
      setSelectedApplication(null);
    } catch (error) {
      alert(error?.response?.data?.error || error.message || 'Error submitting review. Please try again.');
    }
  };

  const ApplicationCard = ({ application }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{application.applicantName}</h3>
            <p className="text-gray-600">{application.organization}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(application.status)}
            {getScoreBadge(application.score)}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-1">{application.projectTitle}</h4>
          <p className="text-gray-600 text-sm">{application.summary}</p>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <span>Application</span>
          <span>{new Date(application.submissionDate).toLocaleDateString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-green-600">
            ${application.amount.toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedApplication(application)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-1" />
              Rate
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ApplicationDetailModal = ({ application, onClose }) => {
    const [reviewData, setReviewData] = useState({
      scores: {
        impact: 0,
        feasibility: 0,
        budget: 0,
        sustainability: 0,
        innovation: 0
      },
      comments: '',
      recommendation: ''
    });

    const scoringCriteria = [
      { key: 'impact', label: 'Community Impact', weight: 30 },
      { key: 'feasibility', label: 'Project Feasibility', weight: 25 },
      { key: 'budget', label: 'Budget Appropriateness', weight: 20 },
      { key: 'sustainability', label: 'Long-term Sustainability', weight: 15 },
      { key: 'innovation', label: 'Innovation & Creativity', weight: 10 }
    ];

    const calculateTotalScore = () => {
      return scoringCriteria.reduce((total, criteria) => {
        return total + (reviewData.scores[criteria.key] * criteria.weight / 100);
      }, 0);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{application.projectTitle}</h2>
              <Button variant="outline" onClick={onClose}>×</Button>
            </div>
            <p className="text-gray-600">{application.applicantName} - {application.organization}</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Application Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Summary</label>
                    <p className="mt-1 text-gray-900">{application.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Requested Amount</label>
                      <p className="mt-1 text-lg font-semibold text-green-600">
                        ${application.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="mt-1 text-gray-900">{application.category}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submission Date</label>
                    <p className="mt-1 text-gray-900">
                      {new Date(application.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Reviewers</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {application.reviewers.map(reviewer => (
                        <Badge key={reviewer} variant="outline">{reviewer}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Documents</label>
                    <div className="mt-1 space-y-2">
                      {application.documents.map(doc => (
                        <div key={doc} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{doc}</span>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scoring Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Review & Scoring</h3>
                
                <div className="space-y-4">
                  {scoringCriteria.map(criteria => (
                    <div key={criteria.key}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          {criteria.label} ({criteria.weight}%)
                        </label>
                        <span className="text-sm text-gray-500">
                          {reviewData.scores[criteria.key]}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={reviewData.scores[criteria.key]}
                        onChange={(e) => setReviewData(prev => ({
                          ...prev,
                          scores: {
                            ...prev.scores,
                            [criteria.key]: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full"
                      />
                    </div>
                  ))}
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Score:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {calculateTotalScore().toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Comments
                    </label>
                    <textarea
                      value={reviewData.comments}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        comments: e.target.value
                      }))}
                      rows={4}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Provide detailed feedback on the application..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommendation
                    </label>
                    <select
                      value={reviewData.recommendation}
                      onChange={(e) => setReviewData(prev => ({
                        ...prev,
                        recommendation: e.target.value
                      }))}
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="">Select recommendation...</option>
                      <option value="approve">Approve</option>
                      <option value="approve_with_conditions">Approve with Conditions</option>
                      <option value="request_more_info">Request More Information</option>
                      <option value="decline">Decline</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Save Draft
              </Button>
              <Button 
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => submitReview(application.id, 'declined', calculateTotalScore(), reviewData.comments, reviewData.recommendation || 'decline')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button 
                className="bg-green-700 hover:bg-green-800"
                onClick={() => submitReview(application.id, 'approved', calculateTotalScore(), reviewData.comments, reviewData.recommendation || 'approve')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{loadError}</p>
          <Button onClick={loadApplications} className="bg-green-700 hover:bg-green-800">Retry</Button>
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
              <h1 className="text-2xl font-bold text-gray-900">Application Review</h1>
              <p className="text-gray-600">Review and assess grant applications.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => onNavigate('council/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Applications Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold">Applications</h2>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {filteredApplications.length}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="latest">Sort by: Latest</option>
                  <option value="oldest">Sort by: Oldest</option>
                  <option value="amount_high">Sort by: Amount (High)</option>
                  <option value="amount_low">Sort by: Amount (Low)</option>
                  <option value="priority">Sort by: Priority</option>
                </select>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex space-x-1 mb-6">
              {[
                { key: 'all', label: 'All' },
                { key: 'submitted', label: 'Submitted' },
                { key: 'under_review', label: 'Under Review' },
                { key: 'approved', label: 'Approved' },
                { key: 'declined', label: 'Declined' }
              ].map(tab => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Applications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredApplications.map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>

          {/* AI Insights Sidebar */}
          <div className="w-80">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>AI Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Application Analytics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Under Review</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{width: `${analytics.underReview}%`}}></div>
                          </div>
                          <span className="text-sm font-medium">{analytics.underReview}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Approved</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: `${analytics.approved}%`}}></div>
                          </div>
                          <span className="text-sm font-medium">{analytics.approved}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Declined</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: `${analytics.declined}%`}}></div>
                          </div>
                          <span className="text-sm font-medium">{analytics.declined}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Common Themes</h3>
                    <ul className="space-y-2">
                      {analytics.commonThemes.map(theme => (
                        <li key={theme} className="text-sm flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{theme}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Recommendation</h3>
                    <p className="text-sm text-gray-600">{analytics.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal 
          application={selectedApplication} 
          onClose={() => setSelectedApplication(null)} 
        />
      )}
    </div>
  );
};

export default ApplicationReviewWorkflow;

