import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Mail, MessageSquare, CheckCircle, AlertCircle,
  Info, Loader2, Save, Send, BarChart2,
  Lock, ArrowUpRight, RefreshCw, Zap
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const EVENT_TYPES = [
  { key: 'application_received', label: 'Application Received',  desc: 'When a new grant application is submitted' },
  { key: 'application_approved', label: 'Application Approved',  desc: 'When an application is approved by a reviewer' },
  { key: 'application_rejected', label: 'Application Rejected',  desc: 'When an application is declined' },
  { key: 'deadline_reminder',    label: 'Deadline Reminder',     desc: '48 hours before a grant closes' },
  { key: 'document_required',    label: 'Document Required',     desc: 'When additional documents are requested' },
  { key: 'payment_processed',    label: 'Payment Processed',     desc: 'When a grant payment is made' },
  { key: 'voting_reminder',      label: 'Voting Reminder',       desc: 'When community voting is closing soon' },
];

const TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Adelaide',
  'Australia/Perth',
  'Australia/Darwin',
  'Australia/Hobart',
  'Pacific/Auckland',
  'Pacific/Auckland',
  'Europe/London',
  'Europe/Dublin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ── SMS Tier Selector (inline upgrade flow) ──────────────────────────────────

const PLAN_RANK = { trial: 0, small: 1, medium: 2, large: 3 };
const PLAN_LABELS = { trial: 'Free Trial', small: 'Small Council', medium: 'Medium Council', large: 'Large Council' };

function fmt(cents) {
  if (cents == null) return '—';
  return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0 })} AUD`;
}

function SmsTierSelector({ councilId, plan, onActivated, onNavigate }) {
  const [tiers, setTiers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activating, setActivating] = useState(null);
  const [msg, setMsg]               = useState('');
  const [msgType, setMsgType]       = useState('success');
  const [confirm, setConfirm]       = useState(null);

  useEffect(() => {
    if (!councilId) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    fetch(`${API_BASE}/api/councils/${councilId}/sms-tiers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setTiers(d.tiers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [councilId]);

  async function activate(tierKey) {
    setActivating(tierKey);
    setMsg('');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    try {
      const res = await fetch(`${API_BASE}/api/councils/${councilId}/sms-tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier: tierKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');
      setMsg(data.message || 'SMS add-on activated.');
      setMsgType('success');
      onActivated && onActivated();
    } catch (e) {
      setMsg(e.message);
      setMsgType('error');
    } finally {
      setActivating(null);
      setConfirm(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>;
  }

  const isTrial = plan === 'trial';

  return (
    <div className="space-y-5">
      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              Activate {tiers.find(t => t.key === confirm)?.name}?
            </h3>
            <p className="mb-2 text-sm text-gray-600">
              You are about to add the <strong>{tiers.find(t => t.key === confirm)?.name}</strong> to your account:
            </p>
            <ul className="mb-5 space-y-1 text-sm text-gray-700">
              <li>• {(tiers.find(t => t.key === confirm)?.included_messages || 0).toLocaleString('en-AU')} messages/month included</li>
              <li>• {fmt(tiers.find(t => t.key === confirm)?.price_aud_cents)} per month (ex-GST)</li>
              <li>• ${((tiers.find(t => t.key === confirm)?.overage_cents || 0) / 100).toFixed(2)} AUD per extra message</li>
            </ul>
            <p className="mb-5 text-xs text-gray-400">Added to your next billing cycle. Cancel any time from Account &amp; Billing.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Go Back
              </button>
              <button
                onClick={() => activate(confirm)}
                disabled={!!activating}
                className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
              >
                {activating ? 'Activating…' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`rounded-lg border p-3 text-sm ${
          msgType === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {msg}
        </div>
      )}

      {isTrial ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
          <div className="flex items-start gap-3">
            <Lock className="text-amber-500 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-amber-900">SMS is not available on the Free Trial</p>
              <p className="text-sm text-amber-700 mt-1">Upgrade to a Small, Medium, or Large Council plan to access SMS notifications.</p>
              <button
                onClick={() => onNavigate && onNavigate('account-billing')}
                className="mt-3 flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Upgrade Plan <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-2">
            <Zap size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">
              Select an SMS tier below to activate SMS notifications for your council. All messages are delivered via
              GrantThrive's centralised Twilio account — no credentials required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tiers.map(tier => {
              const eligible = PLAN_RANK[plan] >= PLAN_RANK[tier.min_plan];
              return (
                <div
                  key={tier.key}
                  className={`rounded-xl border-2 p-4 ${
                    eligible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                    {!eligible && (
                      <span className="text-xs rounded-full bg-gray-200 text-gray-500 px-2 py-0.5">
                        Requires {PLAN_LABELS[tier.min_plan] || tier.min_plan}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    {fmt(tier.price_aud_cents)}
                    <span className="text-xs font-normal text-gray-500"> /month</span>
                  </p>
                  <ul className="text-xs text-gray-500 space-y-0.5 mb-3">
                    <li>✓ {tier.included_messages.toLocaleString('en-AU')} messages included</li>
                    <li>✓ ${(tier.overage_cents / 100).toFixed(2)} AUD per extra message</li>
                  </ul>
                  <button
                    disabled={!eligible || !!activating}
                    onClick={() => eligible && setConfirm(tier.key)}
                    className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                      eligible
                        ? 'bg-green-700 text-white hover:bg-green-800 disabled:opacity-50'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {activating === tier.key ? 'Activating…' : eligible ? 'Activate' : 'Not Available'}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400">
            All prices in AUD, ex-GST. You can also manage your SMS add-on from{' '}
            <button onClick={() => onNavigate && onNavigate('account-billing')} className="underline hover:no-underline">
              Account &amp; Billing
            </button>.
          </p>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const CommunicationSettings = ({ user, onNavigate, onLogout }) => {
  const councilId = user?.council_id;
  const [activeTab, setActiveTab] = useState('sms');

  // SMS state
  const [smsData, setSmsData]   = useState(null);
  const [smsLoading, setSmsLoading] = useState(true);
  const [smsSaving, setSmsSaving]   = useState(false);
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsUsage, setSmsUsage]     = useState(null);
  const [toast, setToast]           = useState(null);

  // Local editable copies
  const [eventPrefs, setEventPrefs]           = useState({});
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [timezone, setTimezone]               = useState('Australia/Sydney');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSmsSettings = useCallback(async () => {
    if (!councilId) return;
    setSmsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/councils/${councilId}/sms-settings`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSmsData(data);
      setEventPrefs(data.sms_event_prefs || {});
      setBusinessHoursOnly(data.sms_business_hours_only ?? true);
      setTimezone(data.sms_timezone || 'Australia/Sydney');
    } catch (err) {
      showToast('Failed to load SMS settings. Please try again.', 'error');
    } finally {
      setSmsLoading(false);
    }
  }, [councilId]);

  const fetchSmsUsage = useCallback(async () => {
    if (!councilId) return;
    try {
      const res = await fetch(`${API_BASE}/api/councils/${councilId}/sms-usage`, {
        headers: authHeaders(),
      });
      if (res.ok) setSmsUsage(await res.json());
    } catch (_) {}
  }, [councilId]);

  useEffect(() => {
    fetchSmsSettings();
    fetchSmsUsage();
  }, [fetchSmsSettings, fetchSmsUsage]);

  const handleSavePrefs = async () => {
    if (!councilId) return;
    setSmsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/councils/${councilId}/sms-settings`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          sms_event_prefs:         eventPrefs,
          sms_business_hours_only: businessHoursOnly,
          sms_timezone:            timezone,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      showToast('SMS preferences saved successfully.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSmsSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!councilId) return;
    setSmsTesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/councils/${councilId}/sms-settings/test`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test failed');
      showToast('Test SMS sent to your registered phone number.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSmsTesting(false);
    }
  };

  const toggleEventPref = (key) => {
    setEventPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (smsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  const canUseSms  = smsData?.can_use_sms ?? false;
  const smsEnabled = smsData?.sms_enabled ?? false;
  const plan       = smsData?.plan ?? 'small';
  const smsAddonAvailable = smsData?.sms_addon_available ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Bell className="text-green-700" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Communication Settings</h1>
              <p className="text-sm text-gray-500">Manage how GrantThrive notifies your applicants</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { id: 'sms',   label: 'SMS Notifications', icon: MessageSquare },
            { id: 'email', label: 'Email Notifications', icon: Mail },
            { id: 'usage', label: 'Usage', icon: BarChart2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── SMS Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'sms' && (
          <div className="space-y-6">

            {/* Status banner */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border
              ${canUseSms && smsEnabled
                ? 'bg-green-50 border-green-200'
                : canUseSms && !smsEnabled
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'}`}>
              <div className={`w-3 h-3 rounded-full shrink-0
                ${canUseSms && smsEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {canUseSms && smsEnabled
                    ? 'SMS notifications are active'
                    : canUseSms && !smsEnabled
                    ? 'SMS is available but not yet enabled — contact GrantThrive to activate'
                    : 'SMS notifications are not available on your current plan'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  SMS is delivered via GrantThrive's centralised Twilio account. No credentials required from you.
                </p>
              </div>
              {canUseSms && (
                <button
                  onClick={handleTestSms}
                  disabled={smsTesting || !smsEnabled}
                  className="flex items-center gap-1.5 text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {smsTesting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Send Test
                </button>
              )}
            </div>

            {/* Inline tier selector shown when SMS is not yet active */}
            {!canUseSms && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Activate SMS Notifications</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Choose a plan to enable SMS alerts for your applicants</p>
                </div>
                <div className="px-5 py-5">
                  <SmsTierSelector
                    councilId={councilId}
                    plan={plan}
                    onActivated={fetchSmsSettings}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>
            )}

            {/* Settings — only shown when SMS is available */}
            {canUseSms && (
              <>
                {/* Event preferences */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">SMS Event Notifications</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Choose which events trigger an SMS to applicants</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {EVENT_TYPES.map(evt => (
                      <div key={evt.key} className="flex items-center justify-between px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{evt.label}</p>
                          <p className="text-xs text-gray-500">{evt.desc}</p>
                        </div>
                        <button
                          onClick={() => toggleEventPref(evt.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                            ${eventPrefs[evt.key] !== false ? 'bg-green-600' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                            ${eventPrefs[evt.key] !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery settings */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Delivery Settings</h2>
                  </div>
                  <div className="px-5 py-4 space-y-5">
                    {/* Business hours toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Business hours only</p>
                        <p className="text-xs text-gray-500">Only send SMS between 8:00 AM – 6:00 PM in the selected timezone</p>
                      </div>
                      <button
                        onClick={() => setBusinessHoursOnly(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${businessHoursOnly ? 'bg-green-600' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                          ${businessHoursOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                      <select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSavePrefs}
                    disabled={smsSaving}
                    className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60 transition-colors"
                  >
                    {smsSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {smsSaving ? 'Saving…' : 'Save SMS Settings'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Email Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="text-green-600 mt-0.5 shrink-0" size={20} />
              <div>
                <h2 className="font-semibold text-gray-900">Email Notifications</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Email notifications are always enabled and sent from <strong>noreply@grantthrive.com</strong> on your council's behalf.
                  All transactional emails — application confirmations, status updates, deadline reminders — are sent automatically.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2">
              <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700">
                Email notification templates can be customised by GrantThrive support. Contact <a href="mailto:support@grantthrive.com" className="underline">support@grantthrive.com</a> to request changes to your council's email branding.
              </p>
            </div>
          </div>
        )}

        {/* ── Usage Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">SMS Usage (Last 30 Days)</h2>
                <button
                  onClick={fetchSmsUsage}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {!canUseSms ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">SMS is not enabled on your plan.</p>
                </div>
              ) : smsUsage ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-green-700">{smsUsage.total_last_30_days}</p>
                      <p className="text-xs text-green-600 mt-1">Messages sent (30 days)</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-gray-700">
                        {smsUsage.daily.length > 0
                          ? Math.round(smsUsage.total_last_30_days / smsUsage.daily.length)
                          : 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Avg per active day</p>
                    </div>
                  </div>

                  {smsUsage.daily.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium text-right">Messages Sent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {smsUsage.daily.slice(0, 10).map(row => (
                            <tr key={row.date}>
                              <td className="py-2 text-gray-700">{row.date}</td>
                              <td className="py-2 text-right font-medium text-gray-900">{row.messages_sent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No SMS messages sent in the last 30 days.</p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationSettings;
