/**
 * GrantThrive — Legacy API Methods (Deprecated)
 * ===============================================
 * These methods are kept for backward compatibility only.
 * They are deprecated and should NOT be used in new code.
 *
 * Migration guide:
 *   getGrants()            → communityGetGrants() or councilGetGrants()
 *   getGrant(id)           → communityGetGrant(id) or councilGetGrant(id)
 *   getApplications()      → communityGetApplications() or councilGetApplications()
 *   getApplication(id)     → communityGetApplication(id) or councilGetApplication(id)
 *   createApplication()    → communityCreateApplication()
 *   getDashboardMetrics()  → councilGetDashboard() or communityGetDashboard()
 *   getNotifications()     → communityGetNotifications() or councilGetNotifications()
 *
 * Mixin: call mixInto(ApiClient.prototype) to attach these methods.
 * This file does NOT instantiate a client — import apiClient from api.js instead.
 */

/**
 * Attaches all legacy deprecated methods to the given prototype.
 * @param {object} proto - The ApiClient prototype to extend.
 */
export function mixInto(proto) {
  /** @deprecated Use communityGetGrants() or councilGetGrants() */
  proto.getGrants = function (filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/grants${qs ? `?${qs}` : ''}`)
  }

  /** @deprecated Use communityGetGrant() or councilGetGrant() */
  proto.getGrant = function (id) {
    return this.get(`/api/grants/${id}`)
  }

  /** @deprecated Use communityGetApplications() or councilGetApplications() */
  proto.getApplications = function (filters = {}) {
    const qs = new URLSearchParams(filters).toString()
    return this.get(`/api/applications${qs ? `?${qs}` : ''}`)
  }

  /** @deprecated Use communityGetApplication() or councilGetApplication() */
  proto.getApplication = function (id) {
    return this.get(`/api/applications/${id}`)
  }

  /** @deprecated Use communityCreateApplication() */
  proto.createApplication = function (data) {
    return this.post('/api/applications', data)
  }

  /** @deprecated Use councilGetDashboard() or communityGetDashboard() */
  proto.getDashboardMetrics = async function () {
    const [appStats, grantStats] = await Promise.all([
      this.get('/api/applications/stats'),
      this.get('/api/grants/stats'),
    ])
    return { appStats, grantStats }
  }

  /** @deprecated Use councilGetStats() */
  proto.getGrantStats = function () {
    return this.get('/api/grants/stats')
  }

  /** @deprecated Use councilGetStats() */
  proto.getApplicationStats = function () {
    return this.get('/api/applications/stats')
  }

  /** @deprecated Use communityGetNotifications() or councilGetNotifications() */
  proto.getNotifications = function (params = {}) {
    const qs = new URLSearchParams(params).toString()
    return this.get(`/api/notifications${qs ? `?${qs}` : ''}`)
  }

  proto.getUnreadCount = function () {
    return this.get('/api/notifications/unread-count')
  }

  proto.markNotificationRead = function (id) {
    return this.patch(`/api/notifications/${id}/read`, {})
  }

  proto.markAllNotificationsRead = function () {
    return this.post('/api/notifications/mark-all-read', {})
  }
}
