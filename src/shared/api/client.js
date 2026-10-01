/**
 * GrantThrive — API client
 * ========================
 * The single HTTP client for every app in this frontend.
 *
 * VITE_API_URL is the full API base including the /api path, e.g.
 *   http://localhost:5000/api       (local backend)
 *   /api                            (backend served on the same domain)
 * Endpoints are passed relative to it: api.get('/councils').
 */
import { getToken, clearAuth } from '@shared/auth'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export class ApiClient {
  /**
   * Low-level request. `options` are fetch options; `body` is sent as-is
   * (use the get/post/put/patch/delete helpers for JSON bodies).
   * Resolves with the parsed JSON body (or null), rejects with ApiError.
   */
  async request(endpoint, options = {}) {
    const token = getToken()
    const isFormData = options.body instanceof FormData
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    let response
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })
    } catch {
      throw new ApiError('Network error — unable to reach the server.', 0, null)
    }

    const isJson = (response.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await response.json().catch(() => null) : null

    if (response.status === 401 && token) {
      // Session expired or revoked — PortalApp and AdminAuthGate listen for this.
      clearAuth()
      window.dispatchEvent(new CustomEvent('gt:logout'))
    }

    if (!response.ok) {
      const message = response.status === 429
        ? 'Too many requests. Please try again later.'
        : data?.error || data?.message || `Request failed (${response.status})`
      throw new ApiError(message, response.status, data)
    }

    return data
  }

  get(endpoint, options)          { return this.request(endpoint, { ...options, method: 'GET' }) }
  delete(endpoint, options)       { return this.request(endpoint, { ...options, method: 'DELETE' }) }
  post(endpoint, body, options)   { return this.request(endpoint, { ...options, method: 'POST',  body: toJson(body) }) }
  put(endpoint, body, options)    { return this.request(endpoint, { ...options, method: 'PUT',   body: toJson(body) }) }
  patch(endpoint, body, options)  { return this.request(endpoint, { ...options, method: 'PATCH', body: toJson(body) }) }
}

function toJson(body) {
  return body === undefined ? undefined : JSON.stringify(body)
}

const api = new ApiClient()
export default api
