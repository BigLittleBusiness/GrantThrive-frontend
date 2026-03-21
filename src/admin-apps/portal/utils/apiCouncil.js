/**
 * GrantThrive — Council API Methods
 * ===================================
 * Methods exclusively for COUNCIL_ADMIN and COUNCIL_STAFF users.
 * All endpoints are under /api/council/*.
 *
 * Do NOT call these methods from community member or system_admin components.
 *
 * Mixin: call mixInto(ApiClient.prototype) to attach these methods.
 * This file does NOT instantiate a client — import apiClient from api.js instead.
 */

/**
 * Attaches all council API methods to the given prototype.
 * @param {object} proto - The ApiClient prototype to extend.
 */
export function mixInto(proto) {
  // ── Profile ─────────────────────────────────────────────────────────────────

  /** Fetch the council user's own profile. */
  proto.councilGetProfile = function () {
    return this.get('/api/council/profile')
  }

  /** Update the council user's own profile. */
  proto.councilUpdateProfile = function (data) {
    return this.put('/api/council/profile', data)
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  /** Fetch the council dashboard summary (grant stats, application pipeline, etc.). */
  proto.councilGetDashboard = function () {
    return this.get('/api/council/dashboard')
  }

  // ── Grants ───────────────────────────────────────────────────────────────────

  /**
   * Fetch the council's own grants.
   * @param {object} filters - Optional query filters (e.g. { status, search }).
   */
  proto.councilGetGrants = function (filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/council/grants${qs ? `?${qs}` : ''}`)
  }

  /** Fetch a single grant by ID. */
  proto.councilGetGrant = function (id) {
    return this.get(`/api/council/grants/${id}`)
  }

  /** Create a new grant. */
  proto.councilCreateGrant = function (data) {
    return this.post('/api/council/grants', data)
  }

  /** Update an existing grant. */
  proto.councilUpdateGrant = function (id, data) {
    return this.put(`/api/council/grants/${id}`, data)
  }

  /** Delete a grant. */
  proto.councilDeleteGrant = function (id) {
    return this.delete(`/api/council/grants/${id}`)
  }

  // ── Applications ─────────────────────────────────────────────────────────────

  /**
   * Fetch all applications received by the council.
   * @param {object} filters - Optional query filters (e.g. { status, grant_id }).
   */
  proto.councilGetApplications = function (filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/council/applications${qs ? `?${qs}` : ''}`)
  }

  /** Fetch a single application by ID. */
  proto.councilGetApplication = function (id) {
    return this.get(`/api/council/applications/${id}`)
  }

  /**
   * Update the status of an application (approve, reject, request-info, etc.).
   * @param {string} id - Application ID.
   * @param {string} status - New status value.
   * @param {string} [notes=''] - Optional reviewer notes.
   */
  proto.councilUpdateApplicationStatus = function (id, status, notes = '') {
    return this.put(`/api/council/applications/${id}/status`, { status, notes })
  }

  // ── Staff ─────────────────────────────────────────────────────────────────────

  /** Fetch the council's staff members. */
  proto.councilGetStaff = function () {
    return this.get('/api/council/staff')
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  /** Fetch council-level statistics. */
  proto.councilGetStats = function () {
    return this.get('/api/council/stats')
  }

  // ── Notifications ─────────────────────────────────────────────────────────────

  /** Fetch the council user's notifications. */
  proto.councilGetNotifications = function () {
    return this.get('/api/council/notifications')
  }
}
