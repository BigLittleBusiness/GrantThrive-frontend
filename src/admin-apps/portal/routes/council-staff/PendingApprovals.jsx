/**
 * PendingApprovals — Portal Page
 * ================================
 * Available to: council_admin, council_staff
 *
 * Shows all applications in 'submitted' or 'under_review' state for the
 * council. Staff can:
 *   - Self-assign to an application
 *   - Recuse themselves (with a reason)
 *   - Assign to another staff member (admin only)
 *   - Submit a review score / recommendation
 *   - Approve or reject (admin only)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getToken } from '@grantthrive/auth';
import {
  ClipboardList, UserCheck, UserX, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Loader, AlertCircle, RefreshCw,
  Users, MessageSquare
} from 'lucide-react';

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

const STATUS_LABELS = {
  submitted:    { label: 'Submitted',    color: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  approved:     { label: 'Approved',     color: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>;
}

function RecuseModal({ app, onClose, onDone }) {
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await apiFetch(`/applications/${app.id}/recuse`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
      onDone();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Recuse from Application</h2>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{app.project_title}</strong> — please provide a brief reason.
        </p>
        {error && <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Reason for recusal (e.g. conflict of interest)..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : 'Confirm Recusal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ app, staffList, onClose, onDone }) {
  const [staffId, setStaffId] = useState('');
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!staffId) { setError('Please select a staff member.'); return; }
    setSaving(true); setError('');
    try {
      await apiFetch(`/applications/${app.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ staff_id: parseInt(staffId), notes }),
      });
      onDone();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Assign Reviewer</h2>
        <p className="text-sm text-gray-500 mb-4"><strong>{app.project_title}</strong></p>
        {error && <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assign to *</label>
            <select value={staffId} onChange={e => setStaffId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select staff member...</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name || `${s.first_name} ${s.last_name}`} ({s.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewModal({ app, onClose, onDone }) {
  const [score, setScore]             = useState('');
  const [recommendation, setRec]      = useState('approve');
  const [comments, setComments]       = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await apiFetch(`/applications/${app.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          total_score:    parseFloat(score) || 0,
          recommendation,
          comments,
          is_complete:    true,
        }),
      });
      onDone();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Submit Review</h2>
        <p className="text-sm text-gray-500 mb-4"><strong>{app.project_title}</strong> — {app.organization_name}</p>
        {error && <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Score (0–100)</label>
              <input type="number" min={0} max={100} step={0.5} value={score}
                onChange={e => setScore(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 75" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Recommendation</label>
              <select value={recommendation} onChange={e => setRec(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="approve">Approve</option>
                <option value="approve_with_conditions">Approve with Conditions</option>
                <option value="reject">Reject</option>
                <option value="defer">Defer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Comments</label>
            <textarea rows={4} value={comments} onChange={e => setComments(e.target.value)}
              placeholder="Provide your assessment notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApproveRejectModal({ app, action, onClose, onDone }) {
  const [comments, setComments] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const isApprove = action === 'approve';

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await apiFetch(`/applications/${app.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ comments }),
      });
      onDone();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className={`text-lg font-bold mb-1 ${isApprove ? 'text-green-700' : 'text-red-700'}`}>
          {isApprove ? 'Approve Application' : 'Reject Application'}
        </h2>
        <p className="text-sm text-gray-500 mb-4"><strong>{app.project_title}</strong></p>
        {error && <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Decision notes (optional)</label>
            <textarea rows={3} value={comments} onChange={e => setComments(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving}
              className={`flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                isApprove ? 'bg-green-700 hover:bg-green-800' : 'bg-red-600 hover:bg-red-700'
              }`}>
              {saving ? 'Saving...' : isApprove ? 'Approve' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationRow({ app, user, staffList, onRefresh }) {
  const [expanded, setExpanded]       = useState(false);
  const [modal, setModal]             = useState(null); // 'recuse' | 'assign' | 'review' | 'approve' | 'reject'
  const isAdmin = user?.role === 'council_admin';
  const myAssignment = app.my_assignment;
  const isAssigned   = myAssignment?.status === 'assigned';
  const isRecused    = myAssignment?.status === 'recused';

  function closeModal() { setModal(null); }
  function doneModal()  { setModal(null); onRefresh(); }

  async function handleSelfAssign() {
    try {
      await apiFetch(`/applications/${app.id}/assign`, { method: 'POST', body: JSON.stringify({}) });
      onRefresh();
    } catch (err) { alert(err.message); }
  }

  return (
    <>
      {modal === 'recuse'  && <RecuseModal app={app} onClose={closeModal} onDone={doneModal} />}
      {modal === 'assign'  && <AssignModal app={app} staffList={staffList} onClose={closeModal} onDone={doneModal} />}
      {modal === 'review'  && <ReviewModal app={app} onClose={closeModal} onDone={doneModal} />}
      {modal === 'approve' && <ApproveRejectModal app={app} action="approve" onClose={closeModal} onDone={doneModal} />}
      {modal === 'reject'  && <ApproveRejectModal app={app} action="reject" onClose={closeModal} onDone={doneModal} />}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <StatusBadge status={app.status} />
                {isAssigned && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Assigned to you</span>
                )}
                {isRecused && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">You recused</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900">{app.project_title}</h3>
              <p className="text-sm text-gray-500">{app.organization_name}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>Grant: {app.grant_title || `#${app.grant_id}`}</span>
                <span>Requested: ${Number(app.amount_requested || 0).toLocaleString()}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={11} /> {app.review_count} review{app.review_count !== 1 ? 's' : ''}
                </span>
                {app.assigned_staff?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {app.assigned_staff.filter(s => s.status === 'assigned').length} assigned
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              {/* Self-assign */}
              {!isAssigned && !isRecused && (
                <button onClick={handleSelfAssign}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-green-600 text-green-700 rounded-lg hover:bg-green-50">
                  <UserCheck size={12} /> Self-assign
                </button>
              )}
              {/* Recuse */}
              {isAssigned && (
                <button onClick={() => setModal('recuse')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-orange-400 text-orange-600 rounded-lg hover:bg-orange-50">
                  <UserX size={12} /> Recuse
                </button>
              )}
              {/* Submit review */}
              {isAssigned && (
                <button onClick={() => setModal('review')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <ClipboardList size={12} /> Review
                </button>
              )}
              {/* Admin: assign to another */}
              {isAdmin && (
                <button onClick={() => setModal('assign')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                  <Users size={12} /> Assign
                </button>
              )}
              {/* Admin: approve / reject */}
              {isAdmin && (
                <>
                  <button onClick={() => setModal('approve')}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800">
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => setModal('reject')}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <XCircle size={12} /> Reject
                  </button>
                </>
              )}
              <button onClick={() => setExpanded(e => !e)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
            {app.assigned_staff?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Assigned Reviewers</p>
                <div className="flex flex-wrap gap-2">
                  {app.assigned_staff.map(s => (
                    <span key={s.user_id} className={`text-xs px-2 py-1 rounded-full ${
                      s.status === 'assigned'  ? 'bg-blue-100 text-blue-700' :
                      s.status === 'recused'   ? 'bg-orange-100 text-orange-700' :
                      s.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {s.name} ({s.status})
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-gray-800">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-AU') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reviews completed</p>
                <p className="text-gray-800">{app.review_count}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function PendingApprovals({ user }) {
  const [apps, setApps]           = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('all'); // 'all' | 'mine' | 'unassigned'
  const isAdmin = user?.role === 'council_admin';

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await apiFetch('/applications/pending');
      setApps(data.applications || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadStaff = useCallback(async () => {
    if (!isAdmin || !user?.council_id) return;
    try {
      const data = await apiFetch(`/councils/${user.council_id}/users?role=council_staff,council_admin`);
      setStaffList(data.users || []);
    } catch { /* non-critical */ }
  }, [isAdmin, user?.council_id]);

  useEffect(() => { load(); loadStaff(); }, [load, loadStaff]);

  const filtered = apps.filter(app => {
    if (filter === 'mine')       return app.my_assignment?.status === 'assigned';
    if (filter === 'unassigned') return !app.assigned_staff?.some(s => s.status === 'assigned');
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-500 text-sm mt-1">
            Applications awaiting review for your council.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded-lg">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'all',        label: `All (${apps.length})` },
          { key: 'mine',       label: `Assigned to me (${apps.filter(a => a.my_assignment?.status === 'assigned').length})` },
          { key: 'unassigned', label: `Unassigned (${apps.filter(a => !a.assigned_staff?.some(s => s.status === 'assigned')).length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f.key
                ? 'bg-green-700 text-white border-green-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader size={24} className="animate-spin mr-2" /> Loading applications...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No applications pending review.</p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-sm text-green-700 hover:underline mt-1">
              Show all applications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <ApplicationRow key={app.id} app={app} user={user} staffList={staffList} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
