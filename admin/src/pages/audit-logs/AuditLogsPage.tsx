import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { auditApi } from '@/api';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types';

const ACTION_BADGE: Record<string, any> = {
  CREATE: 'success', UPDATE: 'info', DELETE: 'error', LOGIN: 'secondary', LOGOUT: 'secondary',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const LIMIT = 30;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditApi.list({ page, limit: LIMIT }).then(r => r.data).catch(() => ({ data: [], total: 0, page: 1, limit: LIMIT, totalPages: 0 })),
    placeholderData: (prev) => prev,
  });

  const logs: AuditLog[] = data?.data ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function getActionBadge(action: string) {
    const key = Object.keys(ACTION_BADGE).find(k => action.toUpperCase().startsWith(k));
    return ACTION_BADGE[key ?? ''] ?? 'secondary';
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Audit Logs" subtitle="Complete history of all admin actions" />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resource</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP Address</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(5)].map((_, j) => <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              ))
              : !(logs || []).length
                ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">
                      <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p>No audit logs yet</p>
                    </td>
                  </tr>
                )
                : (logs || []).map((log, i) => (
                  <tr key={log.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                    <td className="px-5 py-3 font-medium text-foreground">{log.adminName}</td>
                    <td className="px-5 py-3">
                      <Badge variant={getActionBadge(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {log.resource}
                      {log.resourceId && <span className="font-mono text-xs ml-1 text-muted-foreground/60">·{log.resourceId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress ?? '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(log.createdAt, 'relative')}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} total logs</p>
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
