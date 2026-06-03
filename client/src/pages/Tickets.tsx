import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List, Columns3, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge, Button } from '@/design-system';
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

type BadgeVariant = 'info' | 'warning' | 'success' | 'secondary' | 'outline' | 'error' | 'default';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  BACKLOG:        'outline',
  REQUIREMENTS:   'info',
  DESIGN:         'info',
  HTML:           'secondary',
  ON_DEVELOPMENT: 'warning',
  QA:             'info',
  BUGS:           'error',
  ENHANCEMENT:    'secondary',
  UAT:            'warning',
  LIVE:           'success',
  NOT_REQUIRED:   'secondary',
};

const PRIORITY_BADGE_VARIANT: Record<string, BadgeVariant> = {
  CRITICAL: 'error',
  HIGH:     'warning',
  MEDIUM:   'secondary',
  LOW:      'outline',
};


const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isOverdue = (d: string, status: string) =>
  new Date(d) < new Date() && status !== 'LIVE';

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title={isAdmin ? 'All Tickets' : 'My Tickets'} />
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-card text-foreground shadow-sm">
              <List className="w-4 h-4" /> List
            </button>
            <button
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
                  <EmptyState
                    icon={<ClipboardList className="w-12 h-12" />}
                    title="No tickets yet"
                    description="Create your first ticket to get started."
                    action={{ label: 'Create Ticket', onClick: () => setShowCreate(true) }}
                  />
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
                    <Badge variant={STATUS_BADGE_VARIANT[t.status] ?? 'secondary'} size="sm">
                      {getStatusLabel(t.status)}
                    </Badge>
                  </td>
                  <td className="px-5">
                    <Badge variant={PRIORITY_BADGE_VARIANT[t.priority] ?? 'secondary'} size="sm">
                      {t.priority}
                    </Badge>
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
            <select
              className="bg-muted border border-border text-foreground text-[13px] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={async (e) => {
                const status = e.target.value;
                if (!status) return;
                setBulkActionLoad(true);
                try {
                  await ticketsApi.bulkUpdate(Array.from(selectedTickets), { status: status as any });
                  setSelectedTickets(new Set());
                  loadTickets();
                } catch (err) { console.error('Bulk update error', err); }
                finally { setBulkActionLoad(false); e.target.value = ''; }
              }}
              disabled={bulkActionLoad}
            >
              <option value="">Set Status...</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>

            <select
              className="bg-muted border border-border text-foreground text-[13px] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={async (e) => {
                const priority = e.target.value;
                if (!priority) return;
                setBulkActionLoad(true);
                try {
                  await ticketsApi.bulkUpdate(Array.from(selectedTickets), { priority: priority as any });
                  setSelectedTickets(new Set());
                  loadTickets();
                } catch (err) { console.error('Bulk update error', err); }
                finally { setBulkActionLoad(false); e.target.value = ''; }
              }}
              disabled={bulkActionLoad}
            >
              <option value="">Set Priority...</option>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
              className="bg-muted border border-border text-foreground text-[13px] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={async (e) => {
                const assigneeId = e.target.value;
                if (assigneeId === undefined) return;
                setBulkActionLoad(true);
                try {
                  await ticketsApi.bulkUpdate(Array.from(selectedTickets), { assignedToId: assigneeId === 'unassigned' ? undefined : assigneeId } as any);
                  setSelectedTickets(new Set());
                  loadTickets();
                } catch (err) { console.error('Bulk update error', err); }
                finally { setBulkActionLoad(false); e.target.value = ''; }
              }}
              disabled={bulkActionLoad}
            >
              <option value="">Assign to...</option>
              <option value="unassigned">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
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

