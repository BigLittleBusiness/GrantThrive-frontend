/**
 * TwilioConfig — System Admin: Centralised Twilio SMS Configuration
 * ==================================================================
 * Allows GrantThrive system admins to enter and manage the Twilio
 * credentials used to deliver SMS notifications to all council clients.
 *
 * Features:
 *  - View current configuration status (configured / not configured)
 *  - Enter / update Account SID, Auth Token, Messaging Service SID,
 *    fallback From number, and global enable/disable toggle
 *  - Send a test SMS to verify credentials before going live
 *  - Clear all credentials
 *  - Inline guidance on where to find each value in the Twilio console
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Save, Trash2, Send, CheckCircle, XCircle,
  AlertCircle, Eye, EyeOff, RefreshCw, ExternalLink, Info,
  Shield, Zap, Phone, Settings,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';

const getToken = () =>
  localStorage.getItem('admin_token') || localStorage.getItem('token') || '';

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
};

// ── Field definitions ─────────────────────────────────────────────────────────
const FIELDS = [
  {
    key: 'twilio_account_sid',
    label: 'Account SID',
    placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sensitive: false,
    hint: 'Found on your Twilio Console dashboard. Starts with "AC".',
    helpUrl: 'https://console.twilio.com/',
  },
  {
    key: 'twilio_auth_token',
    label: 'Auth Token',
    placeholder: '••••••••••••••••••••••••••••••••',
    sensitive: true,
    hint: 'Found on your Twilio Console dashboard. Stored encrypted at rest.',
    helpUrl: 'https://console.twilio.com/',
  },
  {
    key: 'twilio_messaging_service_sid',
    label: 'Messaging Service SID',
    placeholder: 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sensitive: false,
    hint: 'Recommended. Create a Messaging Service in Twilio for better deliverability and number management. Starts with "MG".',
    helpUrl: 'https://console.twilio.com/us1/develop/sms/services',
  },
  {
    key: 'twilio_from_number',
    label: 'From Number (fallback)',
    placeholder: '+61400000000',
    sensitive: false,
    hint: 'Used if no Messaging Service SID is set. Must be a Twilio-provisioned number in E.164 format.',
    helpUrl: 'https://console.twilio.com/us1/develop/phone-numbers/manage/incoming',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ isConfigured, isEnabled }) => {
  if (!isConfigured) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
        <XCircle className="w-4 h-4" /> Not configured
      </span>
    );
  }
  if (!isEnabled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
        <AlertCircle className="w-4 h-4" /> Configured but disabled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-4 h-4" /> Active
    </span>
  );
};

const FieldInput = ({ field, value, onChange }) => {
  const [show, setShow] = useState(false);
  const isMasked = field.sensitive && value && value.includes('•');

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      <div className="relative">
        <input
          type={field.sensitive && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={isMasked ? '(unchanged — enter new value to update)' : field.placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 font-mono"
        />
        {field.sensitive && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 flex items-start gap-1">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        {field.hint}{' '}
        <a
          href={field.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
        >
          Open in Twilio <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const TwilioConfig = () => {
  const [config, setConfig]       = useState({});
  const [formValues, setFormValues] = useState({});
  const [enabled, setEnabled]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [clearing, setClearing]   = useState(false);
  const [testing, setTesting]     = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [message, setMessage]     = useState(null); // { type: 'success'|'error', text }
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/system/twilio-config');
      setConfig(data.config);
      setEnabled(data.config.is_enabled || false);
      // Pre-fill form with current (masked) values so user sees what's set
      const vals = {};
      FIELDS.forEach(f => { vals[f.key] = data.config[f.key] || ''; });
      setFormValues(vals);
    } catch (err) {
      showMsg('error', `Failed to load configuration: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleFieldChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send fields that have been changed (not still showing masked placeholder)
      const payload = { twilio_enabled: enabled ? 'true' : 'false' };
      FIELDS.forEach(f => {
        const val = formValues[f.key] || '';
        // Skip if it's still the masked value from the server (no change)
        if (val && val.includes('•')) return;
        payload[f.key] = val;
      });
      await apiFetch('/system/twilio-config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showMsg('success', 'Twilio configuration saved successfully.');
      await loadConfig();
    } catch (err) {
      showMsg('error', `Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      showMsg('error', 'Please enter a phone number to send the test SMS to.');
      return;
    }
    setTesting(true);
    try {
      const data = await apiFetch('/system/twilio-config/test', {
        method: 'POST',
        body: JSON.stringify({ to: testPhone }),
      });
      showMsg('success', data.message);
    } catch (err) {
      showMsg('error', `Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await apiFetch('/system/twilio-config', { method: 'DELETE' });
      showMsg('success', 'All Twilio credentials have been cleared.');
      setShowClearConfirm(false);
      await loadConfig();
    } catch (err) {
      showMsg('error', `Clear failed: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-3" />
        <span className="text-gray-600">Loading Twilio configuration…</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Twilio SMS Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure the centralised Twilio account used to deliver SMS notifications
            to all council clients on qualifying plans.
          </p>
        </div>
        <StatusBadge isConfigured={config.is_configured} isEnabled={config.is_enabled} />
      </div>

      {/* Alert banner */}
      {message && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Info panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-medium">How this works</p>
          <p>
            GrantThrive uses a single Twilio account to send SMS on behalf of all councils.
            Councils on an SMS-enabled plan can toggle notifications on or off from their
            Communications Settings page — they never see or manage these credentials.
          </p>
          <p>
            A <strong>Messaging Service SID</strong> is strongly recommended over a bare phone
            number as it enables number pooling, geo-matching, and better deliverability.
          </p>
        </div>
      </div>

      {/* Credentials form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Credentials</h3>
        </div>
        <div className="p-6 space-y-5">
          {FIELDS.map(field => (
            <FieldInput
              key={field.key}
              field={field}
              value={formValues[field.key] || ''}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </div>

      {/* Global enable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className={`w-5 h-5 ${enabled ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900">Global SMS Enable</p>
              <p className="text-sm text-gray-500">
                Master switch — disabling this stops all outbound SMS platform-wide,
                regardless of individual council settings.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(e => !e)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Configuration'}
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={clearing || !config.is_configured}
          className="flex items-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Credentials
        </button>
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-red-800">
            Are you sure? This will remove all stored Twilio credentials and disable SMS
            for every council immediately. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing…' : 'Yes, clear all credentials'}
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Test SMS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Phone className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Send Test SMS</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Verify your credentials by sending a test message to any phone number.
            The credentials must be saved before testing.
          </p>
          <div className="flex gap-3">
            <input
              type="tel"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="+61412345678"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              onClick={handleTest}
              disabled={testing || !config.is_configured}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {testing ? 'Sending…' : 'Send Test'}
            </button>
          </div>
          {!config.is_configured && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Save your credentials first before sending a test message.
            </p>
          )}
        </div>
      </div>

      {/* Quick-reference guide */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          Quick Setup Guide
        </h3>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            Log in to the{' '}
            <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:underline">Twilio Console</a>{' '}
            and copy your <strong>Account SID</strong> and <strong>Auth Token</strong> from the dashboard.
          </li>
          <li>
            Go to <strong>Messaging → Services</strong> and create a new Messaging Service.
            Add one or more Australian/NZ numbers to the service. Copy the <strong>Messaging Service SID</strong>.
          </li>
          <li>
            Paste the values above and click <strong>Save Configuration</strong>.
          </li>
          <li>
            Enable the <strong>Global SMS Enable</strong> toggle.
          </li>
          <li>
            Send a test SMS to confirm everything is working before councils start using it.
          </li>
        </ol>
      </div>

    </div>
  );
};

export default TwilioConfig;
