import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import {
  Search, Eye, Check, X, Clock, Mail, Phone, Building, User,
  AlertCircle, CheckCircle, XCircle, RefreshCw, Globe,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'gt_auth_token';

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const AdminApprovalDashboard = ({ user, onNavigate, onLogout }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/pending`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setPendingUsers(data.pending_users || []);
    } catch (err) {
      setError(err.message || 'Failed to load pending registrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Server returned ${res.status}`);
      }
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      showToast('Council admin approved and notified by email.');
    } catch (err) {
      showToast(err.message || 'Approval failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (u) => {
    setRejectTarget(u);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    setShowRejectModal(false);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${rejectTarget.id}/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Server returned ${res.status}`);
      }
      setPendingUsers(prev => prev.filter(u => u.id !== rejectTarget.id));
      if (selectedUser?.id === rejectTarget.id) setSelectedUser(null);
      showToast('Registration rejected and applicant notified.');
    } catch (err) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  const filtered = pendingUsers.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      (u.first_name + ' ' + u.last_name).toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.organization_name?.toLowerCase().includes(q)
    );
  });

  const daysPending = (createdAt) =>
    !createdAt ? 0 : Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Council Registrations</h2>
          <p className="mt-1 text-sm text-gray-600">
            Review and approve new council administrator registrations awaiting approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingUsers.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">
              <Clock className="w-3.5 h-3.5 mr-1 inline" />
              {pendingUsers.length} Pending
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchPending} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mr-3" />
          Loading pending registrations…
        </div>
      )}

      {/* Empty */}
      {!loading && !error && pendingUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">All clear</h3>
          <p className="mt-1 text-sm text-gray-500">No council registrations are awaiting approval.</p>
        </div>
      )}

      {/* Split-panel list + detail */}
      {!loading && !error && pendingUsers.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email or council…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              {filtered.map(u => {
                const days = daysPending(u.created_at);
                return (
                  <Card
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedUser?.id === u.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-gray-900">
                            {u.first_name} {u.last_name}
                          </p>
                          <p className="truncate text-sm text-gray-600">{u.organization_name || '—'}</p>
                          <p className="truncate text-xs text-gray-400">{u.email}</p>
                        </div>
                        <Badge
                          className={`shrink-0 text-xs ${
                            days > 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {days}d
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">No results match your search.</p>
              )}
            </div>
          </div>

          {/* Right: detail */}
          <div className="lg:col-span-3">
            {!selectedUser ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                <div>
                  <Eye className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Select a registration to review</p>
                </div>
              </div>
            ) : (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </CardTitle>
                      <p className="mt-1 text-sm text-gray-500">
                        Registered {daysPending(selectedUser.created_at)} day
                        {daysPending(selectedUser.created_at) !== 1 ? 's' : ''} ago
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">Pending Approval</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-5">
                  {/* Contact & council details */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{selectedUser.phone}</span>
                      </div>
                    )}
                    {selectedUser.organization_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Building className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{selectedUser.organization_name}</span>
                      </div>
                    )}
                    {selectedUser.position && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{selectedUser.position}</span>
                      </div>
                    )}
                    {selectedUser.subdomain && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                        <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-blue-700">
                          {selectedUser.subdomain}.grantthrive.com.au
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verification checks */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Verification Checks
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {selectedUser.email?.match(/\.(gov\.au|govt\.nz)$/) ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span className="text-gray-700">Government email domain</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedUser.subdomain ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-gray-700">Subdomain selected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedUser.organization_name ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span className="text-gray-700">Council name provided</span>
                      </div>
                    </div>
                  </div>

                  {/* Approve / Reject */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11"
                      onClick={() => handleApprove(selectedUser.id)}
                      disabled={actionLoading === selectedUser.id}
                    >
                      {actionLoading === selectedUser.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl h-11"
                      onClick={() => openRejectModal(selectedUser)}
                      disabled={actionLoading === selectedUser.id}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Reject confirmation modal */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Reject Registration</h3>
            <p className="mt-1 text-sm text-gray-600">
              You are rejecting the registration for{' '}
              <strong>
                {rejectTarget.first_name} {rejectTarget.last_name}
              </strong>{' '}
              ({rejectTarget.organization_name}). They will be notified by email.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="e.g. Could not verify council affiliation."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovalDashboard;
