/**
 * GrantThrive — TenantContext
 * ===========================
 * Resolves the current council tenant from the browser's subdomain and
 * provides council branding, config, and identity to all portal components.
 *
 * Architecture
 * ------------
 * On mount, TenantProvider:
 *   1. Extracts the subdomain from window.location.hostname
 *   2. Calls GET /api/councils/resolve?subdomain=<subdomain>
 *   3. Stores the council profile in React context
 *   4. Applies the council's primary/secondary colours as CSS custom properties
 *      on <html> so all Tailwind utilities that reference --gt-primary work
 *
 * Reserved subdomains (app, admin, www, map, roi) resolve to null — the
 * platform renders with the default GrantThrive green palette.
 *
 * Development
 * -----------
 * In development (localhost), the subdomain is read from the
 * VITE_GT_SUBDOMAIN env variable so engineers can test any tenant:
 *
 *   VITE_GT_SUBDOMAIN=cityofmelbourne pnpm dev
 *
 * Usage
 * -----
 *   import { useTenant } from '@shared/tenancy/TenantContext';
 *
 *   const { council, isLoading, isTenanted } = useTenant();
 *   // council.name, council.logo_url, council.primary_colour, etc.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';

const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'admin', 'api', 'map', 'roi',
  'staging', 'dev', 'test', 'mail', 'smtp',
]);

// Default GrantThrive brand colours (used when no council is resolved)
const GT_DEFAULT_PRIMARY   = '#15803d';
const GT_DEFAULT_SECONDARY = '#166534';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the leftmost subdomain label from the current hostname.
 * Returns null for localhost, IPs, and reserved subdomains.
 */
function detectSubdomain() {
  // Development override
  const envOverride = import.meta.env.VITE_GT_SUBDOMAIN;
  if (envOverride) return envOverride.toLowerCase();

  const hostname = window.location.hostname.toLowerCase();

  // Localhost / IP — no subdomain
  if (hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
  }
  return null;
}

/**
 * Apply council brand colours as CSS custom properties on <html>.
 * Tailwind utilities can reference these via arbitrary value syntax:
 *   bg-[var(--gt-primary)]  text-[var(--gt-secondary)]
 */
function applyBrandColours(primary, secondary) {
  const root = document.documentElement;
  root.style.setProperty('--gt-primary',   primary   || GT_DEFAULT_PRIMARY);
  root.style.setProperty('--gt-secondary', secondary || GT_DEFAULT_SECONDARY);
}

// ── Context ──────────────────────────────────────────────────────────────────

const TenantContext = createContext({
  council:    null,
  subdomain:  null,
  isLoading:  true,
  isTenanted: false,
  error:      null,
  refetch:    () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function TenantProvider({ children }) {
  const [council,   setCouncil]   = useState(null);
  const [subdomain, setSubdomain] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  const fetchCouncil = useCallback(async (sub) => {
    if (!sub) {
      applyBrandColours(GT_DEFAULT_PRIMARY, GT_DEFAULT_SECONDARY);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/councils/resolve?subdomain=${encodeURIComponent(sub)}`,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (res.ok) {
        const data = await res.json();
        setCouncil(data.council);
        applyBrandColours(data.council.primary_colour, data.council.secondary_colour);
      } else if (res.status === 404) {
        // Unknown subdomain — treat as no tenant (fall back to GT branding)
        setCouncil(null);
        applyBrandColours(GT_DEFAULT_PRIMARY, GT_DEFAULT_SECONDARY);
      } else {
        throw new Error(`Unexpected response: ${res.status}`);
      }
    } catch (err) {
      console.error('[TenantContext] Failed to resolve council:', err);
      setError(err.message);
      applyBrandColours(GT_DEFAULT_PRIMARY, GT_DEFAULT_SECONDARY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const sub = detectSubdomain();
    setSubdomain(sub);
    fetchCouncil(sub);
  }, [fetchCouncil]);

  const value = {
    council,
    subdomain,
    isLoading,
    isTenanted: !!council,
    error,
    refetch: () => {
      setIsLoading(true);
      fetchCouncil(subdomain);
    },
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useTenant — access the current council tenant from any component.
 *
 * @returns {{
 *   council:    object|null,   // Full council profile from the API
 *   subdomain:  string|null,   // e.g. "cityofmelbourne"
 *   isLoading:  boolean,
 *   isTenanted: boolean,       // true when a council was successfully resolved
 *   error:      string|null,
 *   refetch:    function,
 * }}
 */
export function useTenant() {
  return useContext(TenantContext);
}

export default TenantContext;
