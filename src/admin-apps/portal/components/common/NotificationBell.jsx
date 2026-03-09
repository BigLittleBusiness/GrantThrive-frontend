/**
 * NotificationBell
 * ─────────────────
 * A self-contained notification bell that:
 *  - Polls GET /api/notifications/unread-count every 60 s
 *  - Fetches the full notification list when the dropdown is opened
 *  - Marks individual notifications read on click and navigates to the linked page
 *  - Provides a "Mark all read" shortcut
 *
 * Usage:
 *   <NotificationBell onNavigate={onNavigate} />
 *
 * Props:
 *   onNavigate  (fn)  — called with a route key string when a notification is clicked
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bell,
  CheckCheck,
  FileText,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  Vote,
  AlertCircle,
  Info,
  User,
  Settings,
} from 'lucide-react'
import apiClient from '../../utils/api'

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICONS = {
  registration_confirmation: <UserPlus className="h-4 w-4 text-blue-500" />,
  staff_added:               <UserPlus className="h-4 w-4 text-indigo-500" />,
  application_submitted:     <FileText className="h-4 w-4 text-amber-500" />,
  reviewer_assigned:         <User className="h-4 w-4 text-purple-500" />,
  application_approved:      <ThumbsUp className="h-4 w-4 text-green-600" />,
  application_rejected:      <ThumbsDown className="h-4 w-4 text-red-500" />,
  application_under_review:  <FileText className="h-4 w-4 text-blue-500" />,
  reviewer_reminder:         <AlertCircle className="h-4 w-4 text-orange-500" />,
  voting_opened:             <Vote className="h-4 w-4 text-teal-500" />,
  voting_closes_soon:        <Vote className="h-4 w-4 text-orange-500" />,
  results_published:         <ThumbsUp className="h-4 w-4 text-green-600" />,
  monthly_digest:            <Info className="h-4 w-4 text-blue-500" />,
  subscription_renewal:      <AlertCircle className="h-4 w-4 text-red-500" />,
  password_reset:            <Settings className="h-4 w-4 text-gray-500" />,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const POLL_MS = 60_000

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(false)
  const dropdownRef                       = useRef(null)
  const pollRef                           = useRef(null)

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Poll unread count ───────────────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const data = await apiClient.getUnreadCount()
      setUnreadCount(data.unread_count ?? 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchCount()
    pollRef.current = setInterval(fetchCount, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [fetchCount])

  // ── Fetch list when opened ──────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.getNotifications({ limit: 20 })
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unread_count ?? 0)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchList()
  }, [open, fetchList])

  // ── Actions ─────────────────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await apiClient.markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id)
    if (n.link && onNavigate) {
      onNavigate(n.link)
      setOpen(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[520px] flex flex-col rounded-xl border border-gray-200 bg-white shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-700 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </div>
            )}

            {!loading && notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                  !n.is_read ? 'bg-blue-50/60' : ''
                }`}
              >
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                  {ICONS[n.type] ?? <Info className="h-4 w-4 text-gray-400" />}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug text-gray-900 ${!n.is_read ? 'font-semibold' : ''}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                onClick={() => { onNavigate && onNavigate('notifications'); setOpen(false) }}
                className="text-xs text-green-700 hover:underline w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
