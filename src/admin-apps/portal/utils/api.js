import { TOKEN_KEY } from '@grantthrive/auth'

// Base URL — Vite proxy handles routing in development; set VITE_API_URL for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

class ApiClient {
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

  get(endpoint)           { return this.request(endpoint, { method: 'GET' }) }
  post(endpoint, data)    { return this.request(endpoint, { method: 'POST',  body: JSON.stringify(data) }) }
  put(endpoint, data)     { return this.request(endpoint, { method: 'PUT',   body: JSON.stringify(data) }) }
  patch(endpoint, data)   { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }) }
  delete(endpoint)        { return this.request(endpoint, { method: 'DELETE' }) }


  // ─── Auth (shared) ──────────────────────────────────────────────────────────

  async login(email, password) {
    const response = await this.post('/api/auth/login', { email, password })
    if (response.token) this.setToken(response.token)
    return response
  }

  async register(userData) {
    const response = await this.post('/api/auth/register', userData)
    if (response.token) this.setToken(response.token)
    return response
  }

  async demoLogin(demoType) {
    const response = await this.post('/api/auth/demo-login', { demo_type: demoType })
    if (response.token) this.setToken(response.token)
    return response
  }

  async logout() {
    try { await this.post('/api/auth/logout') } catch (e) { console.error('Logout error:', e) }
    finally { this.setToken(null) }
  }

  async verifyToken() {
    if (!this.token) return null
    try {
      const response = await this.post('/api/auth/verify-token', { token: this.token })
      return response.user
    } catch {
      this.setToken(null)
      return null
    }
  }

  async updateProfile(data) {
    const response = await this.patch('/api/auth/me', data)
    return { success: true, data: response.user, message: response.message }
  }

  async changePassword(data) {
    const response = await this.post('/api/auth/change-password', data)
    return { success: true, message: response.message }
  }


  // ─── Community Member API (/api/community/*) ─────────────────────────────
  // These methods are exclusively for COMMUNITY_MEMBER users.
  // Do NOT call these from council staff or admin components.

  async communityGetProfile() {
    return this.get('/api/community/profile')
  }

  async communityUpdateProfile(data) {
    return this.put('/api/community/profile', data)
  }

  async communityGetDashboard() {
    return this.get('/api/community/dashboard')
  }

  async communityGetGrants(filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/community/grants${qs ? `?${qs}` : ''}`)
  }

  async communityGetGrant(id) {
    return this.get(`/api/community/grants/${id}`)
  }

  async communityGetApplications(filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/community/applications${qs ? `?${qs}` : ''}`)
  }

  async communityGetApplication(id) {
    return this.get(`/api/community/applications/${id}`)
  }

  async communityCreateApplication(data) {
    return this.post('/api/community/applications', data)
  }

  async communityUpdateApplication(id, data) {
    return this.put(`/api/community/applications/${id}`, data)
  }

  async communityGetNotifications() {
    return this.get('/api/community/notifications')
  }

  async communityMarkNotificationRead(id) {
    return this.patch(`/api/community/notifications/${id}`, {})
  }


  // ─── Council API (/api/council/*) ────────────────────────────────────────
  // These methods are exclusively for COUNCIL_STAFF and COUNCIL_ADMIN users.
  // Do NOT call these from community member components.

  async councilGetProfile() {
    return this.get('/api/council/profile')
  }

  async councilUpdateProfile(data) {
    return this.put('/api/council/profile', data)
  }

  async councilGetDashboard() {
    return this.get('/api/council/dashboard')
  }

  async councilGetGrants(filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/council/grants${qs ? `?${qs}` : ''}`)
  }

  async councilGetGrant(id) {
    return this.get(`/api/council/grants/${id}`)
  }

  async councilCreateGrant(data) {
    return this.post('/api/council/grants', data)
  }

  async councilUpdateGrant(id, data) {
    return this.put(`/api/council/grants/${id}`, data)
  }

  async councilDeleteGrant(id) {
    return this.delete(`/api/council/grants/${id}`)
  }

  async councilGetApplications(filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/council/applications${qs ? `?${qs}` : ''}`)
  }

  async councilGetApplication(id) {
    return this.get(`/api/council/applications/${id}`)
  }

  async councilUpdateApplicationStatus(id, status, notes = '') {
    return this.put(`/api/council/applications/${id}/status`, { status, notes })
  }

  async councilGetStaff() {
    return this.get('/api/council/staff')
  }

  async councilGetStats() {
    return this.get('/api/council/stats')
  }

  async councilGetNotifications() {
    return this.get('/api/council/notifications')
  }


  // ─── Public council utilities ─────────────────────────────────────────────

  /**
   * Check whether a subdomain is available (public endpoint, no auth required).
   * Returns { available: boolean, subdomain: string, reason?: string }
   */
  async checkSubdomain(subdomain) {
    return this.get(`/api/councils/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`)
  }


  // ─── Admin API (/api/admin/*) ─────────────────────────────────────────────
  // These methods are exclusively for SYSTEM_ADMIN users.

  async getAdminStats() {
    return this.get('/api/admin/stats')
  }

  async getPendingUsers() {
    return this.get('/api/admin/users/pending')
  }

  async approveUser(id) {
    return this.post(`/api/admin/users/${id}/approve`, {})
  }

  async rejectUser(id, reason = '') {
    return this.post(`/api/admin/users/${id}/reject`, { reason })
  }

  async updatePendingUserSubdomain(id, subdomain) {
    return this.patch(`/api/admin/users/${id}/subdomain`, { subdomain })
  }


  // ─── Legacy / shared methods (kept for backward compatibility) ────────────

  /** @deprecated Use communityGetGrants() or councilGetGrants() instead */
  async getGrants(filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/grants${qs ? `?${qs}` : ''}`)
  }

  /** @deprecated Use communityGetGrant() or councilGetGrant() instead */
  async getGrant(id) {
    return this.get(`/api/grants/${id}`)
  }

  /** @deprecated Use communityGetApplications() or councilGetApplications() instead */
  async getApplications(filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/applications${qs ? `?${qs}` : ''}`)
  }

  /** @deprecated Use communityGetApplication() or councilGetApplication() instead */
  async getApplication(id) {
    return this.get(`/api/applications/${id}`)
  }

  /** @deprecated Use communityCreateApplication() instead */
  async createApplication(data) {
    return this.post('/api/applications', data)
  }

  /** @deprecated Use councilGetDashboard() or communityGetDashboard() instead */
  async getDashboardMetrics() {
    const [appStats, grantStats] = await Promise.all([
      this.get('/api/applications/stats'),
      this.get('/api/grants/stats')
    ])
    return { appStats, grantStats }
  }

  async getGrantStats() {
    return this.get('/api/grants/stats')
  }

  async getApplicationStats() {
    return this.get('/api/applications/stats')
  }

  async healthCheck() {
    return this.get('/api/health')
  }

  /** @deprecated Use communityGetNotifications() or councilGetNotifications() instead */
  async getNotifications(params = {}) {
    const qs = new URLSearchParams(params).toString()
    return this.get(`/api/notifications${qs ? `?${qs}` : ''}`)
  }

  async getUnreadCount() {
    return this.get('/api/notifications/unread-count')
  }

  async markNotificationRead(id) {
    return this.patch(`/api/notifications/${id}/read`, {})
  }

  async markAllNotificationsRead() {
    return this.post('/api/notifications/mark-all-read', {})
  }
}

const apiClient = new ApiClient()
export default apiClient

// Named exports — shared/auth
export const {
  login, register, demoLogin, logout, verifyToken,
  updateProfile, changePassword, healthCheck
} = apiClient

// Named exports — community member
export const {
  communityGetProfile, communityUpdateProfile, communityGetDashboard,
  communityGetGrants, communityGetGrant,
  communityGetApplications, communityGetApplication,
  communityCreateApplication, communityUpdateApplication,
  communityGetNotifications, communityMarkNotificationRead
} = apiClient

// Named exports — council
export const {
  councilGetProfile, councilUpdateProfile, councilGetDashboard,
  councilGetGrants, councilGetGrant,
  councilCreateGrant, councilUpdateGrant, councilDeleteGrant,
  councilGetApplications, councilGetApplication, councilUpdateApplicationStatus,
  councilGetStaff, councilGetStats, councilGetNotifications
} = apiClient

// Named exports — public council utilities
export const { checkSubdomain } = apiClient

// Named exports — admin
export const { getAdminStats, getPendingUsers, approveUser, rejectUser, updatePendingUserSubdomain } = apiClient

// Legacy named exports (kept for backward compatibility)
export const {
  getGrants, getGrant, getApplications, getApplication, createApplication,
  getDashboardMetrics, getGrantStats, getApplicationStats,
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead
} = apiClient
