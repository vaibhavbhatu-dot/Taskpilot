import api from './client';
import type {
  AuthResponse, User, Team, Project, Ticket, Sprint, Comment,
  Invitation, Notification, DashboardData, Attachment,
  PaginatedResponse, SearchResults,
} from '../types';

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  refresh: () =>
    api.post<{ accessToken: string }>('/auth/refresh'),
  logout: () =>
    api.post('/auth/logout'),
  verifyInvite: (token: string) =>
    api.get(`/auth/invite/${token}`),
  setup: (data: { token: string; fullName: string; designation?: string; managerId?: string; password: string; avatar?: string }) =>
    api.post<AuthResponse>('/auth/setup', data),
  getMe: () =>
    api.get<User>('/auth/me'),
  register: (data: { fullName: string; email: string; password: string; companyName: string }) =>
    api.post('/auth/register', data),
  verifyOtp: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),
  resendOtp: (data: { email: string }) =>
    api.post('/auth/resend-otp', data),
};

// ─── Users ───────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, string>) =>
    api.get<User[]>('/users', { params }),
  get: (id: string) =>
    api.get<User>(`/users/${id}`),
  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data),
  updateRole: (id: string, role: string) =>
    api.patch<User>(`/users/${id}/role`, { role }),
  deactivate: (id: string) =>
    api.patch<User>(`/users/${id}`, { status: 'INACTIVE' }),
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
  updateProfile: (data: { designation?: string; role?: string; timezone?: string }) =>
    api.patch('/users/profile', data),
};

// ─── Teams ───────────────────────────────────────────────
export const teamsApi = {
  list: () =>
    api.get<Team[]>('/teams'),
  get: (id: string) =>
    api.get<Team>(`/teams/${id}`),
  create: (data: { name: string; leadId?: string }) =>
    api.post<Team>('/teams', data),
  update: (id: string, data: Partial<Team>) =>
    api.patch<Team>(`/teams/${id}`, data),
  delete: (id: string) =>
    api.delete(`/teams/${id}`),
  addMembers: (teamId: string, userIds: string[]) =>
    api.post<Team>(`/teams/${teamId}/members`, { userIds }),
  removeMember: (teamId: string, userId: string) =>
    api.delete<Team>(`/teams/${teamId}/members/${userId}`),
};

// ─── Projects ────────────────────────────────────────────
export const projectsApi = {
  list: (params?: Record<string, string>) =>
    api.get<Project[]>('/projects', { params }),
  get: (id: string) =>
    api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; key: string; leadId?: string }) =>
    api.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/projects/${id}`),
};

// ─── Tickets ─────────────────────────────────────────────
export const ticketsApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Ticket>>('/tickets', { params }),
  get: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`),
  create: (data: Partial<Ticket>) =>
    api.post<Ticket>('/tickets', data),
  update: (id: string, data: Partial<Ticket>) =>
    api.patch<Ticket>(`/tickets/${id}`, data),
  delete: (id: string) =>
    api.delete(`/tickets/${id}`),
  getHistory: (id: string) =>
    api.get(`/tickets/${id}/history`),
  bulkUpdate: (ticketIds: string[], updates: Partial<Ticket>) =>
    api.put('/tickets/bulk', { ticketIds, updates }),
  uploadAttachment: (id: string, file: File, commentId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (commentId) form.append('commentId', commentId);
    return api.post<Attachment>(`/tickets/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (ticketId: string, attachmentId: string) =>
    api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`),
};

// ─── Sprints ─────────────────────────────────────────────
export const sprintsApi = {
  list: (params?: Record<string, string>) =>
    api.get<Sprint[]>('/sprints', { params }),
  get: (id: string) =>
    api.get<Sprint>(`/sprints/${id}`),
  create: (data: Partial<Sprint>) =>
    api.post<Sprint>('/sprints', data),
  update: (id: string, data: Partial<Sprint>) =>
    api.patch<Sprint>(`/sprints/${id}`, data),
  start: (id: string, data?: { startDate?: string; endDate?: string }) =>
    api.post(`/sprints/${id}/start`, data),
  complete: (id: string, carryOverToSprintId?: string) =>
    api.post(`/sprints/${id}/complete`, { carryOverToSprintId }),
  addTickets: (id: string, ticketIds: string[]) =>
    api.post(`/sprints/${id}/tickets`, { ticketIds }),
  removeTicket: (sprintId: string, ticketId: string) =>
    api.delete(`/sprints/${sprintId}/tickets/${ticketId}`),
};

// ─── Comments ────────────────────────────────────────────
export const commentsApi = {
  list: (ticketId: string) =>
    api.get<Comment[]>(`/comments/${ticketId}`),
  create: (ticketId: string, data: {
    content: string;
    parentId?: string;
    mentionedUserIds?: string[];
    notifyAllAssignees?: boolean;
  }) =>
    api.post<Comment>(`/comments/${ticketId}`, data),
  update: (ticketId: string, commentId: string, content: string) =>
    api.patch<Comment>(`/comments/${ticketId}/${commentId}`, { content }),
  delete: (ticketId: string, commentId: string) =>
    api.delete(`/comments/${ticketId}/${commentId}`),
};

// ─── Invitations ─────────────────────────────────────────
export const invitationsApi = {
  list: () =>
    api.get<Invitation[]>('/invitations'),
  create: (data: { email: string; role?: string; managerId?: string; teamId?: string }) =>
    api.post<Invitation>('/invitations', data),
  revoke: (id: string) =>
    api.delete(`/invitations/${id}`),
};

// ─── Notifications ───────────────────────────────────────
export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications', {
      params: unreadOnly ? { unreadOnly: 'true' } : {},
    }),
  markAllRead: () =>
    api.patch('/notifications/read'),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
};

// ─── Dashboard ───────────────────────────────────────────
export const dashboardApi = {
  getData: () =>
    api.get<DashboardData>('/dashboard'),
  getWorkload: () =>
    api.get('/dashboard/workload'),
};

// ─── Search ─────────────────────────────────────────────
export const searchApi = {
  globalSearch: (query: string) =>
    api.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`),
};

// ─── My Work ────────────────────────────────────────────
export const myWorkApi = {
  getTickets: (params: Record<string, string>) =>
    api.get('/my-work', { params }),
  getTeams: () =>
    api.get('/my-work/teams'),
  getMembers: (teamId?: string) =>
    api.get('/my-work/members', { params: teamId ? { teamId } : {} }),
};

// ─── Onboarding ─────────────────────────────────────────
export const onboardingApi = {
  generate: (data: { teamType: string; workStyle: string; teamSize: string }) =>
    api.post('/onboarding/generate', data),
};

// ─── Admin ──────────────────────────────────────────────
export const adminApi = {
  getActivityLog: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/activity', { params }),
};
