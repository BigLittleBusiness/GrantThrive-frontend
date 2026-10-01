/**
 * GrantThrive — session API
 * =========================
 * Login / logout / token verification shared by the portal and admin apps.
 * Token and user are persisted through @shared/auth.
 */
import { getToken, setAuth, clearAuth } from '@shared/auth'
import api from './client'

/** Authenticate and store the session. Resolves with the user; rejects with ApiError. */
export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password })
  setAuth(data.token, data.user)
  return data.user
}

/** Store a session returned by registration / demo login, when it includes a token. */
export function storeSession(data) {
  if (data?.token) setAuth(data.token, data.user)
  return data
}

/**
 * Verify the stored token. Resolves with the current user (refreshing the stored
 * token when the backend issues a new one), or null when there is no valid session.
 */
export async function verifyToken() {
  const token = getToken()
  if (!token) return null
  try {
    const data = await api.post('/auth/verify-token', { token })
    if (!data?.user) throw new Error('No user in verify-token response')
    setAuth(data.new_token || token, data.user)
    return data.user
  } catch {
    clearAuth()
    return null
  }
}

/** End the session on the server (best effort) and clear it locally. */
export async function logout(endpoint = '/auth/logout') {
  try {
    await api.post(endpoint, undefined, { keepalive: true })
  } catch {
    // Removing local credentials is the safe outcome even if the call fails.
  } finally {
    clearAuth()
  }
}
