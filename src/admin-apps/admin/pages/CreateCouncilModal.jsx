/**
 * CreateCouncilModal
 * ==================
 * Full-featured modal form for provisioning a new council tenant.
 *
 * Fields:
 *   - Council name (auto-derives subdomain)
 *   - Subdomain (editable, validated in real-time)
 *   - State, LGA code, plan
 *   - Contact email, phone, website
 *   - Primary colour (colour picker)
 *   - Optional: provision a council_admin user in the same transaction
 */

import React, { useState, useEffect } from 'react';
import {
  X, Building2, Globe, Mail, Phone, Palette, User, Lock,
  CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';
const STATES   = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

function getAuthHeader() {
  const token = localStorage.getItem('gt_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function deriveSubdomain(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '');
}

const INITIAL_FORM = {
  name:             '',
  subdomain:        '',
  state:            '',
  lga_code:         '',
  plan:             'starter',
  contact_email:    '',
  contact_phone:    '',
  website_url:      '',
  primary_colour:   '#15803d',
  // Admin user (optional)
  admin_email:      '',
  admin_first_name: '',
  admin_last_name:  '',
  admin_password:   '',
};

export default function CreateCouncilModal({ onClose, onCreated }) {
  const [form,         setForm]         = useState(INITIAL_FORM);
  const [subdomainAuto,setSubdomainAuto]= useState(true); // auto-derive until user edits it
  const [showAdmin,    setShowAdmin]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState(null);
  const [success,      setSuccess]      = useState(null);

  // Auto-derive subdomain from name
  useEffect(() => {
    if (subdomainAuto && form.name) {
      setForm(f => ({ ...f, subdomain: deriveSubdomain(form.name) }));
    }
  }, [form.name, subdomainAuto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subdomain') {
      setSubdomainAuto(false); // User is manually editing
      setForm(f => ({ ...f, subdomain: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const body = {
      name:           form.name,
      subdomain:      form.subdomain,
      state:          form.state,
      lga_code:       form.lga_code || undefined,
      plan:           form.plan,
      contact_email:  form.contact_email || undefined,
      contact_phone:  form.contact_phone || undefined,
      website_url:    form.website_url || undefined,
      primary_colour: form.primary_colour,
    };

    if (showAdmin && form.admin_email) {
      body.admin_email      = form.admin_email;
      body.admin_first_name = form.admin_first_name;
      body.admin_last_name  = form.admin_last_name;
      body.admin_password   = form.admin_password;
    }

    try {
      const res = await fetch(`${API_BASE}/api/councils`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      setSuccess(`Council "${data.council.name}" provisioned at ${data.council.portal_url}`);
      setTimeout(() => onCreated(data.council), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Building2 className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Provision New Council</h2>
              <p className="text-xs text-gray-500">Creates a new tenant with its own subdomain</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Council Details ── */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Council Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Council Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. City of Melbourne"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>

              {/* Subdomain */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subdomain <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600">
                  <input
                    type="text"
                    name="subdomain"
                    value={form.subdomain}
                    onChange={handleChange}
                    placeholder="cityofmelbourne"
                    required
                    className="flex-1 border-0 px-3 py-2 text-sm focus:outline-none"
                  />
                  <span className="flex items-center border-l border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 whitespace-nowrap">
                    .grantthrive.com
                  </span>
                </div>
                {form.subdomain && (
                  <p className="mt-1 text-xs text-gray-500">
                    Portal URL: <span className="font-medium text-green-700">https://{form.subdomain}.grantthrive.com</span>
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                  <option value="">Select state…</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* LGA Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">LGA Code</label>
                <input
                  type="text"
                  name="lga_code"
                  value={form.lga_code}
                  onChange={handleChange}
                  placeholder="e.g. 24600"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>

              {/* Plan */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Subscription Plan</label>
                <select
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Primary colour */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <Palette className="inline h-3.5 w-3.5 mr-1" />
                  Primary Brand Colour
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="primary_colour"
                    value={form.primary_colour}
                    onChange={handleChange}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-gray-300 p-1"
                  />
                  <input
                    type="text"
                    name="primary_colour"
                    value={form.primary_colour}
                    onChange={handleChange}
                    placeholder="#15803d"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Contact ── */}
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <Mail className="inline h-3.5 w-3.5 mr-1" /> Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={handleChange}
                  placeholder="grants@council.gov.au"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <Phone className="inline h-3.5 w-3.5 mr-1" /> Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={handleChange}
                  placeholder="+61 3 9658 9658"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <Globe className="inline h-3.5 w-3.5 mr-1" /> Website URL
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  placeholder="https://www.melbourne.vic.gov.au"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>
            </div>
          </section>

          {/* ── Optional: Admin User ── */}
          <section>
            <button
              type="button"
              onClick={() => setShowAdmin(v => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:border-green-600 hover:text-green-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Provision a Council Admin User (optional)
              </span>
              {showAdmin ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAdmin && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="admin_first_name"
                    value={form.admin_first_name}
                    onChange={handleChange}
                    placeholder="Sarah"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="admin_last_name"
                    value={form.admin_last_name}
                    onChange={handleChange}
                    placeholder="Johnson"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    <Mail className="inline h-3.5 w-3.5 mr-1" /> Admin Email
                  </label>
                  <input
                    type="email"
                    name="admin_email"
                    value={form.admin_email}
                    onChange={handleChange}
                    placeholder="admin@melbourne.vic.gov.au"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    <Lock className="inline h-3.5 w-3.5 mr-1" /> Temporary Password
                  </label>
                  <input
                    type="password"
                    name="admin_password"
                    value={form.admin_password}
                    onChange={handleChange}
                    placeholder="Min. 10 characters"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The admin user will be prompted to change this on first login.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── Feedback ── */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name || !form.subdomain || !form.state}
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Provisioning…</>
              ) : (
                <><Building2 className="h-4 w-4" /> Provision Council</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
