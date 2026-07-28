/**
 * GrantThrive SEO Utility
 * =======================
 * Updates document title, meta description, canonical link, and Open Graph /
 * Twitter Card tags on each client-side route change.
 *
 * Usage (inside a page component):
 *   import { usePageSeo } from '@shared/lib/seo';
 *   usePageSeo(SEO_PAGES.features);
 */

const BASE_URL = 'https://grantthrive.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Per-page SEO configuration.
 * title       — <title> and og:title / twitter:title
 * description — <meta name="description"> and og:description / twitter:description
 * path        — canonical path (e.g. '/features')
 * schema      — optional page-specific JSON-LD object (merged into the graph at runtime)
 */
export const SEO_PAGES = {
  home: {
    title: 'GrantThrive — Grant Management Built for Local Government',
    description:
      'Purpose-built grant management for Australian and New Zealand councils. Streamline workflows, engage your community, and make a bigger impact.',
    path: '/',
  },
  features: {
    title: 'Features — Grant Wizard, Community Voting & Analytics | GrantThrive',
    description:
      'Explore GrantThrive\'s full feature set: AI-assisted grant creation wizard, community voting, interactive grant mapping, staff review workflows, and automated analytics for local government councils.',
    path: '/features',
    schema: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/features#webpage`,
      'name': 'GrantThrive Features',
      'url': `${BASE_URL}/features`,
      'description':
        'Full feature overview of GrantThrive grant management software for Australian and New Zealand councils.',
      'isPartOf': { '@id': `${BASE_URL}/#website` },
    },
  },
  pricing: {
    title: 'Pricing — Transparent Plans for Every Council Size | GrantThrive',
    description:
      'Simple, transparent pricing for Australian and New Zealand councils of every size. No hidden fees. Three tiers based on council size and grant program volume.',
    path: '/pricing',
    schema: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/pricing#webpage`,
      'name': 'GrantThrive Pricing',
      'url': `${BASE_URL}/pricing`,
      'description':
        'Transparent pricing plans for GrantThrive grant management software. Three tiers for small, medium, and large councils.',
      'isPartOf': { '@id': `${BASE_URL}/#website` },
    },
  },
  roiCalculator: {
    title: 'ROI Calculator — See Your Grant Management Savings | GrantThrive',
    description:
      'Calculate the return on investment from replacing manual grant administration with GrantThrive. See projected time savings, cost reductions, and community engagement improvements for your council.',
    path: '/roi-calculator',
    schema: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/roi-calculator#webpage`,
      'name': 'GrantThrive ROI Calculator',
      'url': `${BASE_URL}/roi-calculator`,
      'description':
        'Interactive ROI calculator for councils evaluating GrantThrive grant management software.',
      'isPartOf': { '@id': `${BASE_URL}/#website` },
    },
  },
  resources: {
    title: 'Resources — Guides & Tools for Council Grant Managers | GrantThrive',
    description:
      'Free guides, templates, and tools to help Australian and New Zealand council grant managers run better grant programs. Practical resources for every stage of the grant lifecycle.',
    path: '/resources',
    schema: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/resources#webpage`,
      'name': 'GrantThrive Resources',
      'url': `${BASE_URL}/resources`,
      'description':
        'Free resources for local government grant managers: guides, templates, and tools for every stage of the grant lifecycle.',
      'isPartOf': { '@id': `${BASE_URL}/#website` },
    },
  },
  contact: {
    title: 'Contact GrantThrive — Talk to the Team',
    description:
      'Get in touch with the GrantThrive team. Book a demo, ask a question, or find out how GrantThrive can work for your council.',
    path: '/contact',
    schema: {
      '@type': 'ContactPage',
      '@id': `${BASE_URL}/contact#webpage`,
      'name': 'Contact GrantThrive',
      'url': `${BASE_URL}/contact`,
      'description': 'Contact the GrantThrive team to book a demo or ask a question.',
      'isPartOf': { '@id': `${BASE_URL}/#website` },
    },
  },
};

/**
 * setMeta — imperatively update all SEO-relevant tags for the current page.
 * Called inside usePageSeo on every route mount.
 */
function setMeta({ title, description, path, schema }) {
  const url = `${BASE_URL}${path}`;

  // Title
  document.title = title;

  // Helpers
  const setMetaName = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setMetaProp = (property, content) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setLink = (rel, href) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // Primary meta
  setMetaName('description', description);
  setLink('canonical', url);

  // Open Graph
  setMetaProp('og:url', url);
  setMetaProp('og:title', title);
  setMetaProp('og:description', description);
  setMetaProp('og:image', DEFAULT_IMAGE);

  // Twitter Card
  setMetaName('twitter:title', title);
  setMetaName('twitter:description', description);
  setMetaName('twitter:image', DEFAULT_IMAGE);

  // Page-specific JSON-LD (injected as a secondary script tag, removed on next navigation)
  const existingPageSchema = document.getElementById('ld-page-schema');
  if (existingPageSchema) existingPageSchema.remove();

  if (schema) {
    const script = document.createElement('script');
    script.id = 'ld-page-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...schema });
    document.head.appendChild(script);
  }
}

/**
 * usePageSeo — React hook that calls setMeta on component mount.
 * Import { useEffect } is handled internally to keep call sites clean.
 */
import { useEffect } from 'react';

export function usePageSeo(pageConfig) {
  useEffect(() => {
    if (pageConfig) setMeta(pageConfig);
  }, [pageConfig]);
}

export default { usePageSeo, SEO_PAGES };
