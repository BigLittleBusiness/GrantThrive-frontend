/**
 * SystemAdminManagement — GrantThrive Staff Account Management
 * =============================================================
 * Allows authenticated system_admin users to:
 *   - View all GrantThrive staff (system_admin) accounts
 *   - Add a new system_admin account
 *   - Edit an existing account's name, email, or password
 *   - Deactivate (soft-delete) an account
 *   - Restore a deactivated account
 *
 * Security:
 *   - Only accessible to system_admin users (enforced by AdminAuthGate + backend)
 *   - A user cannot deactivate their own account
 *   - The last active system_admin cannot be deactivated
 *   - All mutations are recorded in the backend audit log
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog, Plus, Search, RefreshCw, Edit, UserX, UserCheck,
  CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Shield,
  ChevronLeft, ChevronRight, X, Save, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge }   from '@shared/components/ui/badge';
import { Button }  from '@shared/components/ui/button';
import { Input }   from '@shared/components/ui/input';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { fields: data.fields });
  return data;
}

function getCurrentUserId() {
  try {
    const token = localStorage.getItem('gt_auth_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return parseInt(payload.sub, 10);
  } catch {
    return null;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function PasswordInput({ id, value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pr-10 ${error ? 'border-red-500' : ''}`}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Modal: Add / Edit system_admin ────────────────────────────────────────────

function AdminFormModal({ admin, onClose, onSaved }) {
  const isEdit = !!admin;

  const [form, setForm] = useState({
    first_name: admin?.first_name || '',
    last_name:  admin?.last_name  || '',
    email:      admin?.email      || '',
    password:   '',
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    setErrors({});

    // Client-side validation
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim())  errs.last_name  = 'Last name is required.';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'A valid email address is required.';
    if (!isEdit && !form.password) errs.password = 'Password is required for new accounts.';
    if (form.password && form.password.length < 12) errs.password = 'Password must be at least 12 characters.';

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const body = { first_name: form.first_name, last_name: form.last_name, email: form.email };
      if (form.password) body.password = form.password;

      let result;
      if (isEdit) {
        result = await apiFetch(`/api/system-admins/${admin.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        result = await apiFetch('/api/system-admins', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      onSaved(result.admin);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setApiError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit System Admin' : 'Add System Admin'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {apiError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={set('first_name')}
                placeholder="Jane"
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={set('last_name')}
                placeholder="Smith"
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="jane@grantthrive.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && <span className="ml-1 text-xs font-normal text-gray-400">(leave blank to keep current)</span>}
            </label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={set('password')}
              placeholder={isEdit ? 'Enter new password to change' : 'Min. 12 characters'}
              error={errors.password}
            />
            {errors.password
              ? <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              : <p className="mt-1 text-xs text-gray-500">Must contain uppercase, lowercase, number, and special character.</p>
            }
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4 mr-2" /> {isEdit ? 'Save Changes' : 'Create Account'}</>
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal: Confirm deactivation ───────────────────────────────────────────────

function ConfirmDeactivateModal({ admin, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Deactivate Account</h2>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Are you sure you want to deactivate the account for:
          </p>
          <p className="text-sm font-semibold text-gray-900 mb-4">
            {admin.full_name || `${admin.first_name} ${admin.last_name}`} ({admin.email})
          </p>
          <p className="text-xs text-gray-500 mb-6">
            This will prevent them from logging in. You can restore the account at any time.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deactivating…</>
                : <><UserX className="h-4 w-4 mr-2" /> Deactivate</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SystemAdminManagement() {
  const currentUserId = getCurrentUserId();

  const [admins,     setAdmins]     = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const [showForm,       setShowForm]       = useState(false);
  const [editingAdmin,   setEditingAdmin]   = useState(null);   // null = create mode
  const [confirmDeact,   setConfirmDeact]   = useState(null);   // admin to deactivate
  const [actionLoading,  setActionLoading]  = useState(null);   // admin_id being actioned
  const [toast,          setToast]          = useState(null);   // { type, message }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, per_page: 15 });
      if (search)      params.set('search', search);
      if (activeFilter) params.set('active', activeFilter);

      const data = await apiFetch(`/api/system-admins?${params}`);
      setAdmins(data.admins);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSaved(admin) {
    setShowForm(false);
    setEditingAdmin(null);
    setToast({ type: 'success', message: editingAdmin
      ? `${admin.first_name} ${admin.last_name}'s account has been updated.`
      : `${admin.first_name} ${admin.last_name} has been added as a system admin.`
    });
    fetchAdmins();
  }

  async function handleDeactivate() {
    if (!confirmDeact) return;
    setActionLoading(confirmDeact.id);
    try {
      await apiFetch(`/api/system-admins/${confirmDeact.id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: `${confirmDeact.first_name} ${confirmDeact.last_name}'s account has been deactivated.` });
      setConfirmDeact(null);
      fetchAdmins();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
      setConfirmDeact(null);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestore(admin) {
    setActionLoading(admin.id);
    try {
      await apiFetch(`/api/system-admins/${admin.id}/restore`, { method: 'POST' });
      setToast({ type: 'success', message: `${admin.first_name} ${admin.last_name}'s account has been reactivated.` });
      fetchAdmins();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />
          }
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="h-6 w-6 text-blue-600" />
            System Admin Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage GrantThrive staff accounts with system-wide access.
          </p>
        </div>
        <Button
          onClick={() => { setEditingAdmin(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add System Admin
        </Button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          System admin accounts have unrestricted access to all councils, data, and platform settings.
          Only grant this role to authorised GrantThrive staff.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by name or email…"
                className="pl-9"
              />
            </div>
            <select
              value={activeFilter}
              onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All accounts</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
            <Button variant="outline" onClick={fetchAdmins} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-700">
            {isLoading ? 'Loading…' : `${pagination.total} account${pagination.total !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="flex items-center gap-2 m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!error && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Login</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading accounts…
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No system admin accounts found.
                      </td>
                    </tr>
                  ) : admins.map(admin => {
                    const isCurrentUser = admin.id === currentUserId;
                    const isActioning   = actionLoading === admin.id;
                    return (
                      <tr key={admin.id} className={`hover:bg-gray-50 transition-colors ${!admin.is_active ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                              {(admin.first_name?.[0] || '?').toUpperCase()}{(admin.last_name?.[0] || '').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {admin.first_name} {admin.last_name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">You</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">@{admin.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                        <td className="px-6 py-4"><StatusBadge isActive={admin.is_active} /></td>
                        <td className="px-6 py-4 text-gray-500">
                          {admin.last_login
                            ? new Date(admin.last_login).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                            : <span className="text-gray-300">Never</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {admin.created_at
                            ? new Date(admin.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingAdmin(admin); setShowForm(true); }}
                              disabled={isActioning}
                              title="Edit account"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            {/* Deactivate / Restore */}
                            {admin.is_active ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeact(admin)}
                                disabled={isActioning || isCurrentUser}
                                title={isCurrentUser ? 'You cannot deactivate your own account' : 'Deactivate account'}
                                className={!isCurrentUser ? 'border-red-200 text-red-600 hover:bg-red-50' : ''}
                              >
                                {isActioning
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <UserX className="h-3.5 w-3.5" />
                                }
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(admin)}
                                disabled={isActioning}
                                title="Restore account"
                                className="border-green-200 text-green-600 hover:bg-green-50"
                              >
                                {isActioning
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <UserCheck className="h-3.5 w-3.5" />
                                }
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showForm && (
        <AdminFormModal
          admin={editingAdmin}
          onClose={() => { setShowForm(false); setEditingAdmin(null); }}
          onSaved={handleSaved}
        />
      )}

      {confirmDeact && (
        <ConfirmDeactivateModal
          admin={confirmDeact}
          onClose={() => setConfirmDeact(null)}
          onConfirm={handleDeactivate}
          loading={actionLoading === confirmDeact.id}
        />
      )}
    </div>
  );
}
