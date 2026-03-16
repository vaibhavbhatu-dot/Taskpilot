// ─── User Types ──────────────────────────────────────────
export type UserRole = 'ADMIN' | 'MANAGER' | 'PROJECT_MANAGER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface User {
  id: string;
  email: string;
  fullName: string;
  designation?: string;
  role: UserRole;
  avatar?: string;
  teamId?: string;
  managerId?: string;
  status: UserStatus;
  createdAt?: string;
  team?: { id: string; name: string };
  manager?: { id: string; fullName: string };
  _count?: { assignedTickets: number; createdTickets: number };
}

// ─── Team Types ──────────────────────────────────────────
export interface Team {
  id: string;
  name: string;
  leadId?: string;
  lead?: Pick<User, 'id' | 'fullName' | 'avatar' | 'email' | 'designation'>;
  members?: User[];
  _count?: { members: number };
}

// ─── Project Types ───────────────────────────────────────
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  key: string;
  leadId?: string;
  status: ProjectStatus;
  lead?: Pick<User, 'id' | 'fullName' | 'avatar'>;
  _count?: { tickets: number; sprints: number };
}

// ─── Ticket Types ────────────────────────────────────────
export type TicketType = 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT';
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface Ticket {
  id: string;
  ticketNumber: string;
  projectId: string;
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  createdById: string;
  assignedToId?: string;
  teamId?: string;
  dueDate?: string;
  storyPoints?: number;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  project?: Pick<Project, 'id' | 'name' | 'key'>;
  assignedTo?: Pick<User, 'id' | 'fullName' | 'avatar'>;
  createdBy?: Pick<User, 'id' | 'fullName' | 'avatar'>;
  team?: Pick<Team, 'id' | 'name'>;
  _count?: { comments: number };
  sprintTickets?: SprintTicket[];
}

// ─── Sprint Types ────────────────────────────────────────
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  status: SprintStatus;
  createdById: string;
  project?: Pick<Project, 'id' | 'name' | 'key'>;
  createdBy?: Pick<User, 'id' | 'fullName'>;
  _count?: { sprintTickets: number };
  sprintTickets?: SprintTicket[];
}

export interface SprintTicket {
  id: string;
  sprintId: string;
  ticketId: string;
  statusAtStart: TicketStatus;
  pointsAtStart?: number;
  ticket?: Ticket;
  sprint?: Sprint;
}

// ─── Comment Types ───────────────────────────────────────
export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, 'id' | 'fullName' | 'avatar'>;
  replies?: Comment[];
}

// ─── Notification Types ──────────────────────────────────
export type NotificationType =
  | 'TICKET_ASSIGNED' | 'TICKET_UPDATED' | 'TICKET_COMMENTED'
  | 'SPRINT_STARTED' | 'SPRINT_COMPLETED' | 'INVITATION_SENT'
  | 'MENTION' | 'OVERDUE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Invitation Types ────────────────────────────────────
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  invitedById: string;
  presetRole: UserRole;
  presetManagerId?: string;
  presetTeamId?: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy?: Pick<User, 'id' | 'fullName'>;
}

// ─── History Types ───────────────────────────────────────
export interface TicketHistory {
  id: string;
  ticketId: string;
  changedById: string;
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
  changedBy?: Pick<User, 'id' | 'fullName' | 'avatar'>;
  ticket?: Pick<Ticket, 'id' | 'ticketNumber' | 'title'>;
}

// ─── Dashboard Types ─────────────────────────────────────
export interface DashboardKPIs {
  totalTickets: number;
  todoTickets: number;
  inProgressTickets: number;
  doneTickets: number;
  blockedTickets: number;
  overdueTickets: number;
  teamMemberCount: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  recentActivity: TicketHistory[];
  overdueTicketsList: Ticket[];
}

export interface VelocityData {
  velocity: Array<{
    sprintName: string;
    sprintId: string;
    completedPoints: number;
    totalPoints: number;
    completedTickets: number;
    totalTickets: number;
  }>;
  avgVelocity: number;
}

export interface BurndownData {
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  totalDays: number;
  elapsedDays: number;
  idealBurndown: Array<{ day: number; ideal: number }>;
  ticketStats: {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
  };
}

// ─── API Response Types ──────────────────────────────────
export interface PaginatedResponse<T> {
  tickets: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'avatar' | 'designation'>;
}

export interface SearchResults {
  tickets: Ticket[];
  users: User[];
  projects: Project[];
}
