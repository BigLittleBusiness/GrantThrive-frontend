/**
 * CouncilRegistrations — GrantThrive Admin Dashboard
 * ===================================================
 * Pending account registrations awaiting system_admin approval
 * (council administrators who signed up with a government email).
 *
 * Approving a council_admin creates their Council (14-day trial) on the
 * requested subdomain. If that subdomain is taken, edit it and approve again.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, RefreshCw, Search, Check, X, Mail, Phone, Building2, Globe,
  Briefcase, Clock, AlertCircle, CheckCircle, Loader2, CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import api from '@shared/api/client';

const ROLE_LABELS = {
  council_admin: 'Council Admin',
  council_staff: 'Council Staff',
};

function Field({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      <span className="truncate">{children}</span>
    </div>
  );
}

function RegistrationCard({ registration, busy, onApprove, onReject, onSaveSubdomain }) {
  const [editingSubdomain, setEditingSubdomain] = useState(false);
  const [subdomain, setSubdomain] = useState(registration.subdomain || '');

  const saveSubdomain = async () => {
    if (await onSaveSubdomain(registration, subdomain)) setEditingSubdomain(false);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">{registration.full_name}</h3>
              <Badge variant="outline">{ROLE_LABELS[registration.role] || registration.role}</Badge>
              <span className="flex items-center gap-1 text-xs text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                {registration.days_pending === 0 ? 'Today' : `${registration.days_pending} day(s) waiting`}
              </span>
            </div>
            <Field icon={Building2}>{registration.organisation}</Field>
            <Field icon={CreditCard}>
              {registration.plan && `${registration.plan.charAt(0).toUpperCase()}${registration.plan.slice(1)} plan · ${registration.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} billing`}
            </Field>
            <Field icon={Mail}>{registration.email}</Field>
            <Field icon={Phone}>{registration.phone}</Field>
            <Field icon={Briefcase}>
              {[registration.position, registration.department].filter(Boolean).join(' · ')}
            </Field>
            {registration.role === 'council_admin' && (
              editingSubdomain ? (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <Input
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="h-8 w-56"
                    aria-label="Requested subdomain"
                  />
                  <span className="text-sm text-gray-500">.grantthrive.com</span>
                  <Button size="sm" onClick={saveSubdomain} disabled={busy || !subdomain.trim()}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSubdomain(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span>{registration.subdomain ? `${registration.subdomain}.grantthrive.com` : 'Subdomain derived from organisation'}</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-blue-600 hover:underline"
                    onClick={() => setEditingSubdomain(true)}
                  >
                    Edit
                  </button>
                </div>
              )
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              onClick={() => onApprove(registration, () => setEditingSubdomain(true))}
              disabled={busy}
              className="bg-green-700 hover:bg-green-800"
            >
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              Approve
            </Button>
            <Button variant="outline" onClick={() => onReject(registration)} disabled={busy}>
              <X className="mr-1 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CouncilRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/admin/users/pending');
      setRegistrations(data.pending_users);
    } catch (err) {
      setError(err.message || 'Failed to load pending registrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = (id) => setRegistrations((prev) => prev.filter((r) => r.id !== id));

  const approve = async (registration, onSubdomainConflict) => {
    setBusyId(registration.id);
    try {
      await api.post(`/admin/users/${registration.id}/approve`);
      remove(registration.id);
      showToast(`${registration.full_name} approved.`);
    } catch (err) {
      if (err.data?.conflict === 'subdomain_taken') onSubdomainConflict();
      showToast(err.message || 'Approval failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const saveSubdomain = async (registration, subdomain) => {
    setBusyId(registration.id);
    try {
      const data = await api.patch(`/admin/users/${registration.id}/subdomain`, { subdomain: subdomain.trim().toLowerCase() });
      setRegistrations((prev) => prev.map((r) => (r.id === registration.id ? { ...r, subdomain: data.subdomain } : r)));
      showToast('Subdomain updated.');
      return true;
    } catch (err) {
      showToast(err.message || 'Could not update the subdomain.', 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    const registration = rejectTarget;
    setRejectTarget(null);
    setBusyId(registration.id);
    try {
      await api.post(`/admin/users/${registration.id}/reject`, { reason: rejectReason });
      remove(registration.id);
      showToast(`${registration.full_name}'s registration was rejected.`);
    } catch (err) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setBusyId(null);
      setRejectReason('');
    }
  };

  const query = search.trim().toLowerCase();
  const filtered = registrations.filter((r) =>
    !query || [r.full_name, r.email, r.organisation, r.subdomain].some((v) => v?.toLowerCase().includes(query))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <UserCheck className="h-6 w-6 text-green-700" />
            Council Registrations
          </h2>
          <p className="text-sm text-gray-600">Registrations awaiting approval. Approving a council admin creates their council on a 14-day trial.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{registrations.length} pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, organisation or subdomain…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        !error && (
          <p className="py-12 text-center text-sm text-gray-500">
            {registrations.length ? 'No registrations match your search.' : 'No registrations are awaiting approval.'}
          </p>
        )
      ) : (
        <div className="space-y-3">
          {filtered.map((registration) => (
            <RegistrationCard
              key={registration.id}
              registration={registration}
              busy={busyId === registration.id}
              onApprove={approve}
              onReject={setRejectTarget}
              onSaveSubdomain={saveSubdomain}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Reject registration</h3>
            <p className="mt-1 text-sm text-gray-600">
              {rejectTarget.full_name} ({rejectTarget.email}) will be notified by email and the registration deleted.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional, included in the email)"
              rows={3}
              className="mt-4 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
              <Button onClick={confirmReject} className="bg-red-600 hover:bg-red-700">Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
