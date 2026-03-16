import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User, UserPlus, MessageSquare, AlertCircle, Play, CheckCircle, Search } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../stores';
import { notificationsApi } from '../../api';
import type { Notification } from '../../types';
import { SearchModal } from '../ui/SearchModal';

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
    default: return <Bell className="w-5 h-5 text-gray-500" />;
  }
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tickets': 'My Tickets',
  '/board': 'Kanban Board',
  '/sprints': 'Active Sprint',
  '/backlog': 'Sprint Planning',
  '/sprint-reports': 'Sprint Reports',
  '/teams': 'Teams',
  '/projects': 'Projects',
  '/members': 'Team Members',
  '/profile': 'My Profile',
  '/settings': 'Admin Settings',
  '/notifications': 'Notifications',
};

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
  const pageTitle = pageTitles[location.pathname] || 
    (location.pathname.startsWith('/tickets/') ? 'Ticket Detail' :
     location.pathname.startsWith('/teams/') ? 'Team Detail' : 'Dashboard');

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

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4">
      {/* Mobile menu button */}
      <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
        <Menu className="w-5 h-5 text-[#0F172A]" />
      </button>

      {/* Page title */}
      <h1 className="text-[18px] font-semibold text-[#0F172A] hidden sm:block">{pageTitle}</h1>

      <div className="flex-1" />

      {/* Search Input Trigger */}
      <button
        onClick={() => setShowSearch(true)}
        className="hidden md:flex items-center gap-2 w-full max-w-[320px] h-10 px-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-transparent rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
      >
        <Search className="w-4 h-4 text-[#64748B]" />
        <span className="flex-1 text-[13px] text-[#94A3B8]">Search tickets, members, projects...</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-[#CBD5E1] bg-white text-[10px] font-sans text-[#64748B]">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-[#CBD5E1] bg-white text-[10px] font-sans text-[#64748B]">K</kbd>
        </div>
      </button>

      {/* Mobile Search Icon */}
      <button
        onClick={() => setShowSearch(true)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Search className="w-5 h-5 text-[#64748B]" />
      </button>

      {/* Notification bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-[#64748B]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E2E8F0] shadow-lg overflow-hidden z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-gray-50/50">
              <span className="font-semibold text-[14px] text-[#0F172A]">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[12px] text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                     <Bell className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-[14px] font-medium text-[#0F172A]">All caught up!</p>
                  <p className="text-[12px] text-[#64748B] mt-1">You have no new notifications.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full flex items-start text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors gap-3 ${
                      !notif.isRead ? 'bg-[#EFF6FF]' : 'bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.isRead ? 'bg-blue-100/50' : 'bg-gray-100'}`}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] ${!notif.isRead ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#334155]'}`}>{notif.title}</p>
                      <p className="text-[13px] text-[#64748B] mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-1.5 font-medium">
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
              className="w-full text-center py-3 text-[13px] text-[#2563EB] hover:bg-[#F8FAFC] border-t border-[#E2E8F0] font-medium transition-colors"
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
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-[#2563EB]">{getInitials(user?.fullName)}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-[#64748B]" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <p className="text-sm font-medium text-[#0F172A] truncate">{user?.fullName}</p>
              <p className="text-xs text-[#64748B] truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <User className="w-4 h-4 text-[#64748B]" />
              My Profile
            </button>
            <button
              onClick={() => { clearAuth(); navigate('/login'); setShowUserMenu(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-[#E2E8F0]"
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
