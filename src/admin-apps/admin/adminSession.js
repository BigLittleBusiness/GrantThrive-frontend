import api from '@shared/api/client';
import { clearAuth, setAuth } from '@shared/auth';

export async function adminLogin(email, password, mfaCode = '') {
  const data = await api.post('/admin/login', { email, password, mfa_code: mfaCode }, { suppressLogoutEvent: true });
  setAuth(data.token, data.user);
  return data.user;
}

export async function verifyAdminSession() {
  const data = await api.get('/admin/me', { suppressLogoutEvent: true });
  if (data?.user?.role !== 'system_admin') throw new Error('Administrator access required.');
  setAuth(null, data.user);
  return data.user;
}

export async function refreshAdminSession() {
  const data = await api.post('/admin/refresh-token', {}, { suppressLogoutEvent: true });
  if (data?.token) setAuth(data.token, null);
  return data;
}

export async function endAdminSession() {
  try { await api.post('/admin/logout', {}, { suppressLogoutEvent: true }); } finally { clearAuth(); }
}
