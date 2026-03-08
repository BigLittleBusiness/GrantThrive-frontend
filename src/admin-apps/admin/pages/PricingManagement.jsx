/**
 * PricingManagement — GrantThrive System Admin Pricing Screen
 * ============================================================
 * Allows authenticated system_admin users to view and edit all plan pricing:
 *   - Monthly and annual subscription prices (per plan)
 *   - Annual per-month equivalent (display only)
 *   - Add-on prices for Community Voting and Grant Mapping (Small plan only)
 *
 * Changes are saved immediately to the database via PUT /api/pricing/admin/plans/:key
 * and are reflected on the public marketing website pricing page in real time.
 *
 * Security:
 *   - Only accessible to system_admin users (enforced by AdminAuthGate + backend)
 *   - All mutations are recorded in the backend audit log
 *   - A confirmation modal is shown before applying changes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, RefreshCw, Save, CheckCircle, XCircle, AlertTriangle,
  Info, Edit3, RotateCcw, Clock, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge }  from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input }  from '@shared/components/ui/input';

// ── API helpers ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';

function getAuthHeader() {
  const token = localStorage.getItem('gt_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { errors: data.errors });
  return data;
}

// ── Utility helpers ───────────────────────────────────────────────────────────

/** Convert AUD cents to a display dollar string, e.g. 20000 → "$200" */
function centsToDisplay(cents) {
  if (cents == null) return '—';
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

/** Parse a user-entered dollar string to AUD cents integer, e.g. "200" → 20000 */
function parseDollarsToCents(str) {
  const n = parseFloat(String(str).replace(/[^0-9.]/g, ''));
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Validate a cents value: must be a non-negative integer */
function validateCents(val) {
  if (val === null || val === undefined || val === '') return 'Required';
  const cents = parseDollarsToCents(val);
  if (cents === null) return 'Must be a valid dollar amount (e.g. 200)';
  if (cents < 0) return 'Must be $0 or more';
  return null;
}

// ── Plan metadata (static — only prices come from the API) ────────────────────

const PLAN_META = {
  small:  { label: 'Small Council',  population: '5K – 20K population',   highlight: false, hasAddons: true  },
  medium: { label: 'Medium Council', population: '20K – 100K population',  highlight: true,  hasAddons: false },
  large:  { label: 'Large Council',  population: '100K+ population',       highlight: false, hasAddons: false },
};

const PLAN_ORDER = ['small', 'medium', 'large'];

// ── Toast notification ────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colours = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50   border-red-200   text-red-800',
    info:    'bg-blue-50  border-blue-200  text-blue-800',
  };
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border px-5 py-4 shadow-lg max-w-sm ${colours[type]}`}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onDismiss} className="ml-auto text-current opacity-60 hover:opacity-100">
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ planKey, changes, onConfirm, onCancel, saving }) {
  const meta = PLAN_META[planKey] || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Confirm Pricing Update</h2>
            <p className="text-sm text-gray-500">{meta.label}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You are about to update the following prices. These changes will be reflected
          immediately on the <strong>public marketing website</strong> and applied to
          all <strong>new sign-ups</strong>.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6 text-sm">
          {changes.map(({ label, from, to }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-gray-600">{label}</span>
              <span className="flex items-center gap-2">
                <span className="text-gray-400 line-through">{from}</span>
                <span className="font-semibold text-gray-900">{to}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving…' : 'Apply Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Reset-to-defaults confirm modal ──────────────────────────────────────────

function ResetModal({ onConfirm, onCancel, resetting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <RotateCcw className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Reset All Prices to Defaults?</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          This will reset <strong>all three plans</strong> back to the original compiled defaults
          (Small $200/mo, Medium $500/mo, Large $1,100/mo, add-ons $50/mo each).
          The change will be visible on the public pricing page immediately.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={resetting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={resetting}
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            {resetting ? 'Resetting…' : 'Reset to Defaults'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Dollar input field ────────────────────────────────────────────────────────

function DollarInput({ label, hint, value, onChange, error, disabled }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
        <Input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`pl-7 ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
          placeholder="0"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ── Plan editor card ──────────────────────────────────────────────────────────

function PlanCard({ planKey, serverData, onSaved, onToast }) {
  const meta = PLAN_META[planKey];

  // Local form state (dollar strings for UX, converted to cents on save)
  const [form, setForm] = useState({
    display_name:                  '',
    monthly_price_aud:             '',
    annual_price_aud:              '',
    annual_monthly_price_aud:      '',
    addon_community_voting_aud:    '',
    addon_grant_mapping_aud:       '',
  });
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Populate form when server data arrives
  useEffect(() => {
    if (!serverData) return;
    setForm({
      display_name:               serverData.display_name || meta.label,
      monthly_price_aud:          String(Math.round(serverData.monthly_price_aud_cents / 100)),
      annual_price_aud:           String(Math.round(serverData.annual_price_aud_cents / 100)),
      annual_monthly_price_aud:   String(Math.round(serverData.annual_monthly_price_aud_cents / 100)),
      addon_community_voting_aud: String(Math.round((serverData.addon_community_voting_cents ?? 50) / 100)),
      addon_grant_mapping_aud:    String(Math.round((serverData.addon_grant_mapping_cents ?? 50) / 100)),
    });
    setDirty(false);
    setErrors({});
  }, [serverData, meta.label]);

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setDirty(true);
    setErrors(e => ({ ...e, [field]: null }));
  };

  // Validate all fields; return true if valid
  const validate = () => {
    const e = {};
    const priceFields = ['monthly_price_aud', 'annual_price_aud', 'annual_monthly_price_aud'];
    if (meta.hasAddons) {
      priceFields.push('addon_community_voting_aud', 'addon_grant_mapping_aud');
    }
    priceFields.forEach(f => {
      const err = validateCents(form[f]);
      if (err) e[f] = err;
    });
    if (!form.display_name.trim()) e.display_name = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Build a human-readable list of changes for the confirm modal
  const buildChanges = () => {
    if (!serverData) return [];
    const changes = [];
    const prev = serverData;
    const curr = form;

    const check = (label, prevCents, currDollars) => {
      const newCents = parseDollarsToCents(currDollars);
      if (newCents !== prevCents) {
        changes.push({ label, from: centsToDisplay(prevCents), to: centsToDisplay(newCents) });
      }
    };

    if (curr.display_name.trim() !== prev.display_name) {
      changes.push({ label: 'Display Name', from: prev.display_name, to: curr.display_name.trim() });
    }
    check('Monthly Price',            prev.monthly_price_aud_cents,          curr.monthly_price_aud);
    check('Annual Price (total)',      prev.annual_price_aud_cents,           curr.annual_price_aud);
    check('Annual Per-Month Display',  prev.annual_monthly_price_aud_cents,   curr.annual_monthly_price_aud);
    if (meta.hasAddons) {
      check('Add-on: Community Voting', prev.addon_community_voting_cents, curr.addon_community_voting_aud);
      check('Add-on: Grant Mapping',    prev.addon_grant_mapping_cents,    curr.addon_grant_mapping_aud);
    }
    return changes;
  };

  const handleSaveClick = () => {
    if (!validate()) return;
    const changes = buildChanges();
    if (changes.length === 0) {
      onToast('No changes to save.', 'info');
      return;
    }
    setConfirmModal(true);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const body = {
        display_name:                   form.display_name.trim(),
        monthly_price_aud_cents:        parseDollarsToCents(form.monthly_price_aud),
        annual_price_aud_cents:         parseDollarsToCents(form.annual_price_aud),
        annual_monthly_price_aud_cents: parseDollarsToCents(form.annual_monthly_price_aud),
      };
      if (meta.hasAddons) {
        body.addon_community_voting_cents = parseDollarsToCents(form.addon_community_voting_aud);
        body.addon_grant_mapping_cents    = parseDollarsToCents(form.addon_grant_mapping_aud);
      }
      const result = await apiFetch(`/pricing/admin/plans/${planKey}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setConfirmModal(false);
      setDirty(false);
      onSaved(planKey, result.plan);
      onToast(`${meta.label} pricing updated successfully.`, 'success');
    } catch (err) {
      setConfirmModal(false);
      onToast(err.message || 'Failed to save pricing.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!serverData) return;
    setForm({
      display_name:               serverData.display_name || meta.label,
      monthly_price_aud:          String(Math.round(serverData.monthly_price_aud_cents / 100)),
      annual_price_aud:           String(Math.round(serverData.annual_price_aud_cents / 100)),
      annual_monthly_price_aud:   String(Math.round(serverData.annual_monthly_price_aud_cents / 100)),
      addon_community_voting_aud: String(Math.round((serverData.addon_community_voting_cents ?? 50) / 100)),
      addon_grant_mapping_aud:    String(Math.round((serverData.addon_grant_mapping_cents ?? 50) / 100)),
    });
    setDirty(false);
    setErrors({});
  };

  const annualSavings = (() => {
    const monthly = parseDollarsToCents(form.monthly_price_aud);
    const annual  = parseDollarsToCents(form.annual_price_aud);
    if (monthly === null || annual === null) return null;
    return centsToDisplay(monthly * 12 - annual);
  })();

  return (
    <>
      {confirmModal && (
        <ConfirmModal
          planKey={planKey}
          changes={buildChanges()}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmModal(false)}
          saving={saving}
        />
      )}

      <Card className={`border-0 shadow-md ${meta.highlight ? 'ring-2 ring-primary' : ''}`}>
        {/* Card header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                meta.highlight ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{form.display_name || meta.label}</CardTitle>
                <p className="text-xs text-gray-500">{meta.population}</p>
              </div>
              {meta.highlight && (
                <Badge className="bg-primary/10 text-primary text-xs">Most Popular</Badge>
              )}
              {dirty && (
                <Badge className="bg-amber-100 text-amber-700 text-xs">Unsaved changes</Badge>
              )}
            </div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {/* Quick price summary (always visible) */}
          {!expanded && serverData && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Monthly: <strong>{centsToDisplay(serverData.monthly_price_aud_cents)}</strong></span>
              <span>Annual: <strong>{centsToDisplay(serverData.annual_price_aud_cents)}</strong></span>
              {meta.hasAddons && (
                <span>Add-ons: <strong>{centsToDisplay(serverData.addon_community_voting_cents)}</strong>/mo each</span>
              )}
            </div>
          )}
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-6">
            {/* Display name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Display Name
              </label>
              <Input
                value={form.display_name}
                onChange={e => update('display_name', e.target.value)}
                placeholder={meta.label}
                className={errors.display_name ? 'border-red-400' : ''}
              />
              {errors.display_name && <p className="text-xs text-red-600">{errors.display_name}</p>}
            </div>

            {/* Subscription prices */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Subscription Prices (AUD)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DollarInput
                  label="Monthly Price"
                  hint="Charged per month on monthly billing"
                  value={form.monthly_price_aud}
                  onChange={v => update('monthly_price_aud', v)}
                  error={errors.monthly_price_aud}
                />
                <DollarInput
                  label="Annual Total"
                  hint="Full amount billed once per year"
                  value={form.annual_price_aud}
                  onChange={v => update('annual_price_aud', v)}
                  error={errors.annual_price_aud}
                />
                <DollarInput
                  label="Annual Per-Month"
                  hint="Display only — annual total ÷ 12"
                  value={form.annual_monthly_price_aud}
                  onChange={v => update('annual_monthly_price_aud', v)}
                  error={errors.annual_monthly_price_aud}
                />
              </div>

              {/* Live savings preview */}
              {annualSavings && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    Annual billing saves customers <strong>{annualSavings}/year</strong> vs monthly
                    (2 months free at current prices)
                  </span>
                </div>
              )}
            </div>

            {/* Add-ons (Small plan only) */}
            {meta.hasAddons && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Optional Add-On Prices (AUD/month)</p>
                <p className="text-xs text-gray-400 mb-3">
                  These add-ons are available exclusively to Small Council subscribers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DollarInput
                    label="Community Voting Add-On"
                    value={form.addon_community_voting_aud}
                    onChange={v => update('addon_community_voting_aud', v)}
                    error={errors.addon_community_voting_aud}
                  />
                  <DollarInput
                    label="Grant Mapping Add-On"
                    value={form.addon_grant_mapping_aud}
                    onChange={v => update('addon_grant_mapping_aud', v)}
                    error={errors.addon_grant_mapping_aud}
                  />
                </div>
              </div>
            )}

            {/* Audit info */}
            {serverData?.updated_at && (
              <div className="flex items-center gap-2 text-xs text-gray-400 border-t pt-3">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Last updated {new Date(serverData.updated_at).toLocaleString('en-AU')}
                  {serverData.updated_by ? ` by ${serverData.updated_by}` : ''}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={!dirty}
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Discard Changes
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={handleSaveClick}
                disabled={!dirty}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save {meta.label} Pricing
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PricingManagement() {
  const [serverPlans, setServerPlans] = useState({});   // keyed by plan_key
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Load pricing from backend ───────────────────────────────────────────────
  const loadPricing = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch('/pricing/admin/plans');
      const byKey = {};
      (data.plans || []).forEach(p => { byKey[p.plan_key] = p; });
      setServerPlans(byKey);
    } catch (err) {
      setLoadError(err.message || 'Failed to load pricing data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPricing(); }, [loadPricing]);

  // ── Handle a successful save from a PlanCard ────────────────────────────────
  const handleSaved = useCallback((planKey, updatedPlan) => {
    setServerPlans(prev => ({ ...prev, [planKey]: updatedPlan }));
  }, []);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  // ── Reset all to defaults ───────────────────────────────────────────────────
  const handleReset = async () => {
    setResetting(true);
    try {
      await apiFetch('/pricing/admin/plans/reset', {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      });
      setShowResetModal(false);
      await loadPricing();
      showToast('All plan prices reset to defaults.', 'success');
    } catch (err) {
      setShowResetModal(false);
      showToast(err.message || 'Reset failed.', 'error');
    } finally {
      setResetting(false);
    }
  };

  // ── Load audit history ──────────────────────────────────────────────────────
  const loadHistory = async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    try {
      const data = await apiFetch('/pricing/admin/history');
      setHistory(data.history || []);
      setShowHistory(true);
    } catch {
      showToast('Could not load pricing history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Reset modal */}
      {showResetModal && (
        <ResetModal
          onConfirm={handleReset}
          onCancel={() => setShowResetModal(false)}
          resetting={resetting}
        />
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Pricing Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Edit subscription and add-on prices. Changes are reflected on the public pricing page immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPricing}
            disabled={loading}
            title="Refresh pricing data"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={historyLoading}
          >
            <Clock className="h-4 w-4 mr-1.5" />
            {historyLoading ? 'Loading…' : 'Change History'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowResetModal(true)}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>How pricing works:</strong> Enter prices in whole Australian dollars.
          The <em>Annual Total</em> is the lump-sum billed once per year; the
          <em> Annual Per-Month</em> figure is displayed on the pricing page for comparison.
          For "2 months free", set Annual Total = Monthly × 10 and Annual Per-Month = Annual Total ÷ 12.
        </div>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{loadError}</span>
          <Button variant="ghost" size="sm" onClick={loadPricing} className="ml-auto text-red-700">
            Retry
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !loadError && (
        <div className="grid gap-6">
          {PLAN_ORDER.map(key => (
            <Card key={key} className="border-0 shadow-md animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan cards */}
      {!loading && !loadError && (
        <div className="grid gap-6">
          {PLAN_ORDER.map(key => (
            <PlanCard
              key={key}
              planKey={key}
              serverData={serverPlans[key] || null}
              onSaved={handleSaved}
              onToast={showToast}
            />
          ))}
        </div>
      )}

      {/* Change history panel */}
      {showHistory && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Pricing Change History
              </CardTitle>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No pricing changes recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4">Timestamp</th>
                      <th className="pb-2 pr-4">Changed By</th>
                      <th className="pb-2 pr-4">IP Address</th>
                      <th className="pb-2">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map(entry => (
                      <tr key={entry.id} className="py-2">
                        <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-AU') : '—'}
                        </td>
                        <td className="py-2 pr-4 text-gray-600">{entry.changed_by || '—'}</td>
                        <td className="py-2 pr-4 text-gray-500 font-mono text-xs">{entry.ip_address || '—'}</td>
                        <td className="py-2 text-gray-500 text-xs max-w-xs truncate">{entry.changes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
