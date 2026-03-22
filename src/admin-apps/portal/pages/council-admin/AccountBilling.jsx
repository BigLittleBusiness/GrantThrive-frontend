/**
 * AccountBilling — Council Admin
 * ================================
 * Shows the council's current plan, billing amounts, trial status,
 * entitlements, SMS add-on tier selector, and contact details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getToken } from '@grantthrive/auth';

const API = import.meta.env.VITE_API_URL || '';

function apiFetch(path, opts = {}) {
  const token = getToken();
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }).then(async (r) => {
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
    return json;
  });
}

const PLAN_LABELS = {
  trial:  'Free Trial',
  small:  'Small Council',
  medium: 'Medium Council',
  large:  'Large Council',
};

const PLAN_COLORS = {
  trial:  'bg-yellow-100 text-yellow-800',
  small:  'bg-blue-100 text-blue-800',
  medium: 'bg-purple-100 text-purple-800',
  large:  'bg-green-100 text-green-800',
};

/** Format AUD cents → display string. */
function fmt(cents) {
  if (cents == null) return '—';
  return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0 })} AUD`;
}

/** Format message count with commas. */
function fmtMsgs(n) {
  return n.toLocaleString('en-AU');
}

// ── SMS Tier Card ─────────────────────────────────────────────────────────────
function SmsTierCard({ tier, isSelected, isEligible, onSelect, onCancel, loading }) {
  const selected = isSelected;
  const disabled = !isEligible || loading;

  return (
    <div className={`relative rounded-xl border-2 p-5 transition-all ${
      selected
        ? 'border-green-600 bg-green-50'
        : isEligible
          ? 'border-gray-200 bg-white hover:border-green-300 cursor-pointer'
          : 'border-gray-100 bg-gray-50 opacity-60'
    }`}
      onClick={() => {
        if (!disabled && !selected) onSelect(tier.key);
      }}
    >
      {selected && (
        <span className="absolute right-3 top-3 rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
          Active
        </span>
      )}
      {!isEligible && (
        <span className="absolute right-3 top-3 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
          Requires {PLAN_LABELS[tier.min_plan] || tier.min_plan}
        </span>
      )}

      <h4 className="mb-1 font-semibold text-gray-900">{tier.name}</h4>
      <p className="mb-3 text-2xl font-bold text-gray-900">
        {fmt(tier.price_aud_cents)}
        <span className="text-sm font-normal text-gray-500"> /month</span>
      </p>

      <ul className="mb-4 space-y-1 text-sm text-gray-600">
        <li>✓ {fmtMsgs(tier.included_messages)} messages included</li>
        <li>✓ ${(tier.overage_cents / 100).toFixed(2)} AUD per extra message</li>
        <li>✓ Delivered via GrantThrive's Twilio account</li>
        <li>✓ Opt-out compliance handled automatically</li>
      </ul>

      {selected ? (
        <button
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          disabled={loading}
          className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {loading ? 'Processing…' : 'Cancel SMS Add-on'}
        </button>
      ) : (
        <button
          disabled={disabled}
          className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
            isEligible
              ? 'bg-green-700 text-white hover:bg-green-800 disabled:opacity-50'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Processing…' : isEligible ? 'Select This Plan' : 'Not Available'}
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AccountBilling({ user, onNavigate, onLogout }) {
  const councilId = user?.council_id;

  const [billing, setBilling]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // SMS tier state
  const [smsData, setSmsData]     = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsMsg, setSmsMsg]       = useState('');
  const [smsMsgType, setSmsMsgType] = useState('success'); // 'success' | 'error'
  const [showConfirm, setShowConfirm] = useState(null); // tier key to confirm, or 'cancel'

  // Contact edit state
  const [editContact, setEditContact] = useState(false);
  const [contactForm, setContactForm] = useState({});
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');

  const loadBilling = useCallback(async () => {
    if (!councilId) {
      setError('No council associated with your account. Please contact support.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/councils/${councilId}/billing`);
      setBilling(data);
      setContactForm({
        contact_email: data.council?.contact_email || '',
        contact_phone: data.council?.contact_phone || '',
        website_url:   data.council?.website_url   || '',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [councilId]);

  const loadSmsTiers = useCallback(async () => {
    if (!councilId) return;
    try {
      const data = await apiFetch(`/api/councils/${councilId}/sms-tiers`);
      setSmsData(data);
    } catch {
      // Non-fatal — SMS section will show an error inline
    }
  }, [councilId]);

  useEffect(() => {
    loadBilling();
    loadSmsTiers();
  }, [loadBilling, loadSmsTiers]);

  async function handleSaveContact(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await apiFetch(`/api/councils/${councilId}`, {
        method: 'PATCH',
        body: JSON.stringify(contactForm),
      });
      setSaveMsg('Contact details updated successfully.');
      setEditContact(false);
      loadBilling();
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectTier(tierKey) {
    setShowConfirm(tierKey);
  }

  async function handleCancelSms() {
    setShowConfirm('cancel');
  }

  async function confirmAction() {
    setSmsLoading(true);
    setSmsMsg('');
    try {
      if (showConfirm === 'cancel') {
        const res = await apiFetch(`/api/councils/${councilId}/sms-tiers`, { method: 'DELETE' });
        setSmsMsg(res.message || 'SMS add-on cancelled.');
        setSmsMsgType('success');
      } else {
        const res = await apiFetch(`/api/councils/${councilId}/sms-tiers`, {
          method: 'POST',
          body: JSON.stringify({ tier: showConfirm }),
        });
        setSmsMsg(res.message || 'SMS add-on activated.');
        setSmsMsgType('success');
      }
      await loadSmsTiers();
    } catch (e) {
      setSmsMsg(e.message);
      setSmsMsgType('error');
    } finally {
      setSmsLoading(false);
      setShowConfirm(null);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading billing information…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-rose-600 font-medium">{error}</p>
          <button
            onClick={loadBilling}
            className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!billing) return null;

  const plan = billing.plan || 'trial';
  const b    = billing.billing || {};
  const ents = billing.entitlements || {};

  const trialEnd      = billing.trial_ends_at ? new Date(billing.trial_ends_at) : null;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86_400_000))
    : null;

  const currentTier = smsData?.current_tier;
  const tiers       = smsData?.tiers || [];

  // ── Confirmation modal ──────────────────────────────────────────────────────
  const confirmTierDetails = showConfirm && showConfirm !== 'cancel'
    ? tiers.find(t => t.key === showConfirm)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {showConfirm === 'cancel' ? (
              <>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Cancel SMS Add-on?</h3>
                <p className="mb-5 text-sm text-gray-600">
                  SMS notifications will be disabled for your council immediately. You can
                  re-subscribe at any time.
                </p>
              </>
            ) : (
              <>
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  Activate {confirmTierDetails?.name}?
                </h3>
                <p className="mb-2 text-sm text-gray-600">
                  You are about to activate the <strong>{confirmTierDetails?.name}</strong> add-on:
                </p>
                <ul className="mb-5 space-y-1 text-sm text-gray-700">
                  <li>• {fmtMsgs(confirmTierDetails?.included_messages || 0)} messages/month included</li>
                  <li>• {fmt(confirmTierDetails?.price_aud_cents)} per month (ex-GST)</li>
                  <li>• ${((confirmTierDetails?.overage_cents || 0) / 100).toFixed(2)} AUD per message above included volume</li>
                </ul>
                <p className="mb-5 text-xs text-gray-500">
                  This will be added to your next billing cycle. You can change or cancel at any time.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={confirmAction}
                disabled={smsLoading}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  showConfirm === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'
                }`}
              >
                {smsLoading ? 'Processing…' : showConfirm === 'cancel' ? 'Yes, Cancel' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account &amp; Billing</h1>
              <p className="text-gray-600">
                {billing.council_name
                  ? `${billing.council_name} — subscription plan and billing information.`
                  : 'Your subscription plan and billing information.'}
              </p>
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

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">

        {saveMsg && (
          <div className={`rounded-lg border p-3 text-sm ${
            saveMsg.includes('successfully')
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {saveMsg}
          </div>
        )}

        {/* ── Plan card ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm text-gray-500">Current Plan</p>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {PLAN_LABELS[plan] || plan}
                </h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[plan] || 'bg-gray-100 text-gray-600'}`}>
                  {billing.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {plan === 'trial' && trialDaysLeft !== null && (
                <p className={`mt-1 text-sm ${trialDaysLeft <= 3 ? 'font-medium text-red-600' : 'text-orange-600'}`}>
                  {trialDaysLeft > 0
                    ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} (${trialEnd.toLocaleDateString('en-AU')})`
                    : 'Trial has ended — please upgrade to continue.'}
                </p>
              )}
            </div>
            {plan === 'trial' && (
              <button
                onClick={() => onNavigate('council/pricing')}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Upgrade Plan
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Monthly Price',  value: fmt(b.monthly_price_aud_cents) },
              { label: 'Annual Price',   value: fmt(b.annual_price_aud_cents) },
              { label: 'Voting Add-on',  value: fmt(b.addon_voting_cents) },
              { label: 'Mapping Add-on', value: fmt(b.addon_mapping_cents) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SMS Add-on Tier Selector ────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">SMS Notifications Add-on</h3>
            {currentTier && (
              <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-800">
                Active — {tiers.find(t => t.key === currentTier)?.name || currentTier}
              </span>
            )}
          </div>
          <p className="mb-5 text-sm text-gray-500">
            Send SMS alerts to grant applicants for key events. All messages are delivered
            via GrantThrive's centralised Twilio account — no credentials required from you.
            {plan === 'trial' && (
              <span className="ml-1 font-medium text-amber-700">
                SMS is not available during the free trial. Upgrade your plan to unlock this feature.
              </span>
            )}
          </p>

          {smsMsg && (
            <div className={`mb-4 rounded-lg border p-3 text-sm ${
              smsMsgType === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {smsMsg}
            </div>
          )}

          {plan === 'trial' ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              Upgrade to a Small, Medium, or Large Council plan to access SMS notifications.
              <button
                onClick={() => onNavigate('council/pricing')}
                className="ml-3 font-medium underline hover:no-underline"
              >
                View Plans →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tiers.map((tier) => (
                <SmsTierCard
                  key={tier.key}
                  tier={tier}
                  isSelected={tier.key === currentTier}
                  isEligible={tier.eligible}
                  onSelect={handleSelectTier}
                  onCancel={handleCancelSms}
                  loading={smsLoading}
                />
              ))}
            </div>
          )}

          {tiers.length > 0 && plan !== 'trial' && (
            <p className="mt-4 text-xs text-gray-400">
              All prices are in AUD and exclude GST. Overage charges apply for messages above the
              included monthly volume. You can change or cancel your SMS add-on at any time.
            </p>
          )}
        </div>

        {/* ── Entitlements ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Plan Entitlements</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(ents).map(([key, val]) => {
              if (key === 'plan') return null;
              const label   = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              const display = typeof val === 'boolean'
                ? (val ? '✓ Included' : '✗ Not included')
                : String(val);
              return (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-sm font-medium ${
                    typeof val === 'boolean'
                      ? (val ? 'text-green-700' : 'text-gray-400')
                      : 'text-gray-900'
                  }`}>
                    {display}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Contact details ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Contact Details</h3>
            {!editContact && (
              <button
                onClick={() => setEditContact(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editContact ? (
            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={contactForm.contact_email}
                  onChange={e => setContactForm(f => ({ ...f, contact_email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  value={contactForm.contact_phone}
                  onChange={e => setContactForm(f => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Website URL</label>
                <input
                  type="url"
                  value={contactForm.website_url}
                  onChange={e => setContactForm(f => ({ ...f, website_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditContact(false); setSaveMsg(''); }}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <dl className="space-y-2 text-sm">
              {[
                ['Contact Email', billing.council?.contact_email || user?.email || '—'],
                ['Contact Phone', billing.council?.contact_phone || '—'],
                ['Website',       billing.council?.website_url   || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <dt className="w-36 shrink-0 text-gray-500">{label}</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

      </div>
    </div>
  );
}
