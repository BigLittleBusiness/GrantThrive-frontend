import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Mail, MessageSquare, CheckCircle, AlertCircle,
  Info, Loader2, Save, Send, BarChart2, Settings,
  Lock, ArrowUpRight, RefreshCw
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

// ── Plan-gated upgrade prompt ─────────────────────────────────────────────────

function SmsUpgradePrompt({ plan, smsAddonAvailable, onNavigate }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Lock className="text-amber-500 mt-0.5 shrink-0" size={22} />
        <div>
          <h3 className="font-semibold text-amber-900 text-base">SMS Notifications Not Available</h3>
          <p className="text-amber-700 text-sm mt-1">
            {plan === 'trial'
              ? 'SMS notifications are not available during the free trial. Upgrade to a paid plan to unlock this feature.'
              : smsAddonAvailable
              ? 'SMS notifications are available as an add-on for your Small Council plan. Contact GrantThrive to enable it.'
              : 'SMS notifications are included in the Medium and Large Council plans.'}
          </p>
        </div>
      </div>
      <div className="bg-white border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">What you get with SMS notifications:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Instant alerts for application status changes</li>
          <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Deadline reminders sent directly to applicants</li>
          <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Payment confirmation messages</li>
          <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Community voting reminders</li>
          <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Managed by GrantThrive — no Twilio account needed</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onNavigate && onNavigate('account-billing')}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          View Plans <ArrowUpRight size={14} />
        </button>
        <a
          href="mailto:support@grantthrive.com?subject=SMS Add-on Enquiry"
          className="flex items-center gap-2 border border-amber-300 text-amber-700 hover:bg-amber-100 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Contact GrantThrive
        </a>
      </div>
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

            {/* Upgrade prompt if not available */}
            {!canUseSms && (
              <SmsUpgradePrompt
                plan={plan}
                smsAddonAvailable={smsAddonAvailable}
                onNavigate={onNavigate}
              />
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
