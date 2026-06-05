import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Ticket, Columns3, Zap, Calendar, BarChart3,
  Users, FolderOpen, UserPlus, LogOut, X, History, Inbox,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../stores';
import { OnboardingChecklist } from './OnboardingChecklist';
import { getInitials } from '@/design-system';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  tourId?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
  roles?: string[]; // if set, only these roles see the section
}

const sections: NavSection[] = [
  {
    label: 'MAIN',
    items: [
      { name: 'Dashboard',   href: '/',         icon: LayoutDashboard, tourId: 'dashboard' },
      { name: 'Work Update', href: '/my-work',  icon: ClipboardList },
      { name: 'My Tickets',  href: '/tickets',  icon: Ticket,          tourId: 'tickets' },
      { name: 'Backlog',     href: '/backlog',  icon: Inbox },
      { name: 'Kanban Board',href: '/board',    icon: Columns3,        tourId: 'board' },
    ],
  },
  {
    label: 'SPRINTS',
    items: [
      { name: 'Active Sprint', href: '/sprints/active', icon: Zap, tourId: 'sprints' },
      { name: 'Sprint Planning', href: '/sprints/planning', icon: Calendar },
      { name: 'Sprint Reports', href: '/sprints/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'MANAGEMENT',
    roles: ['ADMIN', 'MANAGER'],
    items: [
      { name: 'Teams', href: '/teams', icon: Users },
      { name: 'Projects', href: '/projects', icon: FolderOpen },
      { name: 'Members', href: '/members', icon: UserPlus, roles: ['ADMIN'], tourId: 'invite' },
      { name: 'Activity Log', href: '/activity', icon: History, roles: ['ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userRole = user?.role || 'MEMBER';

  const canSeeSection = (section: NavSection) => {
    if (!section.roles) return true;
    return section.roles.includes(userRole);
  };

  const canSeeItem = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-[#0F172A] flex flex-col
                     transition-transform duration-300 ease-in-out
                     ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                     lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <span className="text-[20px] font-semibold text-white tracking-tight">TaskPilot</span>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-white/10 lg:hidden text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto mt-6 px-2 space-y-5">
          {sections.filter(canSeeSection).map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-1.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-widest">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.filter(canSeeItem).map((item) => {
                  const isActive = item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      {...(item.tourId ? { 'data-tour': item.tourId } : {})}
                      className={`group flex items-center gap-3 h-[44px] px-3 mx-1 rounded-lg text-[14px] font-medium transition-colors relative ${
                        isActive
                          ? 'bg-[#2563EB] text-white'
                          : 'text-[#94A3B8] hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />
                      )}
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <OnboardingChecklist />

        {/* User section */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-[#2563EB]">
                  {getInitials(user?.fullName ?? '')}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-white truncate">{user?.fullName}</p>
              <span className="inline-block text-[11px] text-slate-400 bg-white/10 px-1.5 py-0.5 rounded mt-0.5">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full h-[44px] px-3 mx-1 rounded-lg text-[14px] font-medium text-[#94A3B8] hover:bg-white/[0.06] hover:text-red-400 transition-colors mt-1"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
