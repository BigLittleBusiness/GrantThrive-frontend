import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card.jsx';
import { Button } from '@shared/components/ui/button.jsx';
import { Badge } from '@shared/components/ui/badge.jsx';
import { Input } from '@shared/components/ui/input.jsx';
import {
  Search, Eye, Check, X, Clock, Mail, Phone, Briefcase, User,
  AlertCircle, CheckCircle, XCircle, RefreshCw, Building,
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
  const councilId = user?.council_id;

  const [pendingStaff, setPendingStaff] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget]       = useState(null);
  const [toast, setToast]                     = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPending = useCallback(async () => {
    if (!councilId) {
      setError('Your account is not linked to a council. Please contact support.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/councils/${councilId}/staff/pending`,
        { headers: authHeaders() },
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setPendingStaff(data.pending_staff || []);
    } catch (err) {
      setError(err.message || 'Failed to load pending staff registrations.');
    } finally {
      setLoading(false);
    }
  }, [councilId]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (staffId) => {
    setActionLoading(staffId);
    try {
      const res = await fetch(
        `${API_BASE}/api/councils/${councilId}/staff/${staffId}/approve`,
        { method: 'POST', headers: authHeaders() },
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Server returned ${res.status}`);
      }
      setPendingStaff(prev => prev.filter(s => s.id !== staffId));
      if (selectedStaff?.id === staffId) setSelectedStaff(null);
      showToast('Staff member approved and notified by email.');
    } catch (err) {
      showToast(err.message || 'Approval failed.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (s) => {
    setRejectTarget(s);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    setShowRejectModal(false);
    try {
      const res = await fetch(
        `${API_BASE}/api/councils/${councilId}/staff/${rejectTarget.id}/reject`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ reason: rejectReason }),
        },
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Server returned ${res.status}`);
      }
      setPendingStaff(prev => prev.filter(s => s.id !== rejectTarget.id));
      if (selectedStaff?.id === rejectTarget.id) setSelectedStaff(null);
      showToast('Staff request rejected and applicant notified.');
    } catch (err) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  const filtered = pendingStaff.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      (s.first_name + ' ' + s.last_name).toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.position?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  const daysPending = (createdAt) =>
    !createdAt ? 0 : Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Approvals</h1>
              <p className="text-gray-600">Review and approve pending staff account requests for your council.</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.type === 'error'
              ? <AlertCircle className="h-4 w-4" />
              : <CheckCircle className="h-4 w-4" />}
            {toast.message}
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pending Staff Requests</h2>
            <p className="mt-1 text-sm text-gray-600">
              Staff accounts awaiting your approval before they can access the portal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingStaff.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">
                <Clock className="w-3.5 h-3.5 mr-1 inline" />
                {pendingStaff.length} Pending
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
            Loading pending staff requests…
          </div>
        )}

        {/* Empty */}
        {!loading && !error && pendingStaff.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">All clear</h3>
            <p className="mt-1 text-sm text-gray-500">No staff accounts are awaiting approval.</p>
            <p className="mt-2 text-xs text-gray-400">
              To add staff directly, use the{' '}
              <button
                onClick={() => onNavigate('staff-management')}
                className="text-blue-600 underline hover:text-blue-800"
              >
                Manage Staff
              </button>{' '}
              page.
            </p>
          </div>
        )}

        {/* Split-panel list + detail */}
        {!loading && !error && pendingStaff.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left: list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email or role…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                {filtered.map(s => {
                  const days = daysPending(s.created_at);
                  return (
                    <Card
                      key={s.id}
                      onClick={() => setSelectedStaff(s)}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedStaff?.id === s.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">
                              {s.first_name} {s.last_name}
                            </p>
                            <p className="truncate text-sm text-gray-600">
                              {s.role === 'council_admin' ? 'Council Admin' : 'Council Staff'}
                            </p>
                            <p className="truncate text-xs text-gray-400">{s.email}</p>
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
              {!selectedStaff ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                  <div>
                    <Eye className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Select a request to review</p>
                  </div>
                </div>
              ) : (
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          {selectedStaff.first_name} {selectedStaff.last_name}
                        </CardTitle>
                        <p className="mt-1 text-sm text-gray-500">
                          Requested {daysPending(selectedStaff.created_at)} day
                          {daysPending(selectedStaff.created_at) !== 1 ? 's' : ''} ago
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800">Pending Approval</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 pt-5">
                    {/* Contact details */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{selectedStaff.email}</span>
                      </div>
                      {selectedStaff.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{selectedStaff.phone}</span>
                        </div>
                      )}
                      {selectedStaff.position && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{selectedStaff.position}</span>
                        </div>
                      )}
                      {selectedStaff.department && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Building className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{selectedStaff.department}</span>
                        </div>
                      )}
                    </div>

                    {/* Role info */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Requested Role
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-800">
                          {selectedStaff.role === 'council_admin' ? 'Council Administrator' : 'Council Staff'}
                        </span>
                      </div>
                      {selectedStaff.role === 'council_admin' && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                          This person is requesting administrator access. They will be able to manage staff, grants, and settings.
                        </p>
                      )}
                    </div>

                    {/* Approve / Reject */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11"
                        onClick={() => handleApprove(selectedStaff.id)}
                        disabled={actionLoading === selectedStaff.id}
                      >
                        {actionLoading === selectedStaff.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl h-11"
                        onClick={() => openRejectModal(selectedStaff)}
                        disabled={actionLoading === selectedStaff.id}
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
              <h3 className="text-lg font-bold text-gray-900">Reject Staff Request</h3>
              <p className="mt-1 text-sm text-gray-600">
                You are rejecting the staff request from{' '}
                <strong>
                  {rejectTarget.first_name} {rejectTarget.last_name}
                </strong>
                . They will be notified by email.
              </p>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="e.g. Could not verify employment with this council."
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
    </div>
  );
};

export default AdminApprovalDashboard;
