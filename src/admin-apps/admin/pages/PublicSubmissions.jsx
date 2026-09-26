import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';
const STATUS_LABELS = { new: 'New', in_progress: 'In progress', resolved: 'Resolved' };
const TYPE_LABELS = { contact: 'Contact enquiry', waitlist: 'Waitlist signup' };
const CONTACT_LABELS = { demo: 'Demo', pricing: 'Pricing', support: 'Support', general: 'General' };

function authHeaders() {
  const token = localStorage.getItem('gt_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function statusStyle(status) {
  return {
    new: 'border-blue-200 bg-blue-50 text-blue-700',
    in_progress: 'border-amber-200 bg-amber-50 text-amber-700',
    resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[status] || 'border-slate-200 bg-slate-50 text-slate-700';
}

function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>{STATUS_LABELS[status] || status}</span>;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}

function DetailPanel({ submission, onClose, onSaved }) {
  const [status, setStatus] = useState(submission.status);
  const [note, setNote] = useState(submission.internal_note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(submission.status);
    setNote(submission.internal_note || '');
    setError('');
  }, [submission]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch(`/api/admin/form-submissions/${submission.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, internal_note: note }),
      });
      onSaved(result.submission);
    } catch (err) {
      setError(err.message || 'Could not save the submission.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    ['Name', submission.name],
    ['Email', submission.email],
    ['Organisation', submission.organisation],
    ['Phone', submission.phone],
    ['Received', formatDate(submission.received_at)],
    ['Notification', submission.notification_status === 'sent' ? 'Sent' : submission.notification_status],
  ];

  return (
    <aside className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" aria-label="Form submission details">
      <section className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge status={submission.status} />
              <span className="text-sm text-slate-500">#{submission.id}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{TYPE_LABELS[submission.submission_type]}</h2>
            <p className="mt-1 text-sm text-slate-500">{submission.contact_type ? `${CONTACT_LABELS[submission.contact_type] || submission.contact_type} enquiry` : 'Launch interest'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close submission details"><X className="h-5 w-5" /></Button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Protected information:</strong> this form data is encrypted at rest and visible only to GrantThrive system administrators. Do not copy it into unprotected channels.</p></div>
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{value || 'Not supplied'}</dd></div>
            ))}
          </dl>
          {submission.message && (
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p><div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">{submission.message}</div></div>
          )}
          <div className="border-t pt-6">
            <h3 className="text-base font-bold text-slate-900">Internal handling</h3>
            <p className="mt-1 text-sm text-slate-500">Keep operational notes concise and relevant to responding to this enquiry.</p>
            {error && <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="submission-status">Status</label><Select value={status} onValueChange={setStatus}><SelectTrigger id="submission-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select></div>
              <div className="flex items-end"><Button className="w-full bg-blue-700 text-white hover:bg-blue-800" onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? 'Saving…' : 'Save changes'}</Button></div>
            </div>
            <div className="mt-4"><label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="submission-note">Internal note</label><Textarea id="submission-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} rows={5} placeholder="Add a private follow-up note…" /><p className="mt-1 text-right text-xs text-slate-400">{note.length}/5000</p></div>
          </div>
        </div>
      </section>
    </aside>
  );
}

export default function PublicSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (status !== 'all') params.set('status', status);
      if (type !== 'all') params.set('type', type);
      const result = await apiFetch(`/api/admin/form-submissions?${params}`);
      setSubmissions(result.submissions || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Could not load form submissions.');
    } finally {
      setLoading(false);
    }
  }, [status, type]);

  useEffect(() => { load(1); }, [load]);

  const openSubmission = async (id) => {
    try {
      const result = await apiFetch(`/api/admin/form-submissions/${id}`);
      setSelected(result.submission);
    } catch (err) {
      setError(err.message || 'Could not load the submission.');
    }
  };

  const handleSaved = (updated) => {
    setSelected(updated);
    setSubmissions((rows) => rows.map((row) => row.id === updated.id ? { ...row, ...updated } : row));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><div className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-blue-700" /><h1 className="text-2xl font-bold text-slate-900">Form submissions</h1></div><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Verified contact and waitlist records. The database is the source of truth; notification emails contain no submitter information.</p></div>
        <Button variant="outline" onClick={() => load(pagination.page)} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>
      <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-sm font-medium text-slate-700"><span>Filter</span></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-48"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select><Select value={type} onValueChange={setType}><SelectTrigger className="sm:w-48"><SelectValue placeholder="All form types" /></SelectTrigger><SelectContent><SelectItem value="all">All form types</SelectItem><SelectItem value="contact">Contact enquiries</SelectItem><SelectItem value="waitlist">Waitlist signups</SelectItem></SelectContent></Select><span className="text-sm text-slate-500 sm:ml-auto">{pagination.total} record{pagination.total === 1 ? '' : 's'}</span></CardContent></Card>
      {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
      <Card><CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="h-5 w-5 text-blue-700" />Incoming records</CardTitle></CardHeader><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading protected records…</div> : submissions.length === 0 ? <div className="py-16 text-center"><Mail className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No form submissions found</p><p className="mt-1 text-sm text-slate-500">Adjust the filters or check back after a new verified submission.</p></div> : <><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Received</th><th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Submitter</th><th className="px-5 py-3 font-semibold">Organisation</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Open</th></tr></thead><tbody className="divide-y divide-slate-100">{submissions.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(row.received_at)}</td><td className="px-5 py-4"><p className="font-medium text-slate-900">{TYPE_LABELS[row.submission_type]}</p>{row.contact_type && <p className="mt-0.5 text-xs text-slate-500">{CONTACT_LABELS[row.contact_type] || row.contact_type}</p>}</td><td className="px-5 py-4"><p className="font-medium text-slate-900">{row.name}</p><p className="mt-0.5 text-xs text-slate-500">{row.email}</p></td><td className="px-5 py-4 text-slate-600">{row.organisation || '—'}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4 text-right"><Button variant="outline" size="sm" onClick={() => openSubmission(row.id)}><Eye className="mr-1.5 h-4 w-4" />View</Button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t px-5 py-4"><p className="text-sm text-slate-500">Page {pagination.page} of {Math.max(1, pagination.pages)}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={pagination.page <= 1 || loading} onClick={() => load(pagination.page - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages || loading} onClick={() => load(pagination.page + 1)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div></>}</CardContent></Card>
      {selected && <DetailPanel submission={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}
    </div>
  );
}
