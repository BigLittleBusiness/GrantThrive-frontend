/**
 * GrantThrive — Admin & Public Council Utilities API Methods
 * ===========================================================
 * Two groups of methods:
 *
 * 1. SYSTEM_ADMIN methods (/api/admin/*)
 *    Exclusively for SYSTEM_ADMIN users. Do NOT call from council or community components.
 *
 * 2. Public council utilities (/api/councils/*)
 *    No authentication required. Safe to call from any component (e.g. registration form).
 *
 * Mixin: call mixInto(ApiClient.prototype) to attach these methods.
 * This file does NOT instantiate a client — import apiClient from api.js instead.
 */

/**
 * Attaches all admin and public council utility methods to the given prototype.
 * @param {object} proto - The ApiClient prototype to extend.
 */
export function mixInto(proto) {
  // ── System Admin — Stats ────────────────────────────────────────────────────

  /** Fetch platform-wide statistics for the system admin dashboard. */
  proto.getAdminStats = function () {
    return this.get('/api/admin/stats')
  }

  // ── System Admin — Pending user approval ────────────────────────────────────

  /**
   * Fetch all users pending system admin approval
   * (council_admin registrations awaiting activation).
   */
  proto.getPendingUsers = function () {
    return this.get('/api/admin/users/pending')
  }

  /**
   * Approve a pending council_admin registration.
   * Creates the Council record and activates the user account.
   * @param {string|number} id - User ID.
   */
  proto.approveUser = function (id) {
    return this.post(`/api/admin/users/${id}/approve`, {})
  }

  /**
   * Reject a pending council_admin registration.
   * @param {string|number} id - User ID.
   * @param {string} [reason=''] - Optional rejection reason shown to the applicant.
   */
  proto.rejectUser = function (id, reason = '') {
    return this.post(`/api/admin/users/${id}/reject`, { reason })
  }

  /**
   * Update the requested_subdomain on a pending council_admin registration.
   * Use this to resolve subdomain conflicts before approving.
   * @param {string|number} id - User ID.
   * @param {string} subdomain - New subdomain value.
   */
  proto.updatePendingUserSubdomain = function (id, subdomain) {
    return this.patch(`/api/admin/users/${id}/subdomain`, { subdomain })
  }

  // ── Public council utilities (no auth required) ──────────────────────────────

  /**
   * Check whether a subdomain is available for use.
   * No authentication required — safe to call from the registration form.
   * @param {string} subdomain - The subdomain to check.
   * @returns {{ available: boolean, subdomain: string, reason?: string }}
   */
  proto.checkSubdomain = async function (subdomain) {
    // Use raw fetch instead of this.get() because the backend returns structured
    // JSON on BOTH 200 (taken/available) and 400 (invalid/reserved) responses.
    // The base request() method throws on non-ok status, discarding the useful
    // reason field — so we read the body directly here.
    const url = `${this.baseURL}/api/councils/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    const data = await response.json()
    return data
  }
}
