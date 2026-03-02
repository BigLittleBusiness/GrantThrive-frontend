/**
 * CouncilManagement — System Admin: Council List & Management
 * ===========================================================
 * Displays all provisioned council tenants with search, filter, and
 * quick-action controls.  Provides entry points to:
 *   - Provision a new council (opens CreateCouncilModal)
 *   - View / edit a council's profile (opens CouncilDetailModal)
 *   - Deactivate a council
 *
 * Only accessible to system_admin users.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Filter, RefreshCw, ExternalLink,
  Edit, Trash2, CheckCircle, XCircle, AlertCircle, Globe,
  Users, FileText, ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';
import CreateCouncilModal from './CreateCouncilModal.jsx';
import CouncilDetailModal from './CouncilDetailModal.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';

const PLAN_LABELS = {
  starter:      { label: 'Starter',      colour: 'bg-gray-100 text-gray-700' },
  professional: { label: 'Professional', colour: 'bg-blue-100 text-blue-700' },
  enterprise:   { label: 'Enterprise',   colour: 'bg-purple-100 text-purple-700' },
};

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem('gt_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlanBadge({ plan }) {
  const cfg = PLAN_LABELS[plan] || { label: plan, colour: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.colour}`}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      <CheckCircle className="h-3 w-3" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      <XCircle className="h-3 w-3" /> Inactive
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CouncilManagement() {
  const [councils,    setCouncils]    = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [planFilter,  setPlanFilter]  = useState('');
  const [activeFilter,setActiveFilter]= useState('');
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({ total: 0, pages: 1 });
  const [showCreate,  setShowCreate]  = useState(false);
  const [selectedCouncil, setSelectedCouncil] = useState(null);
  const [deactivating, setDeactivating] = useState(null);

  const fetchCouncils = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, per_page: 20 });
      if (search)       params.set('q',      search);
      if (stateFilter)  params.set('state',  stateFilter);
      if (planFilter)   params.set('plan',   planFilter);
      if (activeFilter) params.set('active', activeFilter);

      const data = await apiGet(`/api/councils?${params}`);
      setCouncils(data.councils || []);
      setPagination({ total: data.total || 0, pages: data.pages || 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, stateFilter, planFilter, activeFilter]);

  useEffect(() => { fetchCouncils(); }, [fetchCouncils]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, stateFilter, planFilter, activeFilter]);

  const handleDeactivate = async (council) => {
    if (!window.confirm(`Deactivate "${council.name}"? Their portal will become inaccessible.`)) return;
    setDeactivating(council.id);
    try {
      await apiDelete(`/api/councils/${council.id}`);
      fetchCouncils();
    } catch (err) {
      alert(`Failed to deactivate: ${err.message}`);
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-green-700" />
            Council Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination.total} council{pagination.total !== 1 ? 's' : ''} provisioned
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Provision New Council
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search councils…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>
        {/* State */}
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Plan */}
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="">All Plans</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        {/* Active */}
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {/* Refresh */}
        <button
          onClick={fetchCouncils}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Council</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">State</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Portal URL</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : councils.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  {search || stateFilter || planFilter || activeFilter
                    ? 'No councils match your filters.'
                    : 'No councils provisioned yet. Click "Provision New Council" to get started.'}
                </td>
              </tr>
            ) : (
              councils.map((council) => (
                <tr key={council.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name + subdomain */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {council.logo_url ? (
                        <img src={council.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold"
                          style={{ backgroundColor: council.primary_colour || '#15803d' }}
                        >
                          {council.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{council.name}</p>
                        <p className="text-xs text-gray-500">{council.subdomain}.grantthrive.com</p>
                      </div>
                    </div>
                  </td>
                  {/* State */}
                  <td className="px-6 py-4 text-sm text-gray-700">{council.state || '—'}</td>
                  {/* Plan */}
                  <td className="px-6 py-4"><PlanBadge plan={council.plan} /></td>
                  {/* Status */}
                  <td className="px-6 py-4"><StatusBadge isActive={council.is_active} /></td>
                  {/* Portal URL */}
                  <td className="px-6 py-4">
                    <a
                      href={council.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Open portal
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedCouncil(council)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        title="View / Edit"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {council.is_active && (
                        <button
                          onClick={() => handleDeactivate(council)}
                          disabled={deactivating === council.id}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Deactivate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deactivating === council.id ? 'Deactivating…' : 'Deactivate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
            <p className="text-xs text-gray-500">
              Page {page} of {pagination.pages} ({pagination.total} councils)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateCouncilModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchCouncils(); }}
        />
      )}
      {selectedCouncil && (
        <CouncilDetailModal
          council={selectedCouncil}
          onClose={() => setSelectedCouncil(null)}
          onUpdated={() => { setSelectedCouncil(null); fetchCouncils(); }}
        />
      )}
    </div>
  );
}
