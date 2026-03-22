/**
 * QRCodeManagement
 * =================
 * Council Admin page for generating and managing QR codes for grants.
 * Fetches real grants from the API and delegates rendering to QRCodeGenerator.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@shared/components/ui/card.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import {
  Search, RefreshCw, AlertCircle, QrCode, Calendar, DollarSign,
} from 'lucide-react';
import QRCodeGenerator from '../../components/QRCodeGenerator.jsx';
import apiClient from '../../utils/api.js';

const TOKEN_KEY = 'gt_auth_token';
const API_BASE  = import.meta.env.VITE_API_URL || '';

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const STATUS_BADGE = {
  open:     'bg-emerald-100 text-emerald-800',
  draft:    'bg-gray-100 text-gray-700',
  closed:   'bg-rose-100 text-rose-700',
  archived: 'bg-gray-100 text-gray-500',
};

const QRCodeManagement = ({ user, onNavigate, onLogout }) => {
  const [grants, setGrants]           = useState([]);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState('');

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/grants`, { headers: authHeaders() });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setGrants(data.grants || []);
    } catch (err) {
      setError(err.message || 'Failed to load grants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrants(); }, [fetchGrants]);

  const filtered = grants.filter(g => {
    const q = search.toLowerCase();
    return !q || g.title?.toLowerCase().includes(q) || g.category?.toLowerCase().includes(q);
  });

  const formatCurrency = (v) =>
    v != null ? `$${Number(v).toLocaleString('en-AU')}` : '—';

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
              <p className="text-gray-600">Generate and download QR codes for your grant programs.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('council/dashboard')}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={onLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left: grant list */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Select a Grant</CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchGrants} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search grants…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Loading grants…
                  </div>
                )}

                {!loading && filtered.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-500">
                    {grants.length === 0
                      ? 'No grants found. Create a grant first.'
                      : 'No grants match your search.'}
                  </div>
                )}

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {filtered.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGrant(g)}
                      className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                        selectedGrant?.id === g.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
                          {g.title}
                        </p>
                        <Badge className={`shrink-0 text-xs capitalize ${STATUS_BADGE[g.status] || STATUS_BADGE.draft}`}>
                          {g.status}
                        </Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(g.max_amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(g.closes_at)}
                        </span>
                      </div>
                      {selectedGrant?.id === g.id && (
                        <p className="mt-1 text-xs font-medium text-blue-600">
                          ✓ Selected — QR code shown on the right
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: QR generator */}
          <div className="lg:col-span-3">
            {!selectedGrant ? (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                <div className="text-center">
                  <QrCode className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Select a grant to generate its QR code</p>
                  <p className="mt-1 text-xs text-gray-400">
                    The QR code will encode the public grant application URL.
                  </p>
                </div>
              </div>
            ) : (
              <QRCodeGenerator
                grant={selectedGrant}
                onQRCodeGenerated={(data) => {
                  // Optional: persist to parent state if needed
                  console.info('QR generated for grant', data.grant_id);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeManagement;
