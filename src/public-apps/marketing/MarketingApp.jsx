import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card.jsx'
import { Badge } from '@shared/components/ui/badge.jsx'
import { 
  Menu, 
  X, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Users, 
  Map, 
  Vote, 
  Zap, 
  Shield, 
  Smartphone, 
  BarChart3,
  Calculator,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  Globe,
  Heart,
  Target,
  Lightbulb,
  BookOpen,
  FileText,
  MessageSquare,
  ChevronRight,
  Send
} from 'lucide-react'
import './MarketingApp.css'

// Navigation Component
function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'ROI Calculator', path: '/roi-calculator' },
    { name: 'Resources', path: '/resources' },
    { name: 'Contact', path: '/contact' }
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900">GrantThrive</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path 
                    ? 'text-primary' 
                    : 'text-gray-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <a href="/portal">Login</a>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/contact')}>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-sm font-medium text-gray-600 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="/portal">Login</a>
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Hero Section Component
function HeroSection() {
  const navigate = useNavigate()
  return (
    <section className="hero-gradient text-white section-padding">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30">
                🚀 Revolutionary Community Engagement
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Transform Your
                <span className="block text-yellow-300">Grant Management</span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                The only platform that combines powerful grant management with 
                revolutionary community engagement features. Save money, engage citizens, 
                and streamline your processes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100" onClick={() => navigate('/roi-calculator')}>
                <Calculator className="mr-2 h-5 w-5" />
                Calculate Your ROI
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/features')}>
                <Users className="mr-2 h-5 w-5" />
                See Community Features
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">312%</div>
                <div className="text-sm text-blue-100">Average ROI</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">4mo</div>
                <div className="text-sm text-blue-100">Payback Period</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">$7.5K+</div>
                <div className="text-sm text-blue-100">Annual Savings</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 animate-float">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                    <Vote className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Community Voting</h3>
                    <p className="text-sm text-blue-100">Let citizens vote on grant priorities</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                    <Map className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Interactive Mapping</h3>
                    <p className="text-sm text-blue-100">Visualize grant impact across your region</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Real-time Analytics</h3>
                    <p className="text-sm text-blue-100">Track performance and engagement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Features Section Component
function FeaturesSection() {
  const navigate = useNavigate()
  const features = [
    {
      icon: Vote,
      title: "Community Voting System",
      description: "Revolutionary feature that lets citizens vote on grant priorities and applications, creating unprecedented transparency and engagement.",
      badge: "Exclusive to GrantThrive",
      color: "bg-blue-500"
    },
    {
      icon: Map,
      title: "Interactive Grant Mapping",
      description: "Visual mapping system showing grant locations, outcomes, and community impact across your region.",
      badge: "Exclusive to GrantThrive", 
      color: "bg-green-500"
    },
    {
      icon: Zap,
      title: "AI-Powered Grant Wizard",
      description: "Step-by-step grant creation with intelligent templates and automated workflows.",
      badge: "AI-Enhanced",
      color: "bg-purple-500"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Live dashboards showing application trends, community engagement, and performance metrics.",
      badge: "Advanced Analytics",
      color: "bg-orange-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with compliance features for Australian and New Zealand councils.",
      badge: "Compliant",
      color: "bg-red-500"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Fully responsive interface optimized for mobile devices and touch interactions.",
      badge: "Mobile Optimized",
      color: "bg-indigo-500"
    }
  ]

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-primary/10 text-primary">Revolutionary Features</Badge>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
            Features No Competitor Offers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            GrantThrive isn't just another grant management system. We're pioneering 
            community-centric features that transform how councils engage with citizens.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="feature-card-hover border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/features')}>
            See All Features
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}

// Comparison Section Component
function ComparisonSection() {
  const navigate = useNavigate()
  const comparisons = [
    { feature: "Community Voting System", grantThrive: true, smartyGrants: false },
    { feature: "Interactive Grant Mapping", grantThrive: true, smartyGrants: false },
    { feature: "AI-Powered Grant Creation", grantThrive: true, smartyGrants: false },
    { feature: "Real-time Analytics Dashboard", grantThrive: true, smartyGrants: false },
    { feature: "15+ System Integrations", grantThrive: true, smartyGrants: false },
    { feature: "Mobile-Responsive Design", grantThrive: true, smartyGrants: true },
    { feature: "Basic Application Management", grantThrive: true, smartyGrants: true },
    { feature: "Document Storage", grantThrive: true, smartyGrants: true },
    { feature: "Setup & Training Included", grantThrive: true, smartyGrants: false },
    { feature: "Transparent Pricing", grantThrive: true, smartyGrants: false }
  ]

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-green-100 text-green-800">Competitive Advantage</Badge>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
            GrantThrive vs SmartyGrants
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See why progressive councils are switching to GrantThrive for superior 
            features and better value.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
              <div className="grid grid-cols-3 gap-4">
                <div></div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-xl">G</span>
                  </div>
                  <h3 className="font-bold text-primary">GrantThrive</h3>
                  <Badge className="bg-green-600 text-white mt-1">Recommended</Badge>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  <h3 className="font-bold text-gray-600">SmartyGrants</h3>
                  <Badge variant="secondary" className="mt-1">Traditional</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {comparisons.map((item, index) => (
                <div key={index} className={`grid grid-cols-3 gap-4 p-4 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="font-medium text-gray-900">{item.feature}</div>
                  <div className="text-center">
                    {item.grantThrive ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    )}
                  </div>
                  <div className="text-center">
                    {item.smartyGrants ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-6 w-6 text-red-400 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/roi-calculator')}>
              <Calculator className="mr-2 h-5 w-5" />
              Calculate Your Savings
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ROI Section Component
function ROISection() {
  const navigate = useNavigate()
  return (
    <section className="section-padding bg-gradient-to-r from-blue-600 to-green-600 text-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-white/30">
                💰 Proven ROI
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold">
                Save Money While
                <span className="block text-yellow-300">Gaining Features</span>
              </h2>
              <p className="text-xl text-blue-100">
                GrantThrive costs less than SmartyGrants while providing 320% more features. 
                See your exact savings with our ROI calculator.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Lower Annual Costs</h3>
                  <p className="text-blue-100">Save 1-24% annually vs SmartyGrants</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">No Setup Fees</h3>
                  <p className="text-blue-100">Save $3,000-$8,000 in setup costs</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">More Features</h3>
                  <p className="text-blue-100">21 features vs 5 in SmartyGrants</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="bg-white text-primary hover:bg-gray-100" onClick={() => navigate('/roi-calculator')}>
              <Calculator className="mr-2 h-5 w-5" />
              Calculate Your ROI Now
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Sample ROI Results</h3>
            <div className="space-y-6">
              <div className="bg-white/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Small Council (100 applications/year)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>ROI: <span className="font-bold text-yellow-300">312%</span></div>
                  <div>Payback: <span className="font-bold text-yellow-300">4 months</span></div>
                  <div>Annual Savings: <span className="font-bold text-yellow-300">$7,500</span></div>
                  <div>vs SmartyGrants: <span className="font-bold text-yellow-300">$4,104/year</span></div>
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Medium Council (300 applications/year)</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>ROI: <span className="font-bold text-yellow-300">450%+</span></div>
                  <div>Payback: <span className="font-bold text-yellow-300">3 months</span></div>
                  <div>Annual Savings: <span className="font-bold text-yellow-300">$22,500+</span></div>
                  <div>vs SmartyGrants: <span className="font-bold text-yellow-300">$12,312/year</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// CTA Section Component
function CTASection() {
  const navigate = useNavigate()
  return (
    <section className="section-padding bg-gray-900 text-white">
      <div className="container-custom text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Ready to Transform Your
            <span className="text-gradient block">Grant Management?</span>
          </h2>
          <p className="text-xl text-gray-300">
            Join progressive councils across Australia and New Zealand who are 
            revolutionizing their grant management with GrantThrive.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/contact')}>
              <Users className="mr-2 h-5 w-5" />
              Schedule a Demo
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/roi-calculator')}>
              <Calculator className="mr-2 h-5 w-5" />
              Calculate ROI
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <a href="/GrantThrive_Brochure.pdf" download>
                <Download className="mr-2 h-5 w-5" />
                Download Brochure
              </a>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-12">
            <div className="text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Quick Setup</h3>
              <p className="text-sm text-gray-400">Go live in 2-4 weeks</p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Secure & Compliant</h3>
              <p className="text-sm text-gray-400">Enterprise-grade security</p>
            </div>
            <div className="text-center">
              <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Ongoing Support</h3>
              <p className="text-sm text-gray-400">Dedicated success team</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold">GrantThrive</span>
            </div>
            <p className="text-gray-400">
              Revolutionary grant management platform for Australian and New Zealand councils.
            </p>
            <div className="flex space-x-4">
              <a href="https://grantthrive.com" className="text-gray-400 hover:text-white transition-colors" aria-label="Website">
                <Globe className="h-5 w-5" />
              </a>
              <a href="mailto:info@grantthrive.com" className="text-gray-400 hover:text-white transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
              <a href="tel:1300472687" className="text-gray-400 hover:text-white transition-colors" aria-label="Phone">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/roi-calculator" className="hover:text-white transition-colors">ROI Calculator</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Request Demo</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/resources" className="hover:text-white transition-colors">Resource Hub</Link></li>
              <li><Link to="/resources#guides" className="hover:text-white transition-colors">Grant Guides</Link></li>
              <li><Link to="/resources#case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@grantthrive.com" className="hover:text-white transition-colors">info@grantthrive.com</a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:1300472687" className="hover:text-white transition-colors">1300 GRANTS</a>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Australia &amp; New Zealand</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} GrantThrive. All rights reserved. Transforming grant management across Australia and New Zealand.</p>
        </div>
      </div>
    </footer>
  )
}

// Home Page Component
function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <ComparisonSection />
      <ROISection />
      <CTASection />
    </div>
  )
}

// Full Features Page
function FeaturesPage() {
  const navigate = useNavigate()
  const allFeatures = [
    { icon: Vote, title: "Community Voting System", description: "Let citizens vote on grant priorities and applications. Set voting windows, display live results, and publish outcomes for full transparency.", badge: "Exclusive", color: "bg-blue-500" },
    { icon: Map, title: "Interactive Grant Mapping", description: "Visualise every grant on an interactive map. Filter by category, status, or council area. Embed the public map on your council website.", badge: "Exclusive", color: "bg-green-500" },
    { icon: Zap, title: "AI-Powered Grant Wizard", description: "Create a complete grant program in minutes with intelligent templates, automated eligibility rules, and guided workflows.", badge: "AI-Enhanced", color: "bg-purple-500" },
    { icon: BarChart3, title: "Real-time Analytics", description: "Live dashboards for application volumes, approval rates, processing times, community engagement scores, and budget utilisation.", badge: "Advanced", color: "bg-orange-500" },
    { icon: Shield, title: "Enterprise Security", description: "SOC 2-aligned security, role-based access control, full audit logs, and data residency in Australia.", badge: "Compliant", color: "bg-red-500" },
    { icon: Smartphone, title: "Mobile-First Design", description: "Every page is fully responsive. Applicants can submit and track applications from any device.", badge: "Mobile", color: "bg-indigo-500" },
    { icon: FileText, title: "Application Management", description: "Receive, assess, and decide on applications in one place. Assign reviewers, set scoring rubrics, and track every step.", badge: "Core", color: "bg-teal-500" },
    { icon: MessageSquare, title: "Applicant Communication", description: "Built-in messaging, automated status updates, and email notifications keep applicants informed at every stage.", badge: "Core", color: "bg-cyan-500" },
    { icon: Target, title: "QR Code Integration", description: "Generate QR codes for any grant program. Place them on posters, flyers, and signage to drive community applications.", badge: "Unique", color: "bg-pink-500" },
    { icon: BookOpen, title: "Resource Hub", description: "Provide applicants with guides, templates, and FAQs. Reduce support requests and improve application quality.", badge: "Core", color: "bg-yellow-500" },
    { icon: Award, title: "Winners Showcase", description: "Publicly celebrate successful grant recipients with a branded showcase page that builds community trust.", badge: "Engagement", color: "bg-amber-500" },
    { icon: TrendingUp, title: "Monthly Reports", description: "Automated monthly PDF reports delivered to council administrators covering all key metrics and financial summaries.", badge: "Automated", color: "bg-lime-600" },
  ]

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-primary/10 text-primary">Complete Feature Set</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900">Everything You Need to Run Better Grants</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            GrantThrive brings together every tool a council needs to manage grants efficiently and engage the community meaningfully.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {allFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/contact')}>
            Book a Demo to See It All Live
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Compiled fallback pricing (used if API is unreachable) ──────────────────
const FALLBACK_PLANS = [
  {
    key: 'small',
    name: 'Small Council',
    population: '5K – 20K population',
    monthlyPrice: 200,
    annualMonthlyPrice: 167,
    annualTotal: 2000,
    highlight: false,
    features: [
      'Up to 200 grant applications/year',
      '3 staff user accounts',
      'Grant creation wizard',
      'Application management',
      'Basic analytics dashboard',
      'Email support',
      'Setup & onboarding included',
    ],
    addonVotingCents: 5000,
    addonMappingCents: 5000,
  },
  {
    key: 'medium',
    name: 'Medium Council',
    population: '20K – 100K population',
    monthlyPrice: 500,
    annualMonthlyPrice: 417,
    annualTotal: 5000,
    highlight: true,
    features: [
      'Up to 1,000 grant applications/year',
      '10 staff user accounts',
      'All Small Council features',
      'Community Voting included',
      'Grant Mapping included',
      'Advanced analytics & reporting',
      'Priority email & phone support',
      'Dedicated onboarding manager',
    ],
    addonVotingCents: null,
    addonMappingCents: null,
  },
  {
    key: 'large',
    name: 'Large Council',
    population: '100K+ population',
    monthlyPrice: 1100,
    annualMonthlyPrice: 917,
    annualTotal: 11000,
    highlight: false,
    features: [
      'Unlimited grant applications',
      'Unlimited staff user accounts',
      'All Medium Council features',
      'Custom integrations',
      'SLA-backed uptime guarantee',
      'Dedicated account manager',
      'Custom reporting & exports',
      'On-site training available',
    ],
    addonVotingCents: null,
    addonMappingCents: null,
  },
]

/**
 * Merge live API pricing data into the static plan definitions.
 * Only price/add-on fields are overwritten; features and copy stay static.
 */
function mergeLivePricing(apiPlans) {
  return FALLBACK_PLANS.map(plan => {
    const live = apiPlans[plan.key]
    if (!live) return plan
    const monthly = Math.round(live.monthly_price_aud_cents / 100)
    const annualMonthly = Math.round(live.annual_monthly_price_aud_cents / 100)
    const annualTotal = Math.round(live.annual_price_aud_cents / 100)
    return {
      ...plan,
      name: live.display_name || plan.name,
      monthlyPrice: monthly,
      annualMonthlyPrice: annualMonthly,
      annualTotal,
      addonVotingCents: live.addon_community_voting_cents ?? plan.addonVotingCents,
      addonMappingCents: live.addon_grant_mapping_cents ?? plan.addonMappingCents,
    }
  })
}

const PRICING_API_URL = (() => {
  const base = (import.meta.env.VITE_API_URL || 'https://api.grantthrive.com').replace(/\/api$/, '')
  return `${base}/api/pricing/plans`
})()

// Full Pricing Page
function PricingPage() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState('annual')
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const isAnnual = billingCycle === 'annual'

  // Fetch live pricing from the backend on mount
  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch(PRICING_API_URL, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.plans) setPlans(mergeLivePricing(data.plans))
      }
    } catch {
      // Network error — keep fallback pricing silently
    }
  }, [])

  useEffect(() => { loadPricing() }, [loadPricing])

  const displayPrice = (plan) => isAnnual
    ? `$${plan.annualMonthlyPrice.toLocaleString()}`
    : `$${plan.monthlyPrice.toLocaleString()}`

  const savingsAmount = (plan) => (plan.monthlyPrice * 2).toLocaleString()

  return (
    <div className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center space-y-4 mb-10">
          <Badge className="bg-primary/10 text-primary">Simple, Transparent Pricing</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900">No Hidden Fees. No Surprises.</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            All plans include setup, training, and ongoing support. Cancel anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !isAnnual
                  ? 'bg-gray-900 text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isAnnual
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Annual
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isAnnual ? 'bg-white text-primary' : 'bg-green-100 text-green-700'
              }`}>
                2 MONTHS FREE
              </span>
            </button>
          </div>
          {isAnnual ? (
            <p className="text-sm text-green-700 font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              You&apos;re saving 2 months on every plan &mdash; billed as one annual payment
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Switch to annual billing and get <span className="font-semibold text-green-700">2 months free</span> on any plan
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative border-0 shadow-lg ${plan.highlight ? 'ring-2 ring-primary' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.population}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gray-900">{displayPrice(plan)}</span>
                  <span className="text-gray-500">/month</span>
                  {isAnnual ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-green-700 bg-green-50 rounded-full px-3 py-1 inline-block">
                        Save ${savingsAmount(plan)}/year &mdash; 2 months free
                      </p>
                      <p className="text-sm text-gray-500">Billed as ${plan.annualTotal.toLocaleString()}/year</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-400">Or <span className="text-green-700 font-medium">${plan.annualMonthlyPrice}/mo</span> billed annually &mdash; 2 months free</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {(plan.addonVotingCents || plan.addonMappingCents) && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">OPTIONAL ADD-ONS</p>
                    {plan.addonVotingCents && (
                      <p className="text-sm text-gray-600">+ Community Voting +${Math.round(plan.addonVotingCents / 100)}/mo</p>
                    )}
                    {plan.addonMappingCents && (
                      <p className="text-sm text-gray-600">+ Grant Mapping +${Math.round(plan.addonMappingCents / 100)}/mo</p>
                    )}
                  </div>
                )}
                <Button
                  className={`w-full mt-4 ${plan.highlight ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.highlight ? 'default' : 'outline'}
                  onClick={() => navigate('/contact')}
                >
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Annual savings callout banner — only shown on monthly view */}
        {!isAnnual && (
          <div className="bg-gradient-to-r from-primary/10 to-green-50 border border-primary/20 rounded-2xl p-6 mb-12 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-1">
              Switch to annual billing and get 2 months completely free
            </p>
            <p className="text-gray-600 text-sm mb-4">
              {plans.map((p, i) => (
                <span key={p.key}>
                  {p.name} save ${(p.monthlyPrice * 2).toLocaleString()}/year{i < plans.length - 1 ? ' • ' : ''}
                </span>
              ))}
            </p>
            <button
              onClick={() => setBillingCycle('annual')}
              className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Switch to Annual &rarr;
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-gray-600 mb-4">Not sure which plan is right for you?</p>
          <Button variant="outline" size="lg" onClick={() => navigate('/roi-calculator')}>
            <Calculator className="mr-2 h-5 w-5" />
            Use the ROI Calculator
          </Button>
        </div>
      </div>
    </div>
  )
}

// ROI Calculator Page
function ROICalculatorPage() {
  const navigate = useNavigate()
  const [councilSize, setCouncilSize] = useState('small')
  const [applications, setApplications] = useState(100)
  const [hoursPerApp, setHoursPerApp] = useState(4.25)
  const [hourlyRate, setHourlyRate] = useState(40)
  const [techCosts, setTechCosts] = useState(3000)
  const [adminCosts, setAdminCosts] = useState(2000)
  const [communityVoting, setCommunityVoting] = useState(false)
  const [grantMapping, setGrantMapping] = useState(false)

  const calculateROI = (inputs) => {
    const currentAnnualCosts = (inputs.applications * inputs.hoursPerApp * inputs.hourlyRate) + inputs.techCosts + inputs.adminCosts
    const grantThriveAnnualCost = inputs.councilSize === 'small' ? 2400 : inputs.councilSize === 'medium' ? 6000 : 13200
    const addOnCosts = (inputs.communityVoting ? 600 : 0) + (inputs.grantMapping ? 600 : 0)
    const totalGrantThriveCost = grantThriveAnnualCost + addOnCosts
    const efficiencyGain = 0.45
    const newStaffCosts = currentAnnualCosts * (1 - efficiencyGain)
    const totalNewCosts = newStaffCosts + totalGrantThriveCost
    const annualSavings = currentAnnualCosts - totalNewCosts
    const roi = (annualSavings / totalGrantThriveCost) * 100
    const paybackMonths = Math.ceil(totalGrantThriveCost / (annualSavings / 12))
    return { currentAnnualCosts, totalGrantThriveCost, annualSavings, roi, paybackMonths, fiveYearSavings: annualSavings * 5 }
  }

  const inputs = { councilSize, applications, hoursPerApp, hourlyRate, techCosts, adminCosts, communityVoting, grantMapping }
  const results = calculateROI(inputs)

  return (
    <div className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center space-y-4 mb-12">
          <Badge className="bg-primary/10 text-primary">ROI Calculator</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900">Calculate Your GrantThrive ROI</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See exactly how much your council can save. Adjust the inputs below to match your current situation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Your Council Details</CardTitle>
              <CardDescription>Enter your current grant management costs and processes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Council Size</label>
                <select value={councilSize} onChange={(e) => setCouncilSize(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="small">Small (5K-20K population)</option>
                  <option value="medium">Medium (20K-100K population)</option>
                  <option value="large">Large (100K+ population)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Grant Applications per Year: {applications}</label>
                <input type="range" min="50" max="1000" value={applications} onChange={(e) => setApplications(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hours per Application: {hoursPerApp}</label>
                <input type="range" min="2" max="10" step="0.25" value={hoursPerApp} onChange={(e) => setHoursPerApp(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Staff Hourly Rate (AUD): ${hourlyRate}</label>
                <input type="range" min="30" max="80" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Technology Costs (AUD/year): ${techCosts}</label>
                <input type="range" min="1000" max="20000" step="500" value={techCosts} onChange={(e) => setTechCosts(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Administrative Costs (AUD/year): ${adminCosts}</label>
                <input type="range" min="1000" max="10000" step="500" value={adminCosts} onChange={(e) => setAdminCosts(Number(e.target.value))} className="w-full" />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Optional Add-ons</h3>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="voting" checked={communityVoting} onChange={(e) => setCommunityVoting(e.target.checked)} />
                  <label htmlFor="voting" className="text-sm">Community Voting (+$600/year)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="mapping" checked={grantMapping} onChange={(e) => setGrantMapping(e.target.checked)} />
                  <label htmlFor="mapping" className="text-sm">Grant Mapping (+$600/year)</label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Your ROI Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">{Math.round(results.roi)}%</div>
                    <div className="text-sm text-gray-600">ROI</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{results.paybackMonths}mo</div>
                    <div className="text-sm text-gray-600">Payback Period</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">${results.annualSavings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Annual Savings</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600">${results.fiveYearSavings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">5-Year Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader><CardTitle>Cost Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Current Annual Costs:</span>
                    <span className="font-semibold">${results.currentAnnualCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GrantThrive Annual Cost:</span>
                    <span className="font-semibold">${results.totalGrantThriveCost.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-600">
                    <span>Annual Savings:</span>
                    <span>${results.annualSavings.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center space-y-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 w-full" onClick={() => navigate('/contact')}>
                <Users className="mr-2 h-5 w-5" />
                Schedule a Demo
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={() => navigate('/pricing')}>
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Full Resources Page
function ResourcesPage() {
  const resources = [
    { icon: BookOpen, title: "Grant Writing Guide", description: "A step-by-step guide to writing compelling grant applications that get approved.", category: "Guide", link: "/resources/GrantThrive_Grant_Writing_Guide.pdf" },
    { icon: FileText, title: "Application Checklist", description: "A printable checklist covering everything applicants need before submitting.", category: "Template", link: "/resources/GrantThrive_Application_Checklist.pdf" },
    { icon: BarChart3, title: "Council ROI Report Template", description: "A ready-to-use template for reporting grant program outcomes to your council.", category: "Template", link: "/resources/GrantThrive_Council_ROI_Report_Template.pdf" },
    { icon: Users, title: "Community Engagement Playbook", description: "Best practices for driving community participation in your grant programs.", category: "Guide", link: "/resources/GrantThrive_Community_Engagement_Playbook.pdf" },
    { icon: Shield, title: "Compliance & Governance Guide", description: "Understand your obligations under Australian grant administration frameworks.", category: "Guide", link: "/resources/GrantThrive_Compliance_Governance_Guide.pdf" },
    { icon: TrendingUp, title: "Grant Program Metrics Guide", description: "Learn which KPIs matter most and how to measure grant program success.", category: "Guide", link: "/resources/GrantThrive_Grant_Program_Metrics_Guide.pdf" },
  ]

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-primary/10 text-primary">Free Resources</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900">Resources to Help You Succeed</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Guides, templates, and playbooks for council administrators and grant applicants.
          </p>
        </div>
        <div id="guides" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <resource.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline">{resource.category}</Badge>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={resource.link} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Free
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Full Contact Page
function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', council: '', phone: '', message: '', type: 'demo' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In production this would POST to the backend API
    setSubmitted(true)
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (submitted) {
    return (
      <div className="section-padding">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-xl text-gray-600 mb-8">
            We have received your message and will be in touch within one business day.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-primary/10 text-primary">Get in Touch</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900">Let's Talk</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Book a personalised demo, ask a question, or request a proposal.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <Card className="p-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Enquiry Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="demo">Book a Demo</option>
                    <option value="pricing">Pricing Enquiry</option>
                    <option value="support">Support</option>
                    <option value="general">General Enquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full p-2 border border-gray-300 rounded-md" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Work Email *</label>
                  <input required name="email" value={formData.email} onChange={handleChange} type="email" className="w-full p-2 border border-gray-300 rounded-md" placeholder="you@council.gov.au" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Council / Organisation</label>
                  <input name="council" value={formData.council} onChange={handleChange} type="text" className="w-full p-2 border border-gray-300 rounded-md" placeholder="Your council name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} type="tel" className="w-full p-2 border border-gray-300 rounded-md" placeholder="Your phone number" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message *</label>
                  <textarea required name="message" value={formData.message} onChange={handleChange} rows={4} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Tell us about your grant management needs..." />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href="mailto:info@grantthrive.com" className="text-primary hover:underline">info@grantthrive.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <a href="tel:1300472687" className="text-primary hover:underline">1300 GRANTS (1300 472 687)</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Business Hours</p>
                    <p className="text-gray-600">Monday – Friday, 9am – 5pm AEST</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Service Area</p>
                    <p className="text-gray-600">Australia &amp; New Zealand</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-lg bg-primary text-white p-6">
              <h3 className="text-xl font-bold mb-2">Book a Live Demo</h3>
              <p className="text-blue-100 mb-4">See GrantThrive in action with a personalised 30-minute walkthrough tailored to your council's needs.</p>
              <ul className="space-y-2 text-sm text-blue-100 mb-4">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-white" /> No obligation</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-white" /> Tailored to your council size</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-white" /> Live Q&amp;A with our team</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Marketing App — rendered inside the parent BrowserRouter from main.jsx
function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/roi-calculator" element={<ROICalculatorPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
