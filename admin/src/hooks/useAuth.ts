import { useAuthStore } from '../stores/authStore';
import type { MasterAdminRole } from '../types';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, clearAuth } = useAuthStore();

  function hasRole(...roles: MasterAdminRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  function isSuperAdmin() {
    return user?.role === 'SUPER_ADMIN';
  }

  return { user, token, isAuthenticated, isLoading, clearAuth, hasRole, isSuperAdmin };
}
