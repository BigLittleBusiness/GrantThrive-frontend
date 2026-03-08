/**
 * AuthGateModal
 * =============
 * A reusable inline modal that gates an action behind authentication.
 *
 * Props:
 *   isOpen       — boolean — whether the modal is visible
 *   onClose      — () => void — called when the user dismisses the modal
 *   onSuccess    — (user) => void — called after a successful login or registration
 *   action       — string — short description of what the user is trying to do
 *                  e.g. "start an application" or "cast your vote"
 *   council      — object | null — the current council context (for registration)
 *   postVoteFlow — boolean — when true, after registration the user is immediately
 *                  returned to the vote flow rather than redirected to a dashboard
 */

import React, { useState } from 'react';
import { X, LogIn, UserPlus, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';

const API = '';

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error || `HTTP ${res.status}`);
  return json;
}

function LoginForm({ onSuccess, onSwitch }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await apiPost('/auth/login', { email: email.trim().toLowerCase(), password });
      if (data.token) {
        localStorage.setItem('grantthrive_token', data.token);
      }
      onSuccess(data.user || data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="••••••••" />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader size={14} className="animate-spin" /> : <LogIn size={14} />}
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-xs text-gray-500">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-green-700 hover:underline font-medium">
          Register now
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSuccess, onSwitch, council }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '', phone: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    setLoading(true); setError('');
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:      form.email.trim().toLowerCase(),
        password:   form.password,
        phone:      form.phone.trim() || undefined,
        role:       'community_member',
        council_id: council?.id || undefined,
      };
      const data = await apiPost('/auth/register', payload);
      if (data.token) {
        localStorage.setItem('grantthrive_token', data.token);
      }
      onSuccess(data.user || data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">First name *</label>
          <input type="text" required value={form.first_name} onChange={set('first_name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Jane" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Last name *</label>
          <input type="text" required value={form.last_name} onChange={set('last_name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Smith" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Email address *</label>
        <input type="email" required value={form.email} onChange={set('email')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
        <input type="tel" value={form.phone} onChange={set('phone')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="+61 4xx xxx xxx" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Min. 8 characters" />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Confirm password *</label>
        <input type="password" required value={form.confirm_password} onChange={set('confirm_password')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="Re-enter password" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
        {loading ? 'Creating account…' : 'Create account & continue'}
      </button>
      <p className="text-center text-xs text-gray-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-green-700 hover:underline font-medium">
          Sign in
        </button>
      </p>
    </form>
  );
}

export default function AuthGateModal({ isOpen, onClose, onSuccess, action = 'continue', council = null }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  if (!isOpen) return null;

  function handleSuccess(user) {
    onSuccess(user);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-green-700 px-6 py-5 relative">
          <button onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            {mode === 'login'
              ? <LogIn size={22} className="text-white" />
              : <UserPlus size={22} className="text-white" />}
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">
                {mode === 'login' ? 'Sign in to continue' : 'Create a free account'}
              </h2>
              <p className="text-green-100 text-xs mt-0.5">
                You need to be registered to {action}.
              </p>
            </div>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 mt-4 bg-green-800/40 rounded-lg p-1">
            <button onClick={() => setMode('login')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === 'login' ? 'bg-white text-green-800' : 'text-white/80 hover:text-white'
              }`}>
              Sign In
            </button>
            <button onClick={() => setMode('register')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === 'register' ? 'bg-white text-green-800' : 'text-white/80 hover:text-white'
              }`}>
              Register
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {mode === 'login'
            ? <LoginForm onSuccess={handleSuccess} onSwitch={() => setMode('register')} />
            : <RegisterForm onSuccess={handleSuccess} onSwitch={() => setMode('login')} council={council} />}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-gray-400">
            Your information is kept private and secure.{' '}
            {council?.name && <span>This account is for {council.name}.</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
