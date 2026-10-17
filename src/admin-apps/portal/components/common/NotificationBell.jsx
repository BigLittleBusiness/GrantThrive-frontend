/**
 * NotificationBell
 *
 * Fetches the member's recent notifications and provides supported read-state actions.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, CheckCheck, FileText, UserPlus, ThumbsUp, ThumbsDown, Vote, AlertCircle,
  Info, User, Settings, Loader2,
} from 'lucide-react';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../utils/api';

const ICONS = {
  registration_confirmation: <UserPlus className="h-4 w-4 text-blue-500" />,
  staff_added: <UserPlus className="h-4 w-4 text-indigo-500" />,
  application_submitted: <FileText className="h-4 w-4 text-amber-500" />,
  reviewer_assigned: <User className="h-4 w-4 text-purple-500" />,
  application_approved: <ThumbsUp className="h-4 w-4 text-green-600" />,
  application_rejected: <ThumbsDown className="h-4 w-4 text-red-500" />,
  application_under_review: <FileText className="h-4 w-4 text-blue-500" />,
  reviewer_reminder: <AlertCircle className="h-4 w-4 text-orange-500" />,
  voting_opened: <Vote className="h-4 w-4 text-teal-500" />,
  voting_closes_soon: <Vote className="h-4 w-4 text-orange-500" />,
  results_published: <ThumbsUp className="h-4 w-4 text-green-600" />,
  monthly_digest: <Info className="h-4 w-4 text-blue-500" />,
  subscription_renewal: <AlertCircle className="h-4 w-4 text-red-500" />,
  password_reset: <Settings className="h-4 w-4 text-gray-500" />,
};

function timeAgo(dateString) {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function normalizePortalLink(link) {
  if (typeof link !== 'string') return null;
  const cleaned = link.trim().replace(/^\/+/, '');
  if (!cleaned) return null;
  if (cleaned === 'portal/community/voting') return 'community/community-voting';
  if (cleaned.startsWith('portal/')) return cleaned.slice('portal/'.length);
  return cleaned;
}

const POLL_MS = 60_000;

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(Number(data?.unread_count) || 0);
    } catch {
      // The list view provides retryable feedback when a member opens notifications.
    }
  }, []);

  useEffect(() => {
    fetchCount();
    pollRef.current = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchCount]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await getNotifications({ limit: 20 });
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unread_count) || 0);
    } catch (err) {
      setListError(err.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const markRead = async (id) => {
    setMutationError('');
    try {
      await markNotificationRead(id);
      setNotifications((current) => current.map((notification) => (
        notification.id === id ? { ...notification, is_read: true } : notification
      )));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setMutationError(err.message || 'Could not mark this notification as read.');
      throw err;
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setMutationError('');
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      setMutationError(err.message || 'Could not mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notification) => {
    try {
      if (!notification.is_read) await markRead(notification.id);
    } catch {
      return;
    }

    const destination = normalizePortalLink(notification.link);
    if (destination && onNavigate) {
      onNavigate(destination);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls="notification-dropdown"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <section id="notification-dropdown" aria-label="Notifications" className="absolute right-0 top-full z-50 mt-2 flex max-h-[520px] w-96 flex-col rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && !listError && (
              <button type="button" onClick={markAllRead} disabled={markingAll} className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-green-700 disabled:opacity-50">
                {markingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Mark all read
              </button>
            )}
          </div>

          {mutationError && <div role="alert" className="mx-3 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{mutationError}</div>}

          <div className="flex-1 overflow-y-auto">
            {loading && <div className="py-8 text-center text-sm text-gray-400">Loading…</div>}
            {!loading && listError && <div className="p-4 text-center"><AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" /><p className="text-sm text-red-700">{listError}</p><button type="button" onClick={fetchList} className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">Retry</button></div>}
            {!loading && !listError && notifications.length === 0 && <div className="py-10 text-center"><Bell className="mx-auto mb-2 h-8 w-8 text-gray-300" /><p className="text-sm text-gray-400">You&apos;re all caught up!</p></div>}
            {!loading && !listError && notifications.map((notification) => <button key={notification.id} type="button" onClick={() => handleClick(notification)} className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50/60' : ''}`}><div className="mt-0.5 shrink-0">{ICONS[notification.type] ?? <Info className="h-4 w-4 text-gray-400" />}</div><div className="min-w-0 flex-1"><p className={`text-sm leading-snug text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}`}>{notification.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{notification.message}</p><p className="mt-1 text-[11px] text-gray-400">{timeAgo(notification.created_at)}</p></div>{!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}</button>)}
          </div>
        </section>
      )}
    </div>
  );
}
