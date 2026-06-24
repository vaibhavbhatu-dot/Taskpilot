// ── Master Admin ────────────────────────────────────────────────────────────

export type MasterAdminRole =
  | 'SUPER_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'TECH_ADMIN'
  | 'MARKETING_ADMIN'
  | 'FINANCE_ADMIN';

export interface MasterAdmin {
  id: string;
  email: string;
  fullName: string;
  role: MasterAdminRole;
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

// ── Organisation ─────────────────────────────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    projects: number;
    sprints: number;
    supportTickets: number;
  };
}

// ── User ─────────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'MANAGER' | 'PROJECT_MANAGER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface User {
  id: string;
  email: string;
  fullName: string;
  designation: string | null;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  organizationId: string | null;
  organization: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ── Support ───────────────────────────────────────────────────────────────────

export type SupportStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SupportCategory = 'BUG' | 'FEATURE' | 'ACCOUNT' | 'BILLING' | 'OTHER';

export interface SupportMessage {
  id: string;
  content: string;
  isAdminReply: boolean;
  createdAt: string;
  author: { id: string; fullName: string; avatar: string | null; role: string } | null;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: SupportCategory;
  subject: string;
  description: string;
  status: SupportStatus;
  priority: SupportPriority;
  expectedResolutionDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; fullName: string; email: string; avatar: string | null };
  organization: { id: string; name: string };
  messages: SupportMessage[];
  _count: { messages: number };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalOrgs: number;
  activeOrgs: number;
  totalUsers: number;
  newSignups7d: number;
  openTickets: number;
  criticalTickets: number;
  errorRate: number;
  avgResponseTimeHours: number;
}

export interface SignupDataPoint {
  date: string;
  count: number;
}

export interface TicketsByStatus {
  status: string;
  count: number;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message?: string;
}

// ── Technical ─────────────────────────────────────────────────────────────────

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: { status: string; latencyMs: number };
  api: { status: string; uptime: number };
  memory: { used: number; total: number; percentage: number };
  checkedAt: string;
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack: string | null;
  path: string | null;
  userId: string | null;
  createdAt: string;
}
