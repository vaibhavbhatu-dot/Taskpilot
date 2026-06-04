import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List, Columns3, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { toast } from 'sonner';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';
import { isOverdue } from '@/lib/utils';
import { STATUS_STYLES, PRIORITY_DOT_COLORS } from '../constants/ticketStyles';
import { ticketsApi, projectsApi, usersApi, sprintsApi, teamsApi } from '../api';
import { useAuthStore } from '../stores';
import type { Ticket, TicketPriority, Project, User, Sprint, Team } from '../types';
import { FilterBuilder, type FilterRow } from '../components/tickets/FilterBuilder';
import { CreateTicketPanel } from '../components/tickets/CreateTicketPanel';
import { exportTicketsToCSV, exportTicketsToPDF } from '../utils/export';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ClipboardList } from 'lucide-react';
import { TICKET_STATUSES, getStatusLabel } from '../constants/ticketStatus';

const STATUS_OPTIONS = TICKET_STATUSES;
const PRIORITY_OPTIONS: TicketPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function TicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancedFilters, setAdvancedFilters] = useState<FilterRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [bulkActionLoad, setBulkActionLoad] = useState(false);
  const [bulkStatusSel, setBulkStatusSel] = useState<string | undefined>();
  const [bulkPrioritySel, setBulkPrioritySel] = useState<string | undefined>();
  const [bulkAssigneeSel, setBulkAssigneeSel] = useState<string | undefined>();

  // Data for filters
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => { loadFilterData(); }, []);
  useEffect(() => { loadTickets(); }, [page]); // we'll manually fetch on apply filter

  async function loadFilterData() {
    try {
      const [p, u, s, t] = await Promise.all([
        projectsApi.list().catch(() => ({ data: [] })),
        usersApi.list().catch(() => ({ data: [] })),
        sprintsApi.list().catch(() => ({ data: [] })),
        teamsApi.list().catch(() => ({ data: [] })),
      ]);
      setProjects(p.data);
      setUsers(u.data as User[]);
      setSprints(s.data as Sprint[]);
      setTeams(t.data as Team[]);
    } catch { /* ignore */ }
  }

  async function loadTickets() {
    setLoading(true);
    setSelectedTickets(new Set()); // Clear selection on fetch
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (advancedFilters.length > 0) {
        params.filters = JSON.stringify(advancedFilters);
      }
      const { data } = await ticketsApi.list(params);
      setTickets(data.tickets);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch { toast.error('Failed to load tickets. Please refresh.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title={isAdmin ? 'All Tickets' : 'My Tickets'} />
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div role="tablist" aria-label="View mode" className="flex bg-muted rounded-lg p-0.5">
            <button
              role="tab"
              aria-selected={true}
              aria-label="List view"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-card text-foreground shadow-sm"
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              role="tab"
              aria-selected={false}
              aria-label="Board view"
              onClick={() => navigate('/board')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              <Columns3 className="w-4 h-4" /> Board
            </button>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              Export
            </Button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border shadow-lg rounded-lg z-50 py-1 flex flex-col animate-scale-in origin-top-right">
                  <button
                    onClick={() => { setShowExportMenu(false); exportTicketsToCSV(tickets); }}
                    className="text-left px-4 py-2 text-[13px] text-foreground hover:bg-muted"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => { setShowExportMenu(false); exportTicketsToPDF(tickets); }}
                    className="text-left px-4 py-2 text-[13px] text-foreground hover:bg-muted"
                  >
                    Export as PDF
                  </button>
                </div>
              </>
            )}
          </div>
          <Button
            variant="default"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreate(true)}
            className="flex-shrink-0"
          >
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBuilder
        filters={advancedFilters}
        onChange={setAdvancedFilters}
        users={users}
        teams={teams}
        sprints={sprints}
        onApply={() => { setPage(1); loadTickets(); }}
        onClear={() => { setAdvancedFilters([]); setTimeout(() => loadTickets(), 0); }}
      />

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-16">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 w-[40px] text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                  checked={tickets.length > 0 && selectedTickets.size === tickets.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTickets(new Set(tickets.map(t => t.id)));
                    else setSelectedTickets(new Set());
                  }}
                />
              </th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Ticket #</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Assignee</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-5 py-4"><Skeleton className="h-4 w-4 rounded" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><Skeleton variant="circle" className="h-6 w-6" /><Skeleton className="h-4 w-24" /></div></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-8" /></td>
                </tr>
              ))
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16">
                  {advancedFilters.length > 0 ? (
                    <EmptyState
                      icon={<ClipboardList className="w-12 h-12" />}
                      title="No tickets match your filters"
                      description="Try adjusting or clearing your filters."
                      action={{ label: 'Clear filters', onClick: () => setAdvancedFilters([]) }}
                    />
                  ) : (
                    <EmptyState
                      icon={<ClipboardList className="w-12 h-12" />}
                      title="No tickets yet"
                      description="Create your first ticket to start tracking tasks, bugs, and features."
                      action={{ label: '+ Create ticket', onClick: () => setShowCreate(true) }}
                    />
                  )}
                </td>
              </tr>
            ) : (
              tickets.map((t, i) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className={`h-[52px] cursor-pointer hover:bg-muted transition-colors ${i % 2 === 1 ? 'bg-muted/50' : 'bg-card'}`}
                >
                  <td className="px-5 w-[40px] text-center" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedTickets.has(t.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedTickets);
                        if (e.target.checked) newSet.add(t.id);
                        else newSet.delete(t.id);
                        setSelectedTickets(newSet);
                      }}
                    />
                  </td>
                  <td className="px-5">
                    <span className="text-[12px] font-mono text-[hsl(var(--color-info))] font-medium">{t.ticketNumber}</span>
                  </td>
                  <td className="px-5">
                    <span className="text-[14px] font-medium text-foreground">{t.title}</span>
                  </td>
                  <td className="px-5">
                    <span className={STATUS_STYLES[t.status] ?? 'text-xs font-semibold tracking-wider uppercase text-[#64748B]'}>
                      {getStatusLabel(t.status)}
                    </span>
                  </td>
                  <td className="px-5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: PRIORITY_DOT_COLORS[t.priority] ?? '#94A3B8' }}
                      />
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#0F172A]">
                        {t.priority}
                      </span>
                    </span>
                  </td>
                  <td className="px-5">
                    {(() => {
                      const assignees = t.assignees && t.assignees.length > 0
                        ? t.assignees
                        : t.assignedTo ? [{ userId: t.assignedTo.id, user: t.assignedTo }] : [];
                      if (assignees.length === 0) return <span className="text-[13px] text-muted-foreground">Unassigned</span>;
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {assignees.slice(0, 3).map((a, i) => (
                              <div key={a.userId}
                                className="w-6 h-6 rounded-full bg-[hsl(var(--color-info))]/15 flex items-center justify-center border-2 border-card flex-shrink-0"
                                style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 10 - i }}
                                title={a.user.fullName}>
                                <span className="text-[10px] font-semibold text-[hsl(var(--color-info))]">{a.user.fullName.charAt(0)}</span>
                              </div>
                            ))}
                          </div>
                          <span className="text-[13px] text-foreground">
                            {assignees[0].user.fullName}
                            {assignees.length > 1 && (
                              <span className="text-muted-foreground font-medium"> +{assignees.length - 1}</span>
                            )}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-5">
                    {t.dueDate ? (
                      <span className={`text-[13px] ${isOverdue(t.dueDate, t.status) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {formatDate(t.dueDate)}
                      </span>
                    ) : <span className="text-[13px] text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <span className="text-[13px] text-muted-foreground">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[13px] text-foreground px-2">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedTickets.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-xl px-4 py-3 flex items-center gap-4 z-50 animate-slide-up">
          <div className="flex items-center gap-2 border-r border-border pr-4">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold">
              {selectedTickets.size}
            </span>
            <span className="text-[13px] font-medium text-muted-foreground">selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={bulkStatusSel}
              disabled={bulkActionLoad}
              onValueChange={async (status) => {
                setBulkActionLoad(true);
                try {
                  await ticketsApi.bulkUpdate(Array.from(selectedTickets), { status: status as any });
                  setSelectedTickets(new Set());
                  loadTickets();
                } catch { toast.error('Bulk action failed. Please try again.'); }
                finally { setBulkActionLoad(false); setBulkStatusSel(undefined); }
              }}
            >
              <SelectTrigger className="h-9 w-[150px] text-sm">
                <SelectValue placeholder="Set Status…" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={bulkPrioritySel}
              disabled={bulkActionLoad}
              onValueChange={async (priority) => {
                setBulkActionLoad(true);
                try {
                  await ticketsApi.bulkUpdate(Array.from(selectedTickets), { priority: priority as any });
                  setSelectedTickets(new Set());
                  loadTickets();
                } catch { toast.error('Bulk action failed. Please try again.'); }
                finally { setBulkActionLoad(false); setBulkPrioritySel(undefined); }
              }}
            >
              <SelectTrigger className="h-9 w-[140px] text-sm">
                <SelectValue placeholder="Set Priority…" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={bulkAssigneeSel}
              disabled={bulkActionLoad}
              onValueChange={async (assigneeId) => {
                setBulkActionLoad(true);
                try {
                  await ticketsApi.bulkUpdate(Array.from(selectedTickets), { assignedToId: assigneeId === '_unassigned' ? undefined : assigneeId } as any);
                  setSelectedTickets(new Set());
                  loadTickets();
                } catch { toast.error('Bulk action failed. Please try again.'); }
                finally { setBulkActionLoad(false); setBulkAssigneeSel(undefined); }
              }}
            >
              <SelectTrigger className="h-9 w-[150px] text-sm">
                <SelectValue placeholder="Assign to…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_unassigned">Unassigned</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedTickets(new Set())}
            className="ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Create Ticket Slide-over */}
      {showCreate && (
        <CreateTicketPanel
          projects={projects}
          users={users}
          teams={teams}
          sprints={sprints}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadTickets(); }}
        />
      )}
    </div>
  );
}

