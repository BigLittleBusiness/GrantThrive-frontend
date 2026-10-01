/**
 * GrantThrive — auth storage
 * ==========================
 * The JWT and user profile live in localStorage so every app in this frontend
 * (portal, admin, public pages) shares one session.
 */

const TOKEN_KEY = 'gt_auth_token'
const USER_KEY = 'gt_auth_user'

export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  COUNCIL_ADMIN: 'council_admin',
  COUNCIL_STAFF: 'council_staff',
  COMMUNITY_MEMBER: 'community_member',
  PROFESSIONAL_CONSULTANT: 'professional_consultant',
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Persist the token and/or user; omitted values are left unchanged. */
export function setAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
