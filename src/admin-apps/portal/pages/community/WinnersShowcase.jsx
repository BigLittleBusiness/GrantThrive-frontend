import React, { useState, useEffect, useMemo } from 'react';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import apiClient from '../../utils/api.js';
import { Card, CardContent } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import {
  Search,
  Award,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Share2,
  Heart,
  TrendingUp,
  Star,
  Eye,
  ChevronRight,
  Building,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

// Map grant category strings to badge colours
const CATEGORY_COLOURS = {
  'Community Infrastructure': 'bg-blue-100 text-blue-800',
  'Arts & Culture':           'bg-purple-100 text-purple-800',
  'Sports & Recreation':      'bg-orange-100 text-orange-800',
  'Environment':              'bg-green-100 text-green-800',
  'Community Services':       'bg-pink-100 text-pink-800',
  'Education':                'bg-indigo-100 text-indigo-800',
  'Health & Wellbeing':       'bg-red-100 text-red-800',
};

function categoryColour(cat) {
  return CATEGORY_COLOURS[cat] || 'bg-gray-100 text-gray-800';
}

// Normalise an API application record into the shape the UI expects
function normaliseStory(app, index) {
  const amount = app.amount_requested || app.amount_approved || 0;
  const completionDate = app.decision_date || app.reviewed_at || app.submitted_at || null;
  const category = app.grant?.category || app.category || 'Community Services';
  return {
    id:             app.id,
    title:          app.project_title || 'Community Project',
    organization:   app.organization_name || 'Community Organisation',
    amount,
    category,
    year:           completionDate ? new Date(completionDate).getFullYear() : new Date().getFullYear(),
    location:       app.address || app.suburb || 'Local Area',
    description:    app.project_description || 'An approved community grant project.',
    impact: {
      beneficiaries:    app.beneficiaries_count || '—',
      metric:           'community members',
      communityReach:   app.community_reach || '',
    },
    status:         'Approved',
    completionDate: completionDate ? new Date(completionDate).toLocaleDateString('en-AU') : '—',
    tags:           app.tags || [],
    testimonial:    app.testimonial || null,
    contact:        app.contact_person || '—',
    isFeatured:     index === 0,   // first result is featured
    views:          app.community_votes || 0,
    socialShares:   app.community_score || 0,
  };
}

const WinnersShowcase = ({ user, council, onNavigate, onLogout }) => {
  const [stories, setStories]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedYear, setSelectedYear]     = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFundingRange, setSelectedFundingRange] = useState('all');
  const [viewMode, setViewMode]             = useState('grid');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch approved applications — the backend supports ?status= filtering
        const data = await apiClient.communityGetApplications({ status: 'approved' });
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data?.applications || data?.results || []);
          setStories(list.map(normaliseStory));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load success stories.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Derive filter options from live data
  const years = useMemo(() => {
    const ys = [...new Set(stories.map(s => s.year.toString()))].sort((a, b) => b - a);
    return ['all', ...ys];
  }, [stories]);

  const categories = useMemo(() => {
    const cats = [...new Set(stories.map(s => s.category))];
    return ['all', ...cats];
  }, [stories]);

  const fundingRanges = [
    { id: 'all',    label: 'All Amounts' },
    { id: 'small',  label: 'Under $5,000' },
    { id: 'medium', label: '$5,000 – $15,000' },
    { id: 'large',  label: 'Over $15,000' },
  ];

  // Derived statistics
  const totalFunding      = stories.reduce((s, x) => s + (x.amount || 0), 0);
  const totalBeneficiaries = stories.reduce((s, x) => s + (typeof x.impact.beneficiaries === 'number' ? x.impact.beneficiaries : 0), 0);
  const featuredStory     = stories.find(s => s.isFeatured) || stories[0] || null;

  // Filtered list
  const filteredStories = useMemo(() => stories.filter(story => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      story.title.toLowerCase().includes(q) ||
      story.organization.toLowerCase().includes(q) ||
      story.description.toLowerCase().includes(q) ||
      story.tags.some(t => t.toLowerCase().includes(q));
    const matchesYear     = selectedYear === 'all' || story.year.toString() === selectedYear;
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    let matchesFunding    = true;
    if (selectedFundingRange === 'small')  matchesFunding = story.amount < 5000;
    if (selectedFundingRange === 'medium') matchesFunding = story.amount >= 5000 && story.amount <= 15000;
    if (selectedFundingRange === 'large')  matchesFunding = story.amount > 15000;
    return matchesSearch && matchesYear && matchesCategory && matchesFunding;
  }), [stories, searchTerm, selectedYear, selectedCategory, selectedFundingRange]);

  const councilName = council?.name || 'Your Council';

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="winners" />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader className="w-10 h-10 animate-spin text-green-700 mx-auto mb-4" />
            <p className="text-gray-500">Loading success stories…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="winners" />
        <div className="flex items-center justify-center py-32">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Could not load success stories</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="winners" />

      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">CELEBRATING OUR COMMUNITY CHAMPIONS</h1>
              <p className="text-xl text-green-100 mb-6">
                Discover the amazing projects and initiatives making a real difference in {councilName}
              </p>
              <div className="flex gap-4">
                <Button className="bg-white text-green-800 hover:bg-green-50" onClick={() => onNavigate?.('grants')}>
                  <Award className="w-4 h-4 mr-2" />
                  Apply for Grant
                </Button>
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-green-800">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Stories
                </Button>
              </div>
            </div>

            {/* Featured story preview */}
            {featuredStory && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium">Featured Success Story</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{featuredStory.title}</h3>
                <p className="text-green-100 text-sm mb-3">{featuredStory.organization}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${featuredStory.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{featuredStory.impact.beneficiaries} {featuredStory.impact.metric}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700">{stories.length}</div>
              <div className="text-sm text-gray-600">TOTAL PROJECTS FUNDED</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {totalFunding >= 1000 ? `$${(totalFunding / 1000).toFixed(0)}K` : `$${totalFunding.toLocaleString()}`}
              </div>
              <div className="text-sm text-gray-600">TOTAL FUNDING DISTRIBUTED</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-800">
                {totalBeneficiaries > 0
                  ? totalBeneficiaries >= 1000
                    ? `${(totalBeneficiaries / 1000).toFixed(1)}K`
                    : totalBeneficiaries
                  : '—'}
              </div>
              <div className="text-sm text-gray-600">COMMUNITY MEMBERS HELPED</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search success stories, organisations, or impact areas…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y === 'all' ? 'All Years' : y}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                ))}
              </select>
              <select
                value={selectedFundingRange}
                onChange={(e) => setSelectedFundingRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {fundingRanges.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {filteredStories.length} Success Stor{filteredStories.length !== 1 ? 'ies' : 'y'} Found
              </h2>
              <p className="text-gray-600">Inspiring projects that made a difference</p>
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                Grid
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredStories.length === 0 && (
          <div className="text-center py-16">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No success stories yet</h3>
            <p className="text-gray-500 mb-4">
              {stories.length === 0
                ? 'Approved grant projects will appear here once applications have been reviewed.'
                : 'No stories match your current filters. Try adjusting your search.'}
            </p>
            {stories.length > 0 && (
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedYear('all'); setSelectedCategory('all'); setSelectedFundingRange('all'); }}>
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Stories Grid */}
        {filteredStories.length > 0 && (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredStories.map(story => (
              <Card key={story.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Colour header band */}
                <div className="relative h-32 bg-gradient-to-br from-green-600 to-green-800 flex items-end p-4">
                  <div className="absolute top-4 left-4">
                    <Badge className={categoryColour(story.category)}>{story.category}</Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1 inline" />
                      {story.status}
                    </Badge>
                  </div>
                  <div className="text-white">
                    <div className="text-2xl font-bold">${story.amount.toLocaleString()}</div>
                    <div className="text-sm opacity-90">Grant Amount</div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{story.organization}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{story.description}</p>
                  </div>

                  {/* Impact */}
                  {typeof story.impact.beneficiaries === 'number' && story.impact.beneficiaries > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Community Impact</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">{story.impact.beneficiaries}</div>
                      <div className="text-xs text-green-700">{story.impact.metric}</div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {story.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{story.location}</span>
                      </div>
                    )}
                    {story.completionDate !== '—' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Approved {story.completionDate}</span>
                      </div>
                    )}
                    {story.contact !== '—' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="w-4 h-4" />
                        <span>Contact: {story.contact}</span>
                      </div>
                    )}
                  </div>

                  {/* Testimonial */}
                  {story.testimonial && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm italic text-gray-700">"{story.testimonial}"</p>
                    </div>
                  )}

                  {/* Tags */}
                  {story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {story.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                      ))}
                      {story.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{story.tags.length - 3} more</Badge>
                      )}
                    </div>
                  )}

                  {/* Engagement */}
                  {(story.views > 0 || story.socialShares > 0) && (
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      {story.views > 0 && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{story.views}</span>
                        </div>
                      )}
                      {story.socialShares > 0 && (
                        <div className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          <span>{story.socialShares}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 ml-auto">{story.year}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-700 hover:bg-green-800" size="sm">
                      <ChevronRight className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" aria-label="Share story">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" aria-label="Like story">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-green-700 to-green-900 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Create Your Own Success Story?</h2>
          <p className="text-green-100 mb-6">
            Join the organisations that have transformed {councilName} with grant funding.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-white text-green-800 hover:bg-green-50" onClick={() => onNavigate?.('grants')}>
              <Award className="w-4 h-4 mr-2" />
              Apply for a Grant
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-green-800" onClick={() => onNavigate?.('forum')}>
              <Users className="w-4 h-4 mr-2" />
              Join Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnersShowcase;
