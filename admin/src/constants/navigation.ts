import {
  LayoutDashboard, Building2, Users, HeadphonesIcon, BrainCircuit,
  TrendingUp, Zap, Filter, AlertTriangle, Activity, Settings2,
  Flag, Mail, Shield, ClipboardList, CreditCard, Layers,
} from 'lucide-react';
import type { MasterAdminRole } from '../types';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: MasterAdminRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',      href: '/dashboard',       icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Organisations',  href: '/organisations',   icon: Building2 },
      { label: 'Users',          href: '/users',           icon: Users },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Support Tickets', href: '/support',        icon: HeadphonesIcon },
      { label: 'AI Triage Queue', href: '/support/triage', icon: BrainCircuit },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Growth',          href: '/analytics/growth',   icon: TrendingUp, badge: 'Phase 2' },
      { label: 'Feature Adoption',href: '/analytics/features', icon: Zap,        badge: 'Phase 2' },
      { label: 'Signup Funnel',   href: '/analytics/funnel',   icon: Filter,     badge: 'Phase 2' },
    ],
  },
  {
    label: 'Technical',
    items: [
      { label: 'Error Logs',       href: '/technical/errors',  icon: AlertTriangle, roles: ['SUPER_ADMIN', 'TECH_ADMIN'] },
      { label: 'Background Jobs',  href: '/technical/jobs',    icon: Layers,        roles: ['SUPER_ADMIN', 'TECH_ADMIN'] },
      { label: 'System Health',    href: '/technical/health',  icon: Activity,      roles: ['SUPER_ADMIN', 'TECH_ADMIN'] },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Feature Flags',    href: '/config/flags',      icon: Flag,    roles: ['SUPER_ADMIN'] },
      { label: 'Email Templates',  href: '/config/email',      icon: Mail,    roles: ['SUPER_ADMIN', 'SUPPORT_ADMIN'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Admin Accounts',   href: '/admin-accounts',    icon: Shield,       roles: ['SUPER_ADMIN'] },
      { label: 'Audit Logs',       href: '/audit-logs',        icon: ClipboardList,roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Plans',            href: '/billing/plans',     icon: CreditCard, badge: 'Phase 2' },
      { label: 'Subscriptions',    href: '/billing/subs',      icon: Settings2,  badge: 'Phase 2' },
    ],
  },
];
