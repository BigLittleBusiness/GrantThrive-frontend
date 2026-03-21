/**
 * GrantThrive — API Client (Main Entry Point)
 * =============================================
 * This file is the single import point for all API calls across the portal.
 * It composes the ApiClient base class with role-scoped method mixins and
 * exports a singleton instance plus named exports for every method.
 *
 * Role-scoped modules (import directly for tree-shaking in new code):
 *   apiBase.js       — ApiClient base class (HTTP transport + token management)
 *   apiAuth.js       — shared auth (login, register, logout, verify-token, me)
 *   apiCommunity.js  — community_member and professional_consultant methods
 *   apiCouncil.js    — council_admin and council_staff methods
 *   apiAdmin.js      — system_admin methods + public council utilities
 *   apiLegacy.js     — deprecated methods kept for backward compatibility
 *
 * All existing imports of the form:
 *   import apiClient from './utils/api'
 *   import { communityGetApplications } from './utils/api'
 * continue to work without modification.
 */
import { ApiClient }  from './apiBase.js'
import * as Auth      from './apiAuth.js'
import * as Community from './apiCommunity.js'
import * as Council   from './apiCouncil.js'
import * as Admin     from './apiAdmin.js'
import * as Legacy    from './apiLegacy.js'

// Apply all role-scoped method mixins to the shared prototype once
Auth.mixInto(ApiClient.prototype)
Community.mixInto(ApiClient.prototype)
Council.mixInto(ApiClient.prototype)
Admin.mixInto(ApiClient.prototype)
Legacy.mixInto(ApiClient.prototype)

// Singleton instance — the default export used by all existing consumers
const apiClient = new ApiClient()
export default apiClient

// ── Named exports — shared auth ───────────────────────────────────────────────
export const {
  login, register, registerCommunity, registerCouncil,
  demoLogin, logout, verifyToken,
  updateProfile, changePassword, healthCheck,
} = apiClient

// ── Named exports — community member ─────────────────────────────────────────
export const {
  communityGetProfile, communityUpdateProfile, communityGetDashboard,
  communityGetGrants, communityGetGrant,
  communityGetApplications, communityGetApplication,
  communityCreateApplication, communityUpdateApplication,
  communityGetNotifications, communityMarkNotificationRead,
} = apiClient

// ── Named exports — council ───────────────────────────────────────────────────
export const {
  councilGetProfile, councilUpdateProfile, councilGetDashboard,
  councilGetGrants, councilGetGrant,
  councilCreateGrant, councilUpdateGrant, councilDeleteGrant,
  councilGetApplications, councilGetApplication, councilUpdateApplicationStatus,
  councilGetStaff, councilGetStats, councilGetNotifications,
} = apiClient

// ── Named exports — admin & public utilities ──────────────────────────────────
export const {
  getAdminStats, getPendingUsers, approveUser, rejectUser,
  updatePendingUserSubdomain, checkSubdomain,
} = apiClient

// ── Named exports — legacy (deprecated) ──────────────────────────────────────
export const {
  getGrants, getGrant, getApplications, getApplication, createApplication,
  getDashboardMetrics, getGrantStats, getApplicationStats,
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
} = apiClient
