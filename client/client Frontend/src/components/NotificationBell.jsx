import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NOTIFICATION_API_BASE_URL = "http://localhost:3000/api/notifications";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Token");
  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
};

const formatTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

const NotificationBell = ({ className = "" }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(NOTIFICATION_API_BASE_URL, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load notifications");
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const markRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await fetch(`${NOTIFICATION_API_BASE_URL}/${notification._id}/read`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          credentials: "include",
        });
        setNotifications((current) =>
          current.map((item) => item._id === notification._id ? { ...item, isRead: true } : item)
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      if (notification.link) {
        navigate(notification.link);
        setOpen(false);
      }
    } catch (readError) {
      setError(readError.message);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${NOTIFICATION_API_BASE_URL}/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (readError) {
      setError(readError.message);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (!open) fetchNotifications();
        }}
        className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-100"
        aria-label="Open notifications"
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[70] w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="grid h-9 w-9 place-items-center rounded-full text-[#6152a8] hover:bg-[#f4f1ff]"
              aria-label="Mark all notifications read"
            >
              <CheckCheck size={18} />
            </button>
          </div>

          <div className="max-h-96 overflow-auto">
            {loading && (
              <div className="flex items-center gap-2 px-4 py-6 text-sm font-semibold text-[#6152a8]">
                <Loader2 className="animate-spin" size={16} />
                Loading notifications
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-5 text-sm font-semibold text-red-600">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</div>
            )}

            {!loading && !error && notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => markRead(notification)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  notification.isRead ? "bg-white" : "bg-[#f7f4ff]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.isRead ? "bg-slate-200" : "bg-[#6152a8]"
                  }`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-900">{notification.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span>
                    <span className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {formatTime(notification.createdAt)}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
