import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@shared/components/ui/dropdown-menu'
import { Badge } from '@shared/components/ui/badge'
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Sun,
  Moon,
  CheckCheck,
  FileText,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  Vote,
  AlertCircle,
  Info
} from 'lucide-react'
import { useTheme } from 'next-themes'
import grantThrivelogo from '../../assets/grantthrive_official_logo.png'
import apiClient from '../../utils/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOTIFICATION_ICONS = {
  registration_confirmation: <UserPlus className="h-4 w-4 text-blue-500" />,
  staff_added:               <UserPlus className="h-4 w-4 text-indigo-500" />,
  application_submitted:     <FileText className="h-4 w-4 text-amber-500" />,
  reviewer_assigned:         <User className="h-4 w-4 text-purple-500" />,
  application_approved:      <ThumbsUp className="h-4 w-4 text-green-500" />,
  application_rejected:      <ThumbsDown className="h-4 w-4 text-red-500" />,
  application_under_review:  <FileText className="h-4 w-4 text-blue-500" />,
  reviewer_reminder:         <AlertCircle className="h-4 w-4 text-orange-500" />,
  voting_opened:             <Vote className="h-4 w-4 text-teal-500" />,
  voting_closes_soon:        <Vote className="h-4 w-4 text-orange-500" />,
  results_published:         <ThumbsUp className="h-4 w-4 text-green-500" />,
  monthly_digest:            <Info className="h-4 w-4 text-blue-500" />,
  subscription_renewal:      <AlertCircle className="h-4 w-4 text-red-500" />,
  password_reset:            <Settings className="h-4 w-4 text-gray-500" />,
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── NotificationBell component ───────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000 // re-check every 60 seconds

const NotificationBell = ({ onNavigate }) => {
  const [notifications, setNotifications]   = useState([])
  const [unreadCount, setUnreadCount]       = useState(0)
  const [open, setOpen]                     = useState(false)
  const [loading, setLoading]               = useState(false)
  const pollRef = useRef(null)

  // Fetch the unread count (lightweight — runs on every poll tick)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiClient.getUnreadCount()
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      // Silently ignore — network may be unavailable
    }
  }, [])

  // Fetch full notification list (only when the dropdown opens)
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.getNotifications({ limit: 20 })
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      // Silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  // Start polling for unread count
  useEffect(() => {
    fetchUnreadCount()
    pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(pollRef.current)
  }, [fetchUnreadCount])

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  const handleMarkRead = async (id) => {
    try {
      await apiClient.markNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) handleMarkRead(notification.id)
    if (notification.link && onNavigate) {
      onNavigate(notification.link)
      setOpen(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] text-xs px-1 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-[520px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          )}

          {!loading && notifications.map(notification => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0 ${
                !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {NOTIFICATION_ICONS[notification.type] ?? (
                  <Info className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!notification.is_read ? 'font-semibold' : 'font-normal'}`}>
                  {notification.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {timeAgo(notification.created_at)}
                </p>
              </div>

              {/* Unread dot */}
              {!notification.is_read && (
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-3 py-2">
            <button
              onClick={() => { onNavigate && onNavigate('notifications'); setOpen(false) }}
              className="text-xs text-primary hover:underline w-full text-center"
            >
              View all notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = ({ onNavigate }) => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
      {/* Left Section - Logo and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <img
            src={grantThrivelogo}
            alt="GrantThrive"
            className="h-8 w-auto"
          />
          <span className="text-xl font-bold text-foreground hidden sm:block">
            GrantThrive
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search grants, applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Right Section - Actions and User Menu */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Live Notification Bell */}
        <NotificationBell onNavigate={onNavigate} />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
                <Badge variant="secondary" className="w-fit text-xs">
                  {user?.role || 'Council Staff'}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate && onNavigate('profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate && onNavigate('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

export default Navbar
