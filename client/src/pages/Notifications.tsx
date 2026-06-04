import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, UserPlus, MessageSquare, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { notificationsApi } from '../api';
import { Skeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import type { Notification } from '../types';
import { Button } from '@/design-system';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'TICKET_ASSIGNED': return <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center"><UserPlus className="w-4 h-4 text-blue-500" /></div>;
    case 'TICKET_COMMENTED': return <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center"><MessageSquare className="w-4 h-4 text-indigo-500" /></div>;
    case 'SPRINT_STARTED': return <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center"><Play className="w-4 h-4 text-green-500" /></div>;
    case 'SPRINT_COMPLETED': return <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-purple-500" /></div>;
    case 'OVERDUE': return <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-500" /></div>;
    default: return <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center"><Bell className="w-4 h-4 text-gray-500" /></div>;
  }
}

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="Notifications" actions={
        !loading && notifications.some((n) => !n.isRead) ? (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} leftIcon={<CheckCheck className="w-4 h-4" />}>
            Mark All Read
          </Button>
        ) : undefined
      } />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
              <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card rounded-xl border border-border">
          <EmptyState
            icon={<Bell className="w-12 h-12" />}
            title="You're all caught up!"
            description="You have no notifications right now. Check back later."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-card rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                !notif.isRead ? 'border-primary/30 bg-primary/10' : 'border-border'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] ${!notif.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                  {notif.title}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">{timeAgo(notif.createdAt)}</p>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  aria-label="Mark as read"
                  className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                >
                  <Check className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
