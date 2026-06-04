import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, ArrowRight, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { ticketsApi, sprintsApi } from '../api';
import type { Ticket, Sprint } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button, ConfirmModal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';
import { PRIORITY_DOT_COLORS } from '../constants/ticketStyles';

export function BacklogPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sprintSelectVal, setSprintSelectVal] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    setError(false);
    setLoading(true);
    try {
      const [ticketRes, sprintRes] = await Promise.all([
        ticketsApi.list({ status: 'BACKLOG', limit: '200' }),
        sprintsApi.list({ status: 'PLANNED' }),
      ]);
      setTickets(ticketRes.data.tickets);
      setSprints(sprintRes.data.filter((s: Sprint) => s.status !== 'COMPLETED'));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === tickets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tickets.map((t) => t.id)));
    }
  }

  async function handleAddToSprint(sprintId: string) {
    if (!sprintId || selected.size === 0) return;
    try {
      await sprintsApi.addTickets(sprintId, Array.from(selected));
      setSelected(new Set());
      toast.success(`${selected.size} ticket(s) added to sprint`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add tickets to sprint');
    }
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      await Promise.all(Array.from(selected).map((id) => ticketsApi.delete(id)));
      toast.success(`${selected.size} ticket(s) deleted`);
      setSelected(new Set());
      setConfirmDelete(false);
      loadData();
    } catch {
      toast.error('Failed to delete some tickets');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[10, 120, 320, 100, 100].map((w, i) => (
                  <th key={i} className="px-5 py-3">
                    <Skeleton className={`h-3 w-${i === 0 ? '4' : `[${w}px]`}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-5 py-4"><Skeleton className="h-4 w-4 rounded" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-64" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mb-3" />
        <p className="text-[16px] font-semibold text-foreground mb-1">Failed to load backlog</p>
        <p className="text-[13px] text-muted-foreground mb-4">Check your connection and try again</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Backlog" subtitle={`${tickets.length} unplanned ticket${tickets.length !== 1 ? 's' : ''}`} />

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
          <span className="text-[13px] font-medium text-foreground">{selected.size} selected</span>
          <div className="flex-1" />
          {sprints.length > 0 && (
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Select
                value={sprintSelectVal}
                onValueChange={(val) => { handleAddToSprint(val); setSprintSelectVal(undefined); }}
              >
                <SelectTrigger className="h-8 w-[180px] text-sm">
                  <SelectValue placeholder="Add to sprint…" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 className="w-3 h-3" />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      {tickets.length === 0 ? (
        <div className="bg-card rounded-xl border border-border py-16">
          <EmptyState
            icon={<Inbox className="w-12 h-12" />}
            title="Backlog is empty"
            description="All tickets are assigned to sprints."
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 w-[40px] text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                    checked={selected.size === tickets.length && tickets.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Ticket #</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, i) => (
                <tr
                  key={ticket.id}
                  className={`h-[52px] cursor-pointer hover:bg-muted transition-colors ${i % 2 === 1 ? 'bg-muted/50' : 'bg-card'}`}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <td className="px-5 w-[40px] text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selected.has(ticket.id)}
                      onChange={() => toggleSelect(ticket.id)}
                    />
                  </td>
                  <td className="px-5">
                    <span className="text-[12px] font-mono text-[hsl(var(--color-info))] font-medium">{ticket.ticketNumber}</span>
                  </td>
                  <td className="px-5">
                    <span className="text-[14px] font-medium text-foreground">{ticket.title}</span>
                  </td>
                  <td className="px-5">
                    <span className="text-[12px] text-muted-foreground capitalize">
                      {ticket.type?.toLowerCase().replace('_', ' ') || '—'}
                    </span>
                  </td>
                  <td className="px-5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PRIORITY_DOT_COLORS[ticket.priority] ?? PRIORITY_DOT_COLORS['LOW'] }}
                      />
                      <span className="text-[12px] font-semibold tracking-wider uppercase text-foreground">
                        {ticket.priority}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(false); }}
        title="Delete tickets"
        description={`Permanently delete ${selected.size} ticket(s)? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
