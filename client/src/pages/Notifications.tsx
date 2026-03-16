import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../api';
import type { Notification } from '../types';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const { data } = await notificationsApi.list();
      setNotifications(data.notifications);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
  }

  const typeIcon = (_type: string) => '🔔';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="btn-secondary btn-sm">
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No notifications</p>
          <p className="text-sm text-text-muted mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`card p-4 flex items-start gap-3 transition-colors
                ${!notif.isRead ? 'bg-primary-50/50 border-primary-100' : ''}`}
            >
              <span className="text-lg mt-0.5">{typeIcon(notif.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                <p className="text-sm text-text-secondary mt-0.5">{notif.message}</p>
                <p className="text-xs text-text-muted mt-1.5">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="btn-ghost btn-sm flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4 text-primary-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
