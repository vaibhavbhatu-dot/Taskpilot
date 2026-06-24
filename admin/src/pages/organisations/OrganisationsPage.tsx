import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { orgsApi } from '@/api';
import { formatDate } from '@/lib/utils';
import type { Organisation } from '@/types';

export default function OrganisationsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['organisations', page, search],
    queryFn: () => orgsApi.list({ page, limit: LIMIT, search: search || undefined }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const orgs: Organisation[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Organisations"
        subtitle={`${total} total organisations on the platform`}
      />

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or domain..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organisation</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Support</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
              : orgs.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                      <Building2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p>No organisations found</p>
                    </td>
                  </tr>
                )
                : orgs.map((org, i) => (
                  <tr key={org.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-primary">{org.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{org.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{org.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {org.domain ? (
                        <a href={`https://${org.domain}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline">
                          {org.domain}<ExternalLink className="w-3 h-3" />
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3"><Badge variant="secondary">{org._count.users}</Badge></td>
                    <td className="px-5 py-3 text-foreground">{org._count.projects}</td>
                    <td className="px-5 py-3 text-foreground">{org._count.supportTickets}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors"
              >Previous</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
