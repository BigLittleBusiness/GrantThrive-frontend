import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AuthGateModal from '../../components/common/AuthGateModal.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Heart,
  Share2,
  ExternalLink,
  FileText,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Edit,
  Eye,
} from 'lucide-react';
import { communityGetApplications } from '../../utils/api.js';

// ─── My Applications tab ─────────────────────────────────────────────────────

const APPLICATION_STATUS_CONFIG = {
  draft:       { label: 'Draft',        colour: 'bg-gray-100 text-gray-700',   icon: Edit },
  in_progress: { label: 'In progress',  colour: 'bg-blue-100 text-blue-700',   icon: RotateCcw },
  submitted:   { label: 'Submitted',    colour: 'bg-yellow-100 text-yellow-700', icon: Clock },
  under_review:{ label: 'Under review', colour: 'bg-purple-100 text-purple-700', icon: Eye },
  approved:    { label: 'Approved',     colour: 'bg-green-100 text-green-700',  icon: CheckCircle },
  rejected:    { label: 'Rejected',     colour: 'bg-red-100 text-red-700',     icon: AlertCircle },
};

function MyApplicationsPanel({ onNavigate }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityGetApplications();
      setApplications(Array.isArray(data) ? data : (data?.applications ?? []));
    } catch (err) {
      setError('Unable to load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statuses = ['all', 'draft', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected'];

  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
        <p className="text-gray-700">{error}</p>
        <Button variant="outline" className="mt-4" onClick={load}>Try again</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Status filter strip */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statuses.map(s => {
          const cfg = APPLICATION_STATUS_CONFIG[s];
          const label = s === 'all' ? 'All applications' : cfg.label;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-green-600 hover:text-green-700'
              }`}
            >
              {label}
              {s !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({applications.filter(a => a.status === s).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-24 text-center">
          <FileText className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">
            {statusFilter === 'all' ? 'No applications yet' : `No ${APPLICATION_STATUS_CONFIG[statusFilter]?.label.toLowerCase()} applications`}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {statusFilter === 'all'
              ? 'Browse available grants and click Apply now to get started.'
              : 'Try selecting a different status filter above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const cfg = APPLICATION_STATUS_CONFIG[app.status] ?? APPLICATION_STATUS_CONFIG.draft;
            const StatusIcon = cfg.icon;
            const canContinue = app.status === 'draft' || app.status === 'in_progress';
            return (
              <Card key={app.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.colour}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        {app.grant_category && (
                          <Badge variant="outline" className="text-xs">{app.grant_category}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {app.grant_title ?? app.project_title ?? `Application #${app.id}`}
                      </h3>
                      {app.council_name && (
                        <p className="text-sm text-gray-500 mt-0.5">{app.council_name}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {app.amount_requested && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${Number(app.amount_requested).toLocaleString()} requested
                          </span>
                        )}
                        {app.submitted_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Submitted {new Date(app.submitted_at).toLocaleDateString('en-AU')}
                          </span>
                        )}
                        {app.updated_at && !app.submitted_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last saved {new Date(app.updated_at).toLocaleDateString('en-AU')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {canContinue ? (
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 whitespace-nowrap"
                          onClick={() => onNavigate && onNavigate(`community/application-form/${app.id}`)}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigate && onNavigate(`community/application-form/${app.id}`)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Browse Grants tab ────────────────────────────────────────────────────────

const GRANTS = [
  {
    id: 1, title: 'Community Development Grant', category: 'Community',
    amount: 5000, status: 'Open', daysLeft: 10,
    description: 'Support local community initiatives that bring people together and strengthen neighbourhood connections through events, programs, and infrastructure improvements.',
    location: 'Mount Isa', applicants: 23, successRate: 75,
    tags: ['Community Building', 'Local Events', 'Infrastructure'],
  },
  {
    id: 2, title: 'Local Arts Support Program', category: 'Arts',
    amount: 12000, status: 'Open', daysLeft: 30,
    description: 'Funding for local artists, art installations, cultural events, and creative workshops that enhance the cultural landscape of our community.',
    location: 'Mount Isa', applicants: 15, successRate: 68,
    tags: ['Visual Arts', 'Performing Arts', 'Cultural Events'],
  },
  {
    id: 3, title: 'Sports Equipment Grant', category: 'Sports',
    amount: 3000, status: 'Closing Soon', daysLeft: 7,
    description: 'Equipment grants for local sports clubs and recreational groups to purchase essential sporting equipment and safety gear.',
    location: 'Mount Isa', applicants: 31, successRate: 82,
    tags: ['Equipment', 'Youth Sports', 'Safety'],
  },
  {
    id: 4, title: 'Environmental Sustainability Fund', category: 'Environment',
    amount: 6000, status: 'Open', daysLeft: 23,
    description: 'Projects focused on environmental conservation, renewable energy, waste reduction, and sustainable community practices.',
    location: 'Mount Isa', applicants: 18, successRate: 71,
    tags: ['Sustainability', 'Conservation', 'Green Energy'],
  },
  {
    id: 5, title: 'Youth Leadership Program', category: 'Education',
    amount: 8000, status: 'Open', daysLeft: 45,
    description: 'Empowering young people through leadership development, mentorship programs, and skill-building workshops.',
    location: 'Mount Isa', applicants: 12, successRate: 79,
    tags: ['Youth Development', 'Leadership', 'Mentorship'],
  },
  {
    id: 6, title: 'Small Business Innovation Grant', category: 'Business',
    amount: 15000, status: 'Open', daysLeft: 60,
    description: 'Supporting local entrepreneurs and small businesses with innovative ideas that benefit the community and create local employment.',
    location: 'Mount Isa', applicants: 8, successRate: 65,
    tags: ['Innovation', 'Entrepreneurship', 'Job Creation'],
  },
];

function BrowseGrantsPanel({ user, council, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [fundingRange, setFundingRange] = useState([0, 50000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [savedGrants, setSavedGrants] = useState(new Set());
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [pendingGrantId, setPendingGrantId] = useState(null);

  const categories = ['Community', 'Arts', 'Sports', 'Environment', 'Education', 'Business'];
  const statuses = ['Open', 'Closing Soon', 'Closed'];

  const filteredGrants = GRANTS.filter(grant => {
    const matchesSearch =
      grant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grant.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(grant.category);
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(grant.status);
    const matchesFunding = grant.amount >= fundingRange[0] && grant.amount <= fundingRange[1];
    return matchesSearch && matchesCategory && matchesStatus && matchesFunding;
  });

  const grantsPerPage = 6;
  const totalPages = Math.ceil(filteredGrants.length / grantsPerPage);
  const startIndex = (currentPage - 1) * grantsPerPage;
  const currentGrants = filteredGrants.slice(startIndex, startIndex + grantsPerPage);

  const toggleCategory = (cat) =>
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleStatus = (s) =>
    setSelectedStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleSave = (id) =>
    setSavedGrants(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const getStatusDot = (status, daysLeft) => {
    if (status === 'Closed') return 'bg-gray-500';
    if (status === 'Closing Soon' || daysLeft <= 7) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getCategoryColour = (cat) => ({
    Community: 'bg-blue-100 text-blue-800',
    Arts: 'bg-purple-100 text-purple-800',
    Sports: 'bg-orange-100 text-orange-800',
    Environment: 'bg-green-100 text-green-800',
    Education: 'bg-indigo-100 text-indigo-800',
    Business: 'bg-yellow-100 text-yellow-800',
  }[cat] || 'bg-gray-100 text-gray-800');

  function handleApply(grantId) {
    if (user) {
      if (onNavigate) onNavigate(`community/application-form?grantId=${grantId}`);
    } else {
      setPendingGrantId(grantId);
      setShowAuthGate(true);
    }
  }

  function handleLearnMore(grantId) {
    if (user) {
      if (onNavigate) onNavigate('grant-details');
    } else {
      setPendingGrantId(grantId);
      setShowAuthGate(true);
    }
  }

  function handleAuthSuccess() {
    setShowAuthGate(false);
    if (onNavigate) onNavigate('grant-details');
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search grants by title, description, or tags…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-12 pr-32 py-3 w-full"
        />
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-700 hover:bg-green-800"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <div className={`w-72 shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)} className="rounded border-gray-300" />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Status</h3>
                <div className="space-y-2">
                  {statuses.map(s => (
                    <label key={s} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={selectedStatus.includes(s)}
                        onChange={() => toggleStatus(s)} className="rounded border-gray-300" />
                      <span className="text-sm">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Funding Amount</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input type="number" placeholder="Min" value={fundingRange[0]}
                      onChange={e => setFundingRange([parseInt(e.target.value) || 0, fundingRange[1]])}
                      className="w-20" />
                    <span>to</span>
                    <Input type="number" placeholder="Max" value={fundingRange[1]}
                      onChange={e => setFundingRange([fundingRange[0], parseInt(e.target.value) || 50000])}
                      className="w-20" />
                  </div>
                  <div className="text-xs text-gray-500">
                    ${fundingRange[0].toLocaleString()} – ${fundingRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full"
                onClick={() => { setSelectedCategories([]); setSelectedStatus([]); setFundingRange([0, 50000]); setSearchTerm(''); }}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total funding available</span>
                  <span className="font-semibold">${GRANTS.reduce((s, g) => s + g.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average grant size</span>
                  <span className="font-semibold">${Math.round(GRANTS.reduce((s, g) => s + g.amount, 0) / GRANTS.length).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success rate</span>
                  <span className="font-semibold text-green-600">74%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grant cards */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {filteredGrants.length} Grant{filteredGrants.length !== 1 ? 's' : ''} Found
              </h2>
              <p className="text-gray-600 text-sm">
                Showing {startIndex + 1}–{Math.min(startIndex + grantsPerPage, filteredGrants.length)} of {filteredGrants.length} results
              </p>
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>Sort by Deadline</option>
              <option>Sort by Amount</option>
              <option>Sort by Popularity</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {currentGrants.map(grant => (
              <Card key={grant.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColour(grant.category)}>{grant.category}</Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(grant.status, grant.daysLeft)}`} />
                        <span className="text-sm text-gray-600">{grant.status}</span>
                      </div>
                      <CardTitle className="text-lg mb-2">{grant.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleSave(grant.id)} className="text-gray-400 hover:text-red-500">
                      <Heart className={`w-4 h-4 ${savedGrants.has(grant.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{grant.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">${grant.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{grant.daysLeft} days left</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{grant.location}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {grant.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{grant.applicants} applicants</span>
                    <span>{grant.successRate}% success rate</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-700 hover:bg-green-800"
                      onClick={() => handleApply(grant.id)}
                      disabled={grant.status === 'Closed'}
                    >
                      {grant.status === 'Closed' ? 'Closed' : user ? 'Apply now' : 'Sign in to apply'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleLearnMore(grant.id)}>
                      Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                    <Button key={n} variant={currentPage === n ? 'default' : 'outline'} size="sm"
                      onClick={() => setCurrentPage(n)} className="w-8 h-8 p-0">{n}</Button>
                  ))}
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthGateModal
        isOpen={showAuthGate}
        onClose={() => { setShowAuthGate(false); setPendingGrantId(null); }}
        onSuccess={handleAuthSuccess}
        action="view grant details and apply"
        council={council}
      />
    </>
  );
}

// ─── Main GrantsListing component ─────────────────────────────────────────────

const TABS = [
  { id: 'browse',          label: 'Browse grants' },
  { id: 'my-applications', label: 'My applications' },
];

const GrantsListing = ({ user, council, onNavigate }) => {
  const location = useLocation();
  const initialTab = location.state?.tab ?? 'browse';
  const [activeTab, setActiveTab] = useState(initialTab);

  // If the user arrives via location state, honour it but don't re-trigger on
  // subsequent renders caused by other state changes.
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Grants</h1>
              <p className="text-green-200 text-sm">
                {council?.name ?? 'GrantThrive'} — community grant portal
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-green-800'
                    : 'text-green-100 hover:bg-green-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'browse' ? (
          <BrowseGrantsPanel user={user} council={council} onNavigate={onNavigate} />
        ) : (
          <MyApplicationsPanel onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
};

export default GrantsListing;