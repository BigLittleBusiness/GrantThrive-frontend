/**
 * GrantThrive — Portal API
 * ========================
 * Endpoint functions used by the portal, built on the shared API client.
 * Paths are relative to VITE_API_URL (which already includes /api).
 *
 *   import apiClient, { getGrants } from '../utils/api'
 *   apiClient.get('/auth/me')   // ad-hoc request
 *   getGrants({ status: 'open' })
 */
import api, { ApiError } from '@shared/api/client'
import { storeSession } from '@shared/api/session'

export default api

const withQuery = (path, params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `${path}?${new URLSearchParams(entries)}` : path
}

// ── Auth & profile ──────────────────────────────────────────────────────────

/** Register an account; stores the session when the backend returns a token. */
export const register = async (userData) => storeSession(await api.post('/auth/register', userData))

/** Demo login (non-production only). */
export const demoLogin = async (demoType) => storeSession(await api.post('/auth/demo-login', { demo_type: demoType }))

export const getProfile = () => api.get('/auth/me')

/** Update the current user's profile. Resolves with { success, data: user, message }. */
export async function updateProfile(data) {
  const response = await api.patch('/auth/me', data)
  return { success: true, data: response.user, message: response.message }
}

/** Change the current user's password. Resolves with { success, message }. */
export async function changePassword(data) {
  const response = await api.post('/auth/change-password', data)
  return { success: true, message: response.message }
}
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword })

export const validateAbn = (abn) => api.get(withQuery('/abn/validate', { abn }))

// ── Grants ──────────────────────────────────────────────────────────────────

/** List grants visible to the current user. Resolves with { grants, total, ... }. */
export const getGrants = (filters) => api.get(withQuery('/grants', filters))
export const getGrant = (id) => api.get(`/grants/${id}`)
export const createGrant = (data) => api.post('/grants', data)
export const updateGrant = (id, data) => api.patch(`/grants/${id}`, data)
/** Publish a grant (makes it visible to applicants and opens a draft). */
export const publishGrant = (id) => api.post(`/grants/${id}/publish`, { publish: true })

/** Advisory AI suggestions for a grant draft. */
export const getGrantSuggestions = (data) => api.post('/ai/grant-suggestions', data)

/** QR code for a grant: { qr_code_data_url, target_url, filename }. */
export const getGrantQR = (grantId) => api.get(`/grants/${grantId}/qr`)
export const regenerateGrantQR = (grantId) => api.post(`/grants/${grantId}/qr`, {})

// ── Applications ────────────────────────────────────────────────────────────

/**
 * List applications scoped to the current user's role.
 * filters: { status: 'a,b', grant_id, assigned_to_me: true }
 */
export const getApplications = (filters) => api.get(withQuery('/applications', filters))
export const createApplication = (data) => api.post('/applications', data)
export const updateApplication = (id, data) => api.patch(`/applications/${id}`, data)
export const submitApplication = (id) => api.post(`/applications/${id}/submit`)

// ── Councils ────────────────────────────────────────────────────────────────

export const getCouncilUsers = (councilId) => api.get(`/councils/${councilId}/users`)

/**
 * Check subdomain availability. The backend answers 400 with a structured body
 * for invalid/reserved subdomains, so that body is returned rather than thrown.
 */
export async function checkSubdomain(subdomain) {
  try {
    return await api.get(withQuery('/councils/check-subdomain', { subdomain }))
  } catch (error) {
    if (error instanceof ApiError && error.data) return error.data
    throw error
  }
}

// ── Community voting (public; votes are attributed when logged in) ─────────

export const getVotingSessions = (status = 'open') => api.get(withQuery('/voting/sessions', { status }))
export const getVotingSession = (id) => api.get(`/voting/sessions/${id}`)
export const castVote = (sessionId, applicationId, voteValue) =>
  api.post(`/voting/sessions/${sessionId}/vote`, { application_id: applicationId, vote_value: voteValue })

// ── Public data ─────────────────────────────────────────────────────────────

export const getPublicResults = () => api.get('/public/results')
export const getTransparencyData = () => api.get('/public/transparency')

// ── Notifications ───────────────────────────────────────────────────────────

export const getNotifications = (params) => api.get(withQuery('/notifications/', params))
export const getUnreadCount = () => api.get('/notifications/unread-count')
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.post('/notifications/read-all')
