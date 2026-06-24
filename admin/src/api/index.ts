import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type {
  MasterAdmin, Organisation, User, SupportTicket, AuditLog,
  DashboardStats, SignupDataPoint, TicketsByStatus,
  SystemHealth, ErrorLog, PaginatedResponse,
} from '../types';

// ── Axios instance ────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: '/api/master-admin' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; admin: MasterAdmin }>('/auth/login', { email, password }),

  me: () =>
    api.get<MasterAdmin>('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard'),

  getSignupTrend: (days = 30) =>
    api.get<SignupDataPoint[]>(`/dashboard/signups?days=${days}`),

  getTicketsByStatus: () =>
    api.get<TicketsByStatus[]>('/dashboard/tickets-by-status'),
};

// ── Organisations ─────────────────────────────────────────────────────────────

export const orgsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Organisation>>('/organisations', { params }),

  get: (id: string) =>
    api.get<Organisation>(`/organisations/${id}`),

  update: (id: string, data: { name?: string; domain?: string }) =>
    api.patch<Organisation>(`/organisations/${id}`, data),

  delete: (id: string) =>
    api.delete(`/organisations/${id}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string; orgId?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  get: (id: string) =>
    api.get<User>(`/users/${id}`),

  update: (id: string, data: { role?: string; status?: string }) =>
    api.patch<User>(`/users/${id}`, data),

  impersonate: (id: string) =>
    api.post<{ token: string }>(`/users/${id}/impersonate`),
};

// ── Support ───────────────────────────────────────────────────────────────────

export const supportApi = {
  list: (params?: { page?: number; limit?: number; status?: string; priority?: string; category?: string; orgId?: string }) =>
    api.get<{ tickets: SupportTicket[]; total: number; page: number; limit: number }>('/support/tickets', { params }),

  get: (id: string) =>
    api.get<SupportTicket>(`/support/tickets/${id}`),

  updateStatus: (id: string, data: { status: string; expectedResolutionDate?: string; priority?: string }) =>
    api.patch<SupportTicket>(`/support/tickets/${id}/status`, data),

  reply: (id: string, content: string, attachmentUrl?: string) =>
    api.post(`/support/tickets/${id}/reply`, { message: content, attachmentUrl }),

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ url: string; originalName: string; size: number }>(
      '/support/upload',
      form,
      { headers: { 'Content-Type': undefined } },
    );
  },

  getStats: () =>
    api.get<{ total: number; open: number; inProgress: number; resolved: number; closed: number; avgResponseTimeHours: number }>('/support/stats'),
};

// ── Technical ─────────────────────────────────────────────────────────────────

export const technicalApi = {
  getHealth: () =>
    api.get<SystemHealth>('/technical/health'),

  getErrors: (params?: { page?: number; limit?: number; level?: string }) =>
    api.get<PaginatedResponse<ErrorLog>>('/technical/errors', { params }),

  getJobs: () =>
    api.get<{ name: string; status: string; lastRun: string | null; nextRun: string | null }[]>('/technical/jobs'),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

export const auditApi = {
  list: (params?: { page?: number; limit?: number; adminId?: string; action?: string }) =>
    api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params }),
};

// ── Admin Accounts ────────────────────────────────────────────────────────────

export const adminAccountsApi = {
  list: () =>
    api.get<MasterAdmin[]>('/admin-accounts'),

  create: (data: { email: string; fullName: string; role: string; password: string }) =>
    api.post<MasterAdmin>('/admin-accounts', { name: data.fullName, email: data.email, role: data.role, password: data.password }),

  update: (id: string, data: { role?: string; fullName?: string }) =>
    api.patch<MasterAdmin>(`/admin-accounts/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin-accounts/${id}`),
};

export default api;
