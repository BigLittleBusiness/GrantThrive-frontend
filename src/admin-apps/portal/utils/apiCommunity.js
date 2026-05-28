/**
 * GrantThrive — Community Member API Methods
 * ===========================================
 * Methods exclusively for COMMUNITY_MEMBER and PROFESSIONAL_CONSULTANT users.
 * All endpoints are under /api/community/*.
 *
 * Do NOT call these methods from council staff or admin components.
 *
 * Mixin: call mixInto(ApiClient.prototype) to attach these methods.
 * This file does NOT instantiate a client — import apiClient from api.js instead.
 */

/**
 * Attaches all community member API methods to the given prototype.
 * @param {object} proto - The ApiClient prototype to extend.
 */
export function mixInto(proto) {
  // ── Profile ─────────────────────────────────────────────────────────────────

  /** Fetch the community member's own profile. */
  proto.communityGetProfile = function () {
    return this.get('/api/community/profile')
  }

  /** Update the community member's own profile. */
  proto.communityUpdateProfile = function (data) {
    return this.put('/api/community/profile', data)
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  /** Fetch the community member's dashboard summary (stats, recent applications, etc.). */
  proto.communityGetDashboard = function () {
    return this.get('/api/community/dashboard')
  }

  // ── Grants ───────────────────────────────────────────────────────────────────

  /**
   * Fetch the list of grants available to community members.
   * @param {object} filters - Optional query filters (e.g. { status, category, search }).
   */
  proto.communityGetGrants = function (filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/community/grants${qs ? `?${qs}` : ''}`)
  }

  /** Fetch a single grant by ID. */
  proto.communityGetGrant = function (id) {
    return this.get(`/api/community/grants/${id}`)
  }

  // ── Applications ─────────────────────────────────────────────────────────────

  /**
   * Fetch the community member's own applications.
   * @param {object} filters - Optional query filters (e.g. { status }).
   */
  proto.communityGetApplications = function (filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/applications${qs ? `?${qs}` : ''}`)
  }

  /** Fetch a single application by ID. */
  proto.communityGetApplication = function (id) {
    return this.get(`/api/community/applications/${id}`)
  }

  /** Create a new application for a specific grant. */
  proto.communityCreateApplication = function (data) {
    return this.post('/api/community/applications', data)
  }

  /** Update (save/submit) an existing application. */
  proto.communityUpdateApplication = function (id, data) {
    return this.put(`/api/community/applications/${id}`, data)
  }

  // ── Application Documents (S3-backed) ─────────────────────────────────────

  /** List document metadata for an application. */
  proto.communityListApplicationDocuments = function (applicationId) {
    return this.get(`/api/applications/${applicationId}/documents`)
  }

  /**
   * Upload a supporting document for an application.
   * @param {string|number} applicationId
   * @param {File} file
   */
  proto.communityUploadApplicationDocument = function (applicationId, file) {
    const form = new FormData()
    form.append('file', file)
    return this.request(`/api/applications/${applicationId}/documents`, {
      method: 'POST',
      body: form,
    })
  }

  /** Get a pre-signed S3 download URL for a document. */
  proto.communityGetApplicationDocumentDownloadUrl = function (applicationId, documentId) {
    return this.get(`/api/applications/${applicationId}/documents/${documentId}`)
  }

  /** Delete an application document. */
  proto.communityDeleteApplicationDocument = function (applicationId, documentId) {
    return this.delete(`/api/applications/${applicationId}/documents/${documentId}`)
  }

  // ── Notifications ─────────────────────────────────────────────────────────────

  /** Fetch the community member's notifications. */
  proto.communityGetNotifications = function () {
    return this.get('/api/community/notifications')
  }

  /** Mark a single notification as read. */
  proto.communityMarkNotificationRead = function (id) {
    return this.patch(`/api/community/notifications/${id}`, {})
  }
}
