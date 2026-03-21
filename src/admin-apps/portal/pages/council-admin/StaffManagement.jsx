/**
 * StaffManagement — Council Admin
 * ================================
 * Allows a council_admin to:
 *   - View all staff members in their council
 *   - Add new staff (council_staff or council_admin)
 *   - Edit name / role / active status
 *   - Reset a staff member's password
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

const ROLE_LABELS = {
  council_admin: 'Admin',
  council_staff: 'Staff',
};

export default function StaffManagement({ user }) {
  const councilId = user?.council_id;

  const [staff, setStaff]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  // Add staff modal
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState({
    first_name: '', last_name: '', email: '', role: 'council_staff', password: '',
  });
  const [addLoading, setAddLoading]   = useState(false);
  const [addError, setAddError]       = useState('');
  const [tempPassword, setTempPassword] = useState('');

  // Edit modal
  const [editTarget, setEditTarget]   = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null);
  const [newPw, setNewPw]             = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const loadStaff = useCallback(async () => {
    if (!councilId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/councils/${councilId}/users`);
      setStaff(data.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [councilId]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  // ── Add staff ──────────────────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    setTempPassword('');
    try {
      const payload = { ...addForm };
      if (!payload.password) delete payload.password; // let backend auto-generate
      const data = await apiFetch(`/councils/${councilId}/staff`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.temporary_password) setTempPassword(data.temporary_password);
      setAddForm({ first_name: '', last_name: '', email: '', role: 'council_staff', password: '' });
      setSuccess(`${data.user.full_name} added successfully.`);
      loadStaff();
      if (!data.temporary_password) setShowAdd(false);
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAddLoading(false);
    }
  }

  // ── Edit staff ─────────────────────────────────────────────────────────────
  function openEdit(member) {
    setEditTarget(member);
    setEditForm({ first_name: member.full_name.split(' ')[0], last_name: member.full_name.split(' ').slice(1).join(' '), role: member.role, is_active: member.is_active });
  }

  async function handleEdit(e) {
    e.preventDefault();
    setEditLoading(true);
    try {
      await apiFetch(`/councils/${councilId}/staff/${editTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setSuccess('Staff member updated.');
      setEditTarget(null);
      loadStaff();
    } catch (e) {
      setError(e.message);
    } finally {
      setEditLoading(false);
    }
  }

  // ── Reset password ─────────────────────────────────────────────────────────
  async function handleResetPassword(e) {
    e.preventDefault();
    setResetLoading(true);
    try {
      await apiFetch(`/councils/${councilId}/staff/${resetTarget.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPw }),
      });
      setSuccess(`Password reset for ${resetTarget.full_name}.`);
      setResetTarget(null);
      setNewPw('');
    } catch (e) {
      setError(e.message);
    } finally {
      setResetLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">Add and manage your council's staff accounts.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setTempPassword(''); setAddError(''); }}
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Staff Member
        </button>
      </div>

      {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading staff…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.role === 'council_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {m.last_login ? new Date(m.last_login).toLocaleDateString('en-AU') : 'Never'}
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(m)}
                      className="text-xs text-blue-600 hover:underline"
                    >Edit</button>
                    <button
                      onClick={() => { setResetTarget(m); setNewPw(''); }}
                      className="text-xs text-orange-600 hover:underline"
                    >Reset PW</button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No staff members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Staff Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Staff Member</h2>
            {addError && <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{addError}</div>}
            {tempPassword ? (
              <div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Staff member added! Share this temporary password:</p>
                  <p className="font-mono text-lg font-bold text-yellow-900 tracking-wider">{tempPassword}</p>
                  <p className="text-xs text-yellow-700 mt-1">They should change this on first login.</p>
                </div>
                <button
                  onClick={() => { setShowAdd(false); setTempPassword(''); }}
                  className="w-full bg-green-700 text-white py-2 rounded-lg text-sm font-medium"
                >Done</button>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                    <input required value={addForm.first_name} onChange={e => setAddForm(f => ({...f, first_name: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                    <input required value={addForm.last_name} onChange={e => setAddForm(f => ({...f, last_name: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                  <input required type="email" value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                  <select value={addForm.role} onChange={e => setAddForm(f => ({...f, role: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="council_staff">Council Staff</option>
                    <option value="council_admin">Council Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password <span className="text-gray-400">(leave blank to auto-generate)</span>
                  </label>
                  <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({...f, password: e.target.value}))}
                    placeholder="Min 8 characters"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={addLoading}
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                    {addLoading ? 'Adding…' : 'Add Staff Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit {editTarget.full_name}</h2>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input value={editForm.first_name} onChange={e => setEditForm(f => ({...f, first_name: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input value={editForm.last_name} onChange={e => setEditForm(f => ({...f, last_name: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({...f, role: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="council_staff">Council Staff</option>
                  <option value="council_admin">Council Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={editForm.is_active}
                  onChange={e => setEditForm(f => ({...f, is_active: e.target.checked}))}
                  className="w-4 h-4 accent-green-700" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Account active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={editLoading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ─────────────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4">Set a new password for <strong>{resetTarget.full_name}</strong>.</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password *</label>
                <input required type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setResetTarget(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={resetLoading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {resetLoading ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
