/**
 * useTenantApi — Tenant-scoped API client hook
 * =============================================
 * Returns a fetch wrapper that automatically:
 *   1. Includes the JWT Authorization header
 *   2. Sends the X-GT-Subdomain header so the backend can resolve the tenant
 *      even when the request comes from localhost (dev) or a non-subdomain URL
 *   3. Handles 401 responses by dispatching a gt:logout event
 *
 * Usage:
 *   const api = useTenantApi();
 *   const grants = await api.get('/api/grants');
 *   const result = await api.post('/api/grants', { title: '...' });
 *
 * All methods return the parsed JSON body on success, or throw an Error
 * with the server's error message on failure.
 */

import { useCallback } from 'react';
import { useTenant } from './TenantContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.grantthrive.com';
const TOKEN_KEY = 'gt_auth_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function useTenantApi() {
  const { subdomain } = useTenant();

  const request = useCallback(async (method, path, body = undefined, extraHeaders = {}) => {
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(subdomain ? { 'X-GT-Subdomain': subdomain } : {}),
      ...extraHeaders,
    };

    const options = {
      method,
      headers,
      credentials: 'include',
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${path}`, options);

    if (res.status === 401) {
      // Token expired or invalid — trigger global logout
      window.dispatchEvent(new CustomEvent('gt:logout'));
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

    return data;
  }, [subdomain]);

  return {
    get:    (path, headers)       => request('GET',    path, undefined, headers),
    post:   (path, body, headers) => request('POST',   path, body, headers),
    patch:  (path, body, headers) => request('PATCH',  path, body, headers),
    put:    (path, body, headers) => request('PUT',    path, body, headers),
    delete: (path, headers)       => request('DELETE', path, undefined, headers),
  };
}

export default useTenantApi;
