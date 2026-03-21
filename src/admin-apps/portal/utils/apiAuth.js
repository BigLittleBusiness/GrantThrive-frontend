/**
 * GrantThrive — Shared Auth API Methods
 * =======================================
 * Methods used by ALL roles:
 *   login, register, demoLogin, logout, verifyToken,
 *   updateProfile, changePassword, healthCheck
 *
 * Mixin: call mixInto(ApiClient.prototype) to attach these methods.
 * This file does NOT instantiate a client — import apiClient from api.js instead.
 */

/**
 * Attaches all shared auth methods to the given prototype.
 * @param {object} proto - The ApiClient prototype to extend.
 */
export function mixInto(proto) {
  // ── Auth ────────────────────────────────────────────────────────────────────

  /**
   * Authenticate with email + password.
   * Stores the returned JWT automatically.
   */
  proto.login = async function (email, password) {
    const response = await this.post('/auth/login', { email, password })
    if (response.token) this.setToken(response.token)
    return response
  }

  /**
   * Register a new account.
   * user_type determines the registration path:
   *   'community_member' | 'professional_consultant' → immediate activation
   *   'council' | 'council_admin'                    → pending approval queue
   */
  proto.register = async function (userData) {
    const response = await this.post('/auth/register', userData)
    if (response.token) this.setToken(response.token)
    return response
  }

  /**
   * Register via the dedicated community endpoint.
   * Accepts user_type: 'community_member' | 'professional_consultant'.
   */
  proto.registerCommunity = async function (userData) {
    const response = await this.post('/auth/register/community', userData)
    if (response.token) this.setToken(response.token)
    return response
  }

  /**
   * Register via the dedicated council endpoint.
   * Accepts user_type: 'council' | 'council_admin'.
   */
  proto.registerCouncil = async function (userData) {
    const response = await this.post('/auth/register/council', userData)
    if (response.token) this.setToken(response.token)
    return response
  }

  /**
   * Demo login — non-production only.
   * demoType: 'council_admin' | 'council_staff' | 'community_member' |
   *           'professional_consultant' | 'system_admin'
   */
  proto.demoLogin = async function (demoType) {
    const response = await this.post('/auth/demo-login', { demo_type: demoType })
    if (response.token) this.setToken(response.token)
    return response
  }

  /** Log out the current user and clear the stored JWT. */
  proto.logout = async function () {
    try { await this.post('/auth/logout') } catch (e) { console.error('Logout error:', e) }
    finally { this.setToken(null) }
  }

  /**
   * Verify the stored JWT and return the current user object, or null if invalid.
   * Automatically clears the token if verification fails.
   */
  proto.verifyToken = async function () {
    if (!this.token) return null
    try {
      const response = await this.post('/auth/verify-token', { token: this.token })
      return response.user
    } catch {
      this.setToken(null)
      return null
    }
  }

  // ── Profile (all authenticated roles) ──────────────────────────────────────

  /** Update the current user's profile fields (first_name, last_name, phone, position, department). */
  proto.updateProfile = async function (data) {
    const response = await this.patch('/auth/me', data)
    return { success: true, data: response.user, message: response.message }
  }

  /** Change the current user's password. Requires current_password and new_password. */
  proto.changePassword = async function (data) {
    const response = await this.post('/auth/change-password', data)
    return { success: true, message: response.message }
  }

  // ── Health ──────────────────────────────────────────────────────────────────

  /** Platform health check — no auth required. */
  proto.healthCheck = function () {
    return this.get('/api/health')
  }
}
