import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { usersApi } from '@/api';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types';

const ROLE_BADGE: Record<string, 'default' | 'warning' | 'error' | 'success' | 'secondary'> = {
  ADMIN: 'error', MANAGER: 'default', PROJECT_MANAGER: 'info' as any, MEMBER: 'secondary',
};

const STATUS_BADGE: Record<string, 'success' | 'secondary' | 'warning'> = {
  ACTIVE: 'success', INACTIVE: 'secondary', PENDING: 'warning',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const LIMIT = 25;

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () => usersApi.list({
      page, limit: LIMIT,
      search: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const users: User[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Users" subtitle={`${total} registered users across all organisations`} />

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..." className="pl-9 w-64" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 text-sm border border-input rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="MEMBER">Member</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 text-sm border border-input rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organisation</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verified</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
              : users.length === 0
                ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-3 opacity-30" /><p>No users found</p>
                  </td></tr>
                )
                : users.map((user, i) => (
                  <tr key={user.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={user.avatar} name={user.fullName} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{user.organization?.name ?? '—'}</td>
                    <td className="px-5 py-3"><Badge variant={ROLE_BADGE[user.role] ?? 'secondary'}>{user.role.replace('_', ' ')}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={STATUS_BADGE[user.status] ?? 'secondary'}>{user.status}</Badge></td>
                    <td className="px-5 py-3">
                      <span className={user.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                        {user.emailVerified ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
