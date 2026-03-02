/**
 * CouncilDetailModal
 * ==================
 * View and edit a council's full profile.
 * Also lists the council's users and allows provisioning new ones.
 *
 * Tabs:
 *   - Overview (branding, contact, plan)
 *   - Users (list + provision)
 */

import React, { useState, useEffect } from 'react';
import {
  X, Building2, Globe, Mail, Phone, Palette, User, Lock,
  CheckCircle, AlertCircle, Loader2, Users, Plus, ExternalLink,
  Edit, Save, RefreshCw,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';

function getAuthHeader() {
  const token = localStorage.getItem('gt_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
  return data;
}

async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
  return data;
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
  return data;
}

const ROLE_LABELS = {
  council_admin:           { label: 'Council Admin',    colour: 'bg-purple-100 text-purple-700' },
  council_staff:           { label: 'Council Staff',    colour: 'bg-blue-100 text-blue-700' },
  community_member:        { label: 'Community Member', colour: 'bg-gray-100 text-gray-700' },
  professional_consultant: { label: 'Consultant',       colour: 'bg-orange-100 text-orange-700' },
};

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ council, onUpdated }) {
  const [editing,      setEditing]      = useState(false);
  const [form,         setForm]         = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState(null);
  const [success,      setSuccess]      = useState(null);

  useEffect(() => {
    setForm({
      contact_email:    council.contact_email    || '',
      contact_phone:    council.contact_phone    || '',
      website_url:      council.website_url      || '',
      primary_colour:   council.primary_colour   || '#15803d',
      secondary_colour: council.secondary_colour || '#166534',
      logo_url:         council.logo_url         || '',
      plan:             council.plan             || 'starter',
    });
  }, [council]);

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiPatch(`/api/councils/${council.id}`, form);
      setSuccess('Council profile updated.');
      setEditing(false);
      setTimeout(() => { setSuccess(null); onUpdated(); }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Field = ({ label, value, icon: Icon }) => (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {Icon && <Icon className="inline h-3 w-3 mr-1" />}{label}
      </p>
      <p className="mt-0.5 text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Council identity (read-only) */}
      <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
        <Field label="Subdomain"   value={`${council.subdomain}.grantthrive.com`} icon={Globe} />
        <Field label="State"       value={council.state} />
        <Field label="LGA Code"    value={council.lga_code} />
        <Field label="Created"     value={council.created_at ? new Date(council.created_at).toLocaleDateString('en-AU') : null} />
      </div>

      {/* Portal URL */}
      <a
        href={council.portal_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
      >
        <Globe className="h-4 w-4" />
        {council.portal_url}
        <ExternalLink className="h-3.5 w-3.5 ml-auto" />
      </a>

      {/* Editable fields */}
      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Plan</label>
              <select
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Primary Colour</label>
              <div className="flex gap-2">
                <input type="color" value={form.primary_colour}
                  onChange={e => setForm(f => ({ ...f, primary_colour: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-300 p-0.5" />
                <input type="text" value={form.primary_colour}
                  onChange={e => setForm(f => ({ ...f, primary_colour: e.target.value }))}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Contact Email</label>
              <input type="email" value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Contact Phone</label>
              <input type="tel" value={form.contact_phone}
                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Website URL</label>
              <input type="url" value={form.website_url}
                onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Logo URL</label>
              <input type="url" value={form.logo_url}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />{success}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 transition-colors">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plan"          value={council.plan} />
            <Field label="Contact Email" value={council.contact_email} icon={Mail} />
            <Field label="Contact Phone" value={council.contact_phone} icon={Phone} />
            <Field label="Website"       value={council.website_url} icon={Globe} />
          </div>
          <button onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Edit className="h-4 w-4" /> Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ council }) {
  const [users,        setUsers]        = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState({ email: '', first_name: '', last_name: '', password: '', role: 'council_admin' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError,    setFormError]    = useState(null);
  const [formSuccess,  setFormSuccess]  = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet(`/api/councils/${council.id}/users`);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [council.id]);

  const handleProvision = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiPost(`/api/councils/${council.id}/users`, form);
      setFormSuccess(`User "${form.email}" provisioned.`);
      setForm({ email: '', first_name: '', last_name: '', password: '', role: 'council_admin' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Provision User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleProvision} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">New User</h4>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="First name" value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            <input type="text" placeholder="Last name" value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            <input type="email" placeholder="Email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            <input type="password" placeholder="Password (min 10 chars)" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600" />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600">
              <option value="council_admin">Council Admin</option>
              <option value="council_staff">Council Staff</option>
              <option value="community_member">Community Member</option>
            </select>
          </div>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          {formSuccess && <p className="text-xs text-green-600">{formSuccess}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50 transition-colors">
              {isSubmitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Provisioning…</> : 'Provision'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No users yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {users.map(u => {
            const roleCfg = ROLE_LABELS[u.role] || { label: u.role, colour: 'bg-gray-100 text-gray-700' };
            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleCfg.colour}`}>
                    {roleCfg.label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function CouncilDetailModal({ council, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {council.logo_url ? (
              <img src={council.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                style={{ backgroundColor: council.primary_colour || '#15803d' }}>
                {council.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{council.name}</h2>
              <p className="text-xs text-gray-500">{council.subdomain}.grantthrive.com</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'users',    label: 'Users',    icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewTab council={council} onUpdated={onUpdated} />}
          {activeTab === 'users'    && <UsersTab    council={council} />}
        </div>
      </div>
    </div>
  );
}
