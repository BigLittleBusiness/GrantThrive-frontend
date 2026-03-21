/**
 * GrantThrive — API Base Client
 * ==============================
 * Provides the core HTTP transport layer (request, get, post, put, patch, delete)
 * and token management used by all role-scoped API modules.
 *
 * Do NOT add role-specific methods here. Import from the role-scoped modules:
 *   apiAuth.js       — shared auth (login, register, logout, verify-token, me)
 *   apiCommunity.js  — community_member and professional_consultant methods
 *   apiCouncil.js    — council_admin and council_staff methods
 *   apiAdmin.js      — system_admin methods + public council utilities
 *   apiLegacy.js     — deprecated methods kept for backward compatibility
 */
import { TOKEN_KEY } from '@grantthrive/auth'

// Base URL — Vite proxy handles routing in development; set VITE_API_URL for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

export class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem(TOKEN_KEY)
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    return headers
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = { headers: this.getHeaders(), ...options }
    try {
      const response = await fetch(url, config)
      if (response.status === 401) {
        this.setToken(null)
        const loginUrl = import.meta.env.VITE_LOGIN_URL || '/login'
        const redirect = encodeURIComponent(window.location.href)
        window.location.href = `${loginUrl}?redirect=${redirect}`
        throw new Error('Authentication required')
      }
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.')
      }
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error ${response.status}`)
      }
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  get(endpoint)         { return this.request(endpoint, { method: 'GET' }) }
  post(endpoint, data)  { return this.request(endpoint, { method: 'POST',  body: JSON.stringify(data) }) }
  put(endpoint, data)   { return this.request(endpoint, { method: 'PUT',   body: JSON.stringify(data) }) }
  patch(endpoint, data) { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }) }
  delete(endpoint)      { return this.request(endpoint, { method: 'DELETE' }) }
}
