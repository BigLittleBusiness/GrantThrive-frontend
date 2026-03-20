import { TOKEN_KEY } from '@grantthrive/auth'

// Base URL empty because Vite proxy handles routing in development
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiClient {
  constructor() {
    this.baseURL = 'http://127.0.0.1:5000'
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
    const headers = {
      'Content-Type': 'application/json'
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`

    const config = {
      headers: this.getHeaders(),
      ...options
    }

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
        throw new Error(data.message || `HTTP error ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async login(email, password) {
    const response = await this.post('/auth/login', { email, password })

    if (response.token) {
      this.setToken(response.token)
    }

    return response
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData)

    if (response.token) {
      this.setToken(response.token)
    }

    return response
  }

  async demoLogin(demoType) {
    const response = await this.post('/auth/demo-login', {
      demo_type: demoType
    })

    if (response.token) {
      this.setToken(response.token)
    }

    return response
  }

  async logout() {
    try {
      await this.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.setToken(null)
    }
  }

  async verifyToken() {
    if (!this.token) return null

    try {
      const response = await this.post('/api/auth/verify-token', {
        token: this.token
      })

      return response.user
    } catch (error) {
      this.setToken(null)
      return null
    }
  }

  async updateProfile(data) {
    const response = await this.patch('/auth/me', data)
    return { success: true, data: response.user, message: response.message }
  }

  async changePassword(data) {
    const response = await this.post('/auth/change-password', data)
    return { success: true, message: response.message }
  }

  async getGrants(filters = {}) {
    const query = new URLSearchParams(filters).toString()
    return this.get(`/api/grants${query ? `?${query}` : ''}`)
  }

  async getGrant(id) {
    return this.get(`/grant/${id}`)
  }

  async getApplications(filters = {}) {
    const query = new URLSearchParams(filters).toString()
    return this.get(`/api/applications${query ? `?${query}` : ''}`)
  }

  async getApplication(id) {
    return this.get(`/api/applications/${id}`)
  }

  async createApplication(data) {
    return this.post('/api/applications', data)
  }

  async getDashboardMetrics() {
    // Aggregate stats from the available stat endpoints
    const [appStats, grantStats] = await Promise.all([
      this.get('/api/applications/stats'),
      this.get('/api/grants/stats'),
    ]);
    return { appStats, grantStats };
  }

  async getAdminStats() {
    return this.get('/api/admin/stats');
  }

  async getGrantStats() {
    return this.get('/api/grants/stats');
  }

  async getApplicationStats() {
    return this.get('/api/applications/stats');
  }

  async healthCheck() {
    return this.get('/api/health')
  }

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

export const {
  login,
  register,
  demoLogin,
  logout,
  verifyToken,
  updateProfile,
  changePassword,
  getGrants,
  getGrant,
  getApplications,
  getApplication,
  createApplication,
  getDashboardMetrics,
  healthCheck,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} = apiClient