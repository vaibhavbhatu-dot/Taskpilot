import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List, Columns3, X, ChevronLeft, ChevronRight, AlertCircle, Tag as TagIcon, Paperclip, Link as LinkIcon, ExternalLink, Check, Users, Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge, Button, Input, Textarea, Label, FormField } from '@/design-system';
import { ticketsApi, projectsApi, usersApi, sprintsApi, teamsApi } from '../api';
import { useAuthStore } from '../stores';
import type { Ticket, TicketPriority, Project, User, Sprint, Team } from '../types';
import { FilterBuilder, type FilterRow } from '../components/tickets/FilterBuilder';
import { exportTicketsToCSV, exportTicketsToPDF } from '../utils/export';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ClipboardList } from 'lucide-react';
import { STATUS_CONFIG, TICKET_STATUSES, getStatusLabel } from '../constants/ticketStatus';

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

// ─── Create Ticket Slide-over Panel ───────────────────────
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const formatFileSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

function CreateTicketPanel({ projects, users, teams, sprints, onClose, onCreated }: {
  projects: Project[]; users: User[]; teams: Team[]; sprints: Sprint[];
  onClose: () => void; onCreated: () => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [teamId, setTeamId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sprintId, setSprintId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Smart team filter: only show teams that contain at least one selected assignee
  const availableTeams = useMemo(() => {
    if (assigneeIds.length === 0) return teams;
    const selectedUsers = users.filter(u => assigneeIds.includes(u.id));
    const memberTeamIds = new Set(selectedUsers.map(u => u.teamId).filter(Boolean));
    return teams.filter(t => memberTeamIds.has(t.id));
  }, [assigneeIds, users, teams]);

  // Auto-clear team if it's no longer available after assignee change
  useEffect(() => {
    if (teamId && !availableTeams.find(t => t.id === teamId)) setTeamId('');
    if (availableTeams.length === 1 && assigneeIds.length > 0) setTeamId(availableTeams[0].id);
  }, [availableTeams]);

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  function toggleAssignee(uid: string) {
    setAssigneeIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  }

  function addLabel(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      if (!labels.includes(labelInput.trim())) setLabels([...labels, labelInput.trim()]);
      setLabelInput('');
    }
  }

  function addLink(e?: React.KeyboardEvent) {
    if (e && e.key !== 'Enter') return;
    e?.preventDefault();
    const url = linkInput.trim();
    if (!url) return;
    const full = url.startsWith('http') ? url : `https://${url}`;
    if (!links.includes(full)) setLinks([...links, full]);
    setLinkInput('');
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    setPendingFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existing.has(f.name))];
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }

  const activeSprints = sprints.filter(s => s.status === 'PLANNED' || s.status === 'ACTIVE');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await ticketsApi.create({
        title, projectId, type: type as any, priority: priority as any,
        description: description || undefined,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
        assignedToId: assigneeIds[0] || undefined,
        teamId: teamId || undefined,
        dueDate: dueDate || undefined,
        labels,
        links,
      } as any);
      const ticketId = res.data.id;
      if (pendingFiles.length > 0) {
        await Promise.allSettled(pendingFiles.map(f => ticketsApi.uploadAttachment(ticketId, f)));
      }
      setToast('Ticket created successfully');
      setTimeout(() => onCreated(), 700);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[580px] bg-card border-l border-border flex flex-col animate-slide-in-right shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[18px] font-semibold text-foreground">Create Ticket</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {toast && (
            <div className="bg-[hsl(var(--color-success))]/10 border border-[hsl(var(--color-success))]/20 text-[hsl(var(--color-success))] text-sm px-4 py-3 rounded-lg">
              {toast}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Project */}
          <FormField label="Project" required>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input" required>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
            </select>
          </FormField>

          {/* Title */}
          <FormField label="Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the ticket"
              required
              autoFocus
            />
          </FormField>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="input">
                <option value="TASK">🔵 Task</option>
                <option value="BUG">🔴 Bug</option>
                <option value="FEATURE">🟢 Feature</option>
                <option value="IMPROVEMENT">🟡 Improvement</option>
              </select>
            </FormField>
            <FormField label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              rows={4}
            />
          </FormField>

          {/* Assignees — multi-select (custom — no FormField wrapper) */}
          <div className="relative flex flex-col gap-1.5">
            <Label>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Assignees</span>
            </Label>
            {assigneeIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assigneeIds.map(id => {
                  const u = users.find(x => x.id === id);
                  if (!u) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[hsl(var(--color-info))]/15 text-[hsl(var(--color-info))] text-[12px] font-medium rounded-full">
                      <span className="w-4 h-4 rounded-full bg-[hsl(var(--color-info))] text-white flex items-center justify-center text-[9px] font-bold">{getInitials(u.fullName)}</span>
                      {u.fullName.split(' ')[0]}
                      <button type="button" onClick={() => toggleAssignee(id)} className="hover:text-destructive leading-none">×</button>
                    </span>
                  );
                })}
              </div>
            )}
            <button type="button" onClick={() => setShowAssigneeDropdown(v => !v)}
              className="input text-left flex items-center justify-between text-[14px]">
              <span className={assigneeIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                {assigneeIds.length === 0 ? 'Search & add assignees...' : `${assigneeIds.length} assignee${assigneeIds.length > 1 ? 's' : ''} selected`}
              </span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </button>
            {showAssigneeDropdown && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 border-b border-border">
                  <Input
                    autoFocus
                    value={assigneeSearch}
                    onChange={e => setAssigneeSearch(e.target.value)}
                    placeholder="Search members..."
                    className="h-8 text-[13px]"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-3 text-[13px] text-muted-foreground">No members found</p>
                  ) : filteredUsers.map(u => (
                    <button key={u.id} type="button" onClick={() => toggleAssignee(u.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[hsl(var(--color-info))]/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[hsl(var(--color-info))]">{getInitials(u.fullName)}</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{u.fullName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.designation || u.role}</p>
                      </div>
                      {assigneeIds.includes(u.id) && <Check className="w-4 h-4 text-[hsl(var(--color-info))] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-border">
                  <button type="button" onClick={() => { setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                    className="w-full text-[12px] text-muted-foreground hover:text-foreground py-1">Done</button>
                </div>
              </div>
            )}
          </div>

          {/* Team */}
          <FormField label="Team">
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="input">
              <option value="">No team</option>
              {availableTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {assigneeIds.length > 0 && availableTeams.length < teams.length && (
              <p className="text-[11px] text-muted-foreground mt-1">Showing {availableTeams.length} team{availableTeams.length !== 1 ? 's' : ''} matching selected assignees</p>
            )}
          </FormField>

          {/* Due Date */}
          <FormField label="Due Date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>

          {/* Sprint */}
          <FormField label="Sprint">
            <select value={sprintId} onChange={(e) => setSprintId(e.target.value)} className="input">
              <option value="">No sprint</option>
              {activeSprints.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
            </select>
          </FormField>

          {/* Labels */}
          <div className="flex flex-col gap-1.5">
            <Label>Labels</Label>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[hsl(var(--color-info))]/15 text-[hsl(var(--color-info))] text-[12px] font-medium rounded">
                    <TagIcon className="w-3 h-3" />{l}
                    <button type="button" onClick={() => setLabels(labels.filter(x => x !== l))} className="ml-0.5 hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            )}
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={addLabel}
              placeholder="Type and press Enter to add a label"
            />
          </div>

          {/* Links */}
          <div className="flex flex-col gap-1.5">
            <Label>
              <span className="flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> Links</span>
            </Label>
            {links.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {links.map(l => (
                  <div key={l} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg group">
                    <ExternalLink className="w-3.5 h-3.5 text-[hsl(var(--color-info))] flex-shrink-0" />
                    <a href={l} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-[12px] text-[hsl(var(--color-info))] truncate hover:underline">{l}</a>
                    <button type="button" onClick={() => setLinks(links.filter(x => x !== l))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-[16px] leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={addLink}
                placeholder="https://... (Enter to add)"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addLink()} disabled={!linkInput.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-1.5">
            <Label>
              <span className="flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> Attachments</span>
            </Label>
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-[hsl(var(--color-info))] hover:bg-[hsl(var(--color-info))]/5 transition-colors"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-[13px] text-muted-foreground">
                Drop files here or <span className="text-[hsl(var(--color-info))] font-medium">click to browse</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Max 10 MB per file</p>
            </div>
            <input ref={fileInputRef} type="file" multiple onChange={e => handleFileSelect(e.target.files)} className="hidden" />
            {pendingFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg group">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-[12px] text-foreground truncate">{f.name}</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatFileSize(f.size)}</span>
                    <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-[16px] leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/50 flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={submitting}
            disabled={!title || !projectId}
            onClick={handleSubmit as any}
          >
            Create Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
