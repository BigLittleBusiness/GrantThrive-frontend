import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import api from '@shared/api/client';

export default function AdminMfaSettings() {
  const [state, setState] = useState({ loading: true, enabled: false, enrollment: null, code: '', error: '', message: '' });

  const load = async () => {
    try {
      const data = await api.get('/admin/mfa/status');
      setState((current) => ({ ...current, loading: false, enabled: Boolean(data.mfa_enabled) }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message || 'Unable to load multi-factor authentication status.' }));
    }
  };

  useEffect(() => { void load(); }, []);

  const beginSetup = async () => {
    setState((current) => ({ ...current, error: '', message: '' }));
    try {
      const data = await api.post('/admin/mfa/setup', {});
      setState((current) => ({ ...current, enrollment: data, code: '' }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || 'Unable to start MFA setup.' }));
    }
  };

  const confirm = async () => {
    try {
      await api.post('/admin/mfa/confirm', { code: state.code.trim() });
      setState((current) => ({ ...current, enabled: true, enrollment: null, code: '', message: 'Authenticator MFA is now enabled.', error: '' }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || 'That verification code was not accepted.' }));
    }
  };

  const disable = async () => {
    try {
      await api.post('/admin/mfa/disable', { code: state.code.trim() });
      setState((current) => ({ ...current, enabled: false, enrollment: null, code: '', message: 'Authenticator MFA has been disabled.', error: '' }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || 'A current authenticator code is required to disable MFA.' }));
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="rounded-lg bg-emerald-50 p-2.5"><ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" /></div>
          <div><h3 className="font-semibold text-gray-900">Administrator multi-factor authentication</h3><p className="mt-1 text-sm leading-6 text-gray-600">Add a time-based code from an authenticator app to protect this privileged account.</p></div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${state.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{state.enabled ? 'Enabled' : 'Not enabled'}</span>
      </div>
      {state.loading ? <p className="mt-4 text-sm text-gray-500">Loading security status…</p> : null}
      {state.message ? <p className="mt-4 text-sm text-emerald-700" role="status">{state.message}</p> : null}
      {state.error ? <p className="mt-4 text-sm text-red-700" role="alert">{state.error}</p> : null}
      {!state.enabled && !state.enrollment && !state.loading ? <button type="button" onClick={beginSetup} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"><KeyRound className="h-4 w-4" />Set up authenticator MFA</button> : null}
      {state.enrollment ? <div className="mt-4 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4"><p className="text-sm text-blue-950">Add this setup key to an authenticator app. Treat it like a password and do not share it.</p><code className="block break-all rounded bg-white p-2 text-xs text-slate-800">{state.enrollment.secret}</code><label className="block text-sm font-medium text-blue-950" htmlFor="mfa-confirm-code">Enter the six-digit code</label><input id="mfa-confirm-code" inputMode="numeric" autoComplete="one-time-code" maxLength="8" value={state.code} onChange={(event) => setState((current) => ({ ...current, code: event.target.value.replace(/\s/g, '') }))} className="w-full rounded border border-blue-300 bg-white px-3 py-2" /><button type="button" onClick={confirm} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Confirm and enable MFA</button></div> : null}
      {state.enabled ? <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm font-medium text-gray-700" htmlFor="mfa-disable-code">Current authenticator code<input id="mfa-disable-code" inputMode="numeric" autoComplete="one-time-code" maxLength="8" value={state.code} onChange={(event) => setState((current) => ({ ...current, code: event.target.value.replace(/\s/g, '') }))} className="mt-1 block rounded border border-gray-300 px-3 py-2" /></label><button type="button" onClick={disable} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50">Disable MFA</button></div> : null}
    </section>
  );
}
