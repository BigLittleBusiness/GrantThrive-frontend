/**
 * AccountBilling — Council Admin
 * ================================
 * Shows the council's current plan, billing amounts, trial status,
 * and entitlements. Also allows the council admin to update their
 * council's contact details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getToken } from '@grantthrive/auth';

const API = '/api';

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

function fmt(cents) {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(0)} AUD`;
}

export default function AccountBilling({ user, onNavigate, onLogout }) {
  const councilId = user?.council_id;

  const [billing, setBilling]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Contact edit
  const [editContact, setEditContact] = useState(false);
  const [contactForm, setContactForm] = useState({});
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');

  const load = useCallback(async () => {
    if (!councilId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/councils/${councilId}/billing`);
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

  useEffect(() => { load(); }, [load]);

  async function handleSaveContact(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await apiFetch(`/councils/${councilId}`, {
        method: 'PATCH',
        body: JSON.stringify(contactForm),
      });
      setSaveMsg('Contact details updated.');
      setEditContact(false);
      load();
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-600">{error}</div>;
  if (!billing) return null;

  const plan = billing.plan || 'trial';
  const b    = billing.billing || {};
  const ents = billing.entitlements || {};

  const trialEnd = billing.trial_ends_at ? new Date(billing.trial_ends_at) : null;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account &amp; Billing</h1>
              <p className="text-gray-600">Your subscription plan and billing information.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => onNavigate('council/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {saveMsg && (
        <div className={`p-3 rounded-lg text-sm ${saveMsg.includes('updated') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {saveMsg}
        </div>
      )}

      {/* Plan card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Plan</p>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{PLAN_LABELS[plan] || plan}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[plan] || 'bg-gray-100 text-gray-600'}`}>
                {billing.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {plan === 'trial' && trialDaysLeft !== null && (
              <p className={`text-sm mt-1 ${trialDaysLeft <= 3 ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                {trialDaysLeft > 0
                  ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} (${trialEnd.toLocaleDateString('en-AU')})`
                  : 'Trial has ended — please upgrade to continue.'}
              </p>
            )}
          </div>
          {plan === 'trial' && (
            <a href="/portal/pricing" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Upgrade Plan
            </a>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Monthly Price', value: fmt(b.monthly_price_aud) },
            { label: 'Annual Price',  value: fmt(b.annual_price_aud) },
            { label: 'Voting Add-on', value: fmt(b.addon_voting_aud) },
            { label: 'Mapping Add-on',value: fmt(b.addon_mapping_aud) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Entitlements */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Plan Entitlements</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(ents).map(([key, val]) => {
            if (key === 'plan') return null;
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const display = typeof val === 'boolean'
              ? (val ? '✓ Included' : '✗ Not included')
              : String(val);
            return (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-sm font-medium ${typeof val === 'boolean' ? (val ? 'text-green-700' : 'text-gray-400') : 'text-gray-900'}`}>
                  {display}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact details */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Contact Details</h3>
          {!editContact && (
            <button onClick={() => setEditContact(true)}
              className="text-sm text-blue-600 hover:underline">Edit</button>
          )}
        </div>
        {editContact ? (
          <form onSubmit={handleSaveContact} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={contactForm.contact_email}
                onChange={e => setContactForm(f => ({...f, contact_email: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
              <input type="tel" value={contactForm.contact_phone}
                onChange={e => setContactForm(f => ({...f, contact_phone: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Website URL</label>
              <input type="url" value={contactForm.website_url}
                onChange={e => setContactForm(f => ({...f, website_url: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditContact(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <dl className="space-y-2 text-sm">
            {[
              ['Contact Email', billing.billing?.contact_email || user?.email],
              ['Contact Phone', billing.billing?.contact_phone || '—'],
              ['Website',       billing.billing?.website_url   || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4">
                <dt className="w-36 text-gray-500 flex-shrink-0">{label}</dt>
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
