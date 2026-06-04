import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User, UserPlus, MessageSquare, AlertCircle, Play, CheckCircle, Search, Settings } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../stores';
import { notificationsApi } from '../../api';
import type { Notification } from '../../types';
import { SearchModal } from '../ui/SearchModal';
import { getInitials } from '@/design-system';

// Helper for relative time
function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'TICKET_ASSIGNED': return <UserPlus className="w-5 h-5 text-blue-500" />;
    case 'TICKET_COMMENTED': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
    case 'SPRINT_STARTED': return <Play className="w-5 h-5 text-green-500" />;
    case 'SPRINT_COMPLETED': return <CheckCircle className="w-5 h-5 text-purple-500" />;
    case 'OVERDUE': return <AlertCircle className="w-5 h-5 text-red-500" />;
    default: return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
}


export function TopBar() {
  const { user, clearAuth } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get page title
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadNotifications() {
    try {
      const { data } = await notificationsApi.list(true);
      setNotifications(data.notifications.slice(0, 5));
      setUnreadCount(data.unreadCount);
    } catch { /* Silently fail */ }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* Silently fail */ }
  }

  function handleNotificationClick(notif: Notification) {
    if (notif.link) navigate(notif.link);
    setShowNotifications(false);
    if (!notif.isRead) {
      notificationsApi.markRead(notif.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center px-6 gap-4">
      {/* Mobile menu button */}
      <button onClick={toggleSidebar} aria-label="Open menu" className="p-2 rounded-lg hover:bg-accent lg:hidden">
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      <div className="flex-1" />

      {/* Search Input Trigger */}
      <button
        onClick={() => setShowSearch(true)}
        className="hidden md:flex items-center gap-2 w-full max-w-[320px] h-10 px-3 bg-muted hover:bg-muted/70 border border-transparent rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-ring mr-2"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 text-[13px] text-muted-foreground truncate whitespace-nowrap">Search tickets, members, projects...</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-sans text-muted-foreground">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-sans text-muted-foreground">K</kbd>
        </div>
      </button>

      {/* Mobile Search Icon */}
      <button
        onClick={() => setShowSearch(true)}
        aria-label="Search"
        className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Search className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Settings icon (Admin only) */}
      {user?.role === 'ADMIN' && (
        <button
          onClick={() => navigate('/settings')}
          className={`p-2 rounded-lg hover:bg-accent transition-colors ${location.pathname === '/settings' ? 'bg-primary/10' : ''}`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {/* Notification bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
          aria-expanded={showNotifications}
          className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <span className="font-semibold text-[14px] text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[12px] text-[hsl(var(--color-info))] hover:opacity-80 font-medium transition-opacity">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                     <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-[14px] font-medium text-foreground">All caught up!</p>
                  <p className="text-[12px] text-muted-foreground mt-1">You have no new notifications.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full flex items-start text-left px-4 py-3 border-b border-border hover:bg-accent transition-colors gap-3 ${
                      !notif.isRead ? 'bg-primary/5' : 'bg-card'
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.isRead ? 'bg-primary/10' : 'bg-muted'}`}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] ${!notif.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>{notif.title}</p>
                      <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-medium">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
              className="w-full text-center py-3 text-[13px] text-[hsl(var(--color-info))] hover:bg-accent border-t border-border font-medium transition-colors"
            >
              View all
            </button>
          </div>
        )}
      </div>

      {/* User avatar dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-label="User menu"
          aria-expanded={showUserMenu}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-primary">{getInitials(user?.fullName ?? '')}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl border border-border overflow-hidden z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              My Profile
            </button>
            <button
              onClick={() => { clearAuth(); navigate('/login'); setShowUserMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </header>
  );
}
