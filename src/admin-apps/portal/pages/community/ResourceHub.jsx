import React, { useState, useMemo } from 'react';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import { 
  Search,
  Filter,
  Download,
  Eye,
  Star,
  Clock,
  FileText,
  Video,
  BookOpen,
  HelpCircle,
  Bookmark,
  Share2,
  Plus,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Tag,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  Play,
  File,
  Image as ImageIcon,
  Lightbulb
} from 'lucide-react';

const ResourceHub = ({ user, council, onNavigate, onLogout }) => {
  const councilName = council?.name || 'Your Council';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [savedResources, setSavedResources] = useState(new Set());

  // Resource categories with enhanced data
  const categories = [
    { id: 'all', name: 'All Resources', count: 156 },
    { id: 'guides', name: 'Guides', count: 45, icon: BookOpen },
    { id: 'templates', name: 'Templates', count: 38, icon: FileText },
    { id: 'videos', name: 'Videos', count: 28, icon: Video },
    { id: 'faqs', name: 'FAQs', count: 25, icon: HelpCircle },
    { id: 'tools', name: 'Tools', count: 20, icon: Lightbulb }
  ];

  // Resource types
  const resourceTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'guide', name: 'Guide', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
    { id: 'template', name: 'Template', icon: FileText, color: 'bg-green-100 text-green-800' },
    { id: 'video', name: 'Video', icon: Video, color: 'bg-orange-100 text-orange-800' },
    { id: 'faq', name: 'FAQ', icon: HelpCircle, color: 'bg-purple-100 text-purple-800' },
    { id: 'tool', name: 'Tool', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' }
  ];

  // Resources will be loaded from the backend API once connected.
  // Empty array until council admin adds content via the admin portal.
  const resources = [];

  // Derived stats from live resources array
  const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads || 0), 0);
  const avgRating = resources.length
    ? (resources.reduce((sum, r) => sum + (r.rating || 0), 0) / resources.length).toFixed(1)
    : '—';
  const thisMonth = new Date();
  const newThisMonth = resources.filter(r => {
    if (!r.publishDate) return false;
    const d = new Date(r.publishDate);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  }).length;

  // Popular tags derived from resources
  const popularTags = useMemo(() => {
    const tagCounts = {};
    resources.forEach(r => r.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([t]) => t);
  }, [resources]);

  // Category counts derived from resources
  const categoriesWithCounts = [
    { id: 'all',       name: 'All Resources', count: resources.length },
    { id: 'guides',    name: 'Guides',     count: resources.filter(r => r.category === 'guides').length,    icon: BookOpen },
    { id: 'templates', name: 'Templates',  count: resources.filter(r => r.category === 'templates').length, icon: FileText },
    { id: 'videos',    name: 'Videos',     count: resources.filter(r => r.category === 'videos').length,    icon: Video },
    { id: 'faqs',      name: 'FAQs',       count: resources.filter(r => r.category === 'faqs').length,      icon: HelpCircle },
    { id: 'tools',     name: 'Tools',      count: resources.filter(r => r.category === 'tools').length,     icon: Lightbulb },
  ];

  // Featured resources
  const featuredResources = resources.filter(resource => resource.isFeatured);

  // Filter and sort resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'recent':
        return new Date(b.publishDate) - new Date(a.publishDate);
      case 'rating':
        return b.rating - a.rating;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  const toggleSaveResource = (resourceId) => {
    setSavedResources(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(resourceId)) {
        newSaved.delete(resourceId);
      } else {
        newSaved.add(resourceId);
      }
      return newSaved;
    });
  };

  const getTypeIcon = (type) => {
    const typeData = resourceTypes.find(t => t.id === type);
    return typeData?.icon || FileText;
  };

  const getTypeColor = (type) => {
    const typeData = resourceTypes.find(t => t.id === type);
    return typeData?.color || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (size) => {
    return size;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="resources" />
      {/* Header */}
      <div className="bg-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Resource Hub</h1>
              <p className="text-blue-100">Guides, templates, videos, and tools to help you succeed</p>
            </div>
            <Button className="bg-green-700 hover:bg-green-800">
              <Plus className="w-4 h-4 mr-2" />
              Suggest Resource
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categoriesWithCounts.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
              >
                {category.name}
                {category.count && (
                  <span className="ml-1 text-xs opacity-75">({category.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search resources, guides, templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 w-full text-gray-900 bg-white border-0 rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Resources */}
        {selectedCategory === 'all' && !searchTerm && featuredResources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Featured Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.slice(0, 3).map(resource => {
                const TypeIcon = getTypeIcon(resource.type);
                return (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${getTypeColor(resource.type)}`}>
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSaveResource(resource.id)}
                          className="text-gray-400 hover:text-orange-500"
                        >
                          <Bookmark className={`w-4 h-4 ${savedResources.has(resource.id) ? 'fill-orange-500 text-orange-500' : ''}`} />
                        </Button>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className={getTypeColor(resource.type)}>
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {resource.readTime || resource.duration}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{resource.downloads} downloads</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {renderStars(resource.rating)}
                          <span className="text-sm text-gray-600 ml-1">({resource.reviews})</span>
                        </div>
                        <Button size="sm" className="bg-green-700 hover:bg-green-800">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Resource Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {resourceTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="popular">Most Downloaded</option>
                    <option value="recent">Most Recent</option>
                    <option value="rating">Highest Rated</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedType('all');
                    setSearchTerm('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats — only shown when resources exist */}
            {resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resource Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Resources</span>
                      <span className="font-semibold">{resources.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Downloads</span>
                      <span className="font-semibold">{totalDownloads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Rating</span>
                      <span className="font-semibold">{avgRating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">New This Month</span>
                      <span className="font-semibold text-green-600">{newThisMonth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Popular Tags — only shown when tags exist */}
            {popularTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Popular Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gray-100">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {filteredResources.length} Resource{filteredResources.length !== 1 ? 's' : ''} Found
                </h2>
                <p className="text-gray-600">
                  {selectedCategory !== 'all' && `in ${categories.find(c => c.id === selectedCategory)?.name}`}
                  {selectedType !== 'all' && ` • ${resourceTypes.find(t => t.id === selectedType)?.name} only`}
                </p>
              </div>
            </div>

            {/* Resources Grid */}
            <div className="space-y-4">
              {sortedResources.length === 0 && (
                <div className="text-center py-16 px-4">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No resources yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                      ? 'No resources match your current filters. Try adjusting your search or clearing the filters.'
                      : 'Resources, guides, and templates will appear here once your council adds them. Check back soon, or contact your council for assistance.'}
                  </p>
                  {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all') && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedType('all'); }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
              {sortedResources.map(resource => {
                const TypeIcon = getTypeIcon(resource.type);
                return (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${getTypeColor(resource.type)} flex-shrink-0`}>
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                              <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSaveResource(resource.id)}
                              className="text-gray-400 hover:text-orange-500 ml-4"
                            >
                              <Bookmark className={`w-4 h-4 ${savedResources.has(resource.id) ? 'fill-orange-500 text-orange-500' : ''}`} />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <Badge className={getTypeColor(resource.type)}>
                              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {resource.readTime || resource.duration}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatFileSize(resource.fileSize)} • {resource.format}
                            </span>
                            <span className="text-sm text-gray-500">
                              by {resource.author}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                <span>{resource.downloads}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{resource.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {renderStars(resource.rating)}
                                <span className="ml-1">({resource.reviews})</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                              <Button size="sm" className="bg-green-700 hover:bg-green-800">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {resource.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Load More */}
            {sortedResources.length > 0 && (
              <div className="text-center mt-8">
                <Button variant="outline">
                  Load More Resources
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceHub;

