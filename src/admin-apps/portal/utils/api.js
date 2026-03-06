// API utility for GrantThrive frontend-backend integration
// Uses Vite proxy during development

import { TOKEN_KEY } from '@grantthrive/auth'

// Base URL empty because Vite proxy handles routing
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  process.env?.REACT_APP_API_URL ||
  ''

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem(TOKEN_KEY)
  }

  // Set authentication token
  setToken(token) {
    this.token = token

    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  // Authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  // Generic request
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

        const loginUrl =
          (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOGIN_URL)
            ? import.meta.env.VITE_LOGIN_URL
            : '/login'

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

  // Basic methods
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

  // -----------------------
  // Authentication
  // -----------------------

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
      const response = await this.post('/auth/verify-token', {
        token: this.token
      })

      return response.user
    } catch (error) {
      this.setToken(null)
      return null
    }
  }

  // -----------------------
  // Grants
  // -----------------------

  async getGrants(filters = {}) {
    const query = new URLSearchParams(filters).toString()

    return this.get(`/public/api/grants${query ? `?${query}` : ''}`)
  }

  async getGrant(id) {
    return this.get(`/grant/${id}`)
  }

  // -----------------------
  // Applications
  // -----------------------

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

  // -----------------------
  // Analytics
  // -----------------------

  async getDashboardMetrics() {
    return this.get('/reports/api/dashboard-data')
  }

  // -----------------------
  // Health check
  // -----------------------

  async healthCheck() {
    return this.get('/api/health')
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
  getGrants,
  getGrant,
  getApplications,
  getApplication,
  createApplication,
  getDashboardMetrics,
  healthCheck
} = apiClient