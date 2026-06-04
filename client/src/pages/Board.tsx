import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { Columns3, List, CheckCircle2, Plus } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { ticketsApi, sprintsApi, usersApi, projectsApi, teamsApi } from '../api';
import type { Ticket, TicketStatus, Sprint, User, Project, Team } from '../types';
import { STATUS_CONFIG, TICKET_STATUSES, getStatusLabel } from '../constants/ticketStatus';
import { Button, getInitials, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';
import { isOverdue } from '@/lib/utils';
import { PRIORITY_DOT_COLORS } from '../constants/ticketStyles';
import { CreateTicketPanel } from '../components/tickets/CreateTicketPanel';

const COLUMNS: { id: TicketStatus; title: string }[] = TICKET_STATUSES.map(s => ({
  id: s,
  title: STATUS_CONFIG[s].label,
}));

// Semantic top-border color per column status
const COLUMN_TOP_BORDER_COLOR: Record<string, string> = {
  BACKLOG:        'hsl(var(--muted-foreground))',
  REQUIREMENTS:   'hsl(var(--color-info))',
  DESIGN:         'hsl(var(--color-info))',
  HTML:           'hsl(var(--color-info))',
  ON_DEVELOPMENT: 'hsl(var(--color-warning))',
  QA:             'hsl(var(--color-warning))',
  BUGS:           'hsl(var(--destructive))',
  ENHANCEMENT:    'hsl(var(--color-info))',
  UAT:            'hsl(var(--color-warning))',
  LIVE:           'hsl(var(--color-success))',
  NOT_REQUIRED:   'hsl(var(--muted-foreground))',
};

export function BoardPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Filters
  const [sprintFilter, setSprintFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [swimlaneBy, setSwimlaneBy] = useState<'NONE' | 'ASSIGNEE' | 'PRIORITY'>('NONE');

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [sprintFilter, assigneeFilter, typeFilter]);

  async function loadFilters() {
    try {
      const [sprintRes, userRes, projectRes, teamRes] = await Promise.all([
        sprintsApi.list().catch(() => ({ data: [] })),
        usersApi.list().catch(() => ({ data: [] })),
        projectsApi.list().catch(() => ({ data: [] })),
        teamsApi.list().catch(() => ({ data: [] })),
      ]);
      setSprints(sprintRes.data);
      setUsers(userRes.data);
      setProjects(projectRes.data);
      setTeams(teamRes.data);
    } catch { /* ignore */ }
  }

  async function loadTickets() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (sprintFilter) params.sprintId = sprintFilter;
      if (assigneeFilter) params.assignedToId = assigneeFilter;
      if (typeFilter) params.type = typeFilter;

      const { data } = await ticketsApi.list(params);
      setTickets(data.tickets);
    } catch {
      toast.error('Failed to load board. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Get strictly the column status, ignoring swimlane prefixes (e.g. "col-BACKLOG-user1" -> "BACKLOG")
    const destParts = destination.droppableId.split('-');
    // For swimlanes, droppableId is "col-STATUS_NAME-laneId". We need to extract the status.
    // Status names can contain underscores, so we reconstruct by removing 'col-' prefix and '-laneId' suffix
    let newStatus: TicketStatus;
    if (swimlaneBy !== 'NONE' && destParts[0] === 'col') {
      // Remove 'col-' prefix and last segment (lane id)
      const statusParts = destParts.slice(1, -1);
      newStatus = statusParts.join('-') as TicketStatus;
    } else {
      newStatus = destination.droppableId as TicketStatus;
    }

    const ticket = tickets.find(t => t.id === draggableId);
    if (!ticket) return;

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await ticketsApi.update(draggableId, { status: newStatus });
      toast.success(`${ticket.ticketNumber} moved to ${getStatusLabel(newStatus)}`);
    } catch {
      // Revert on error
      loadTickets();
    }
  };

  // Grouping logic for swimlanes
  const swimlanes = useMemo(() => {
    if (swimlaneBy === 'NONE') return [{ id: 'all', title: null, tickets }];

    if (swimlaneBy === 'ASSIGNEE') {
      const grouped = new Map<string, { id: string; title: React.ReactNode; tickets: Ticket[] }>();

      // Unassigned lane
      grouped.set('unassigned', {
        id: 'unassigned',
        title: <span className="font-semibold text-[15px] text-foreground">Unassigned</span>,
        tickets: tickets.filter(t => !t.assignedTo)
      });

      // User lanes
      users.forEach(u => {
        const userTickets = tickets.filter(t => t.assignedTo?.id === u.id);
        if (userTickets.length > 0) {
          grouped.set(u.id, {
            id: u.id,
            title: (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary">{getInitials(u.fullName)}</span>
                </div>
                <span className="font-semibold text-[15px] text-foreground">{u.fullName}</span>
              </div>
            ),
            tickets: userTickets
          });
        }
      });

      return Array.from(grouped.values()).filter(g => g.tickets.length > 0);
    }

    if (swimlaneBy === 'PRIORITY') {
      const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      return order.map(p => {
        const pTickets = tickets.filter(t => t.priority === p);
        if (pTickets.length === 0) return null;
        return {
          id: p,
          title: (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_DOT_COLORS[p] ?? '#94A3B8' }} />
                <span className="text-xs font-semibold tracking-wider uppercase text-[#0F172A]">{p}</span>
              </span>
              <span className="font-semibold text-[15px] text-foreground">{p}</span>
            </div>
          ),
          tickets: pTickets
        };
      }).filter(Boolean) as { id: string; title: React.ReactNode; tickets: Ticket[] }[];
    }

    return [{ id: 'all', title: null, tickets }];
  }, [tickets, swimlaneBy, users]);

  return (
    <div className="animate-fade-in h-[calc(100vh-140px)] flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <PageHeader title="Kanban Board" />
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tickets')}
              leftIcon={<List className="w-4 h-4" />}
              className="text-muted-foreground hover:text-foreground"
            >
              List
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Columns3 className="w-4 h-4" />}
              className="bg-card shadow-sm"
            >
              Board
            </Button>
          </div>
          <Button
            variant="default"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreate(true)}
          >
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-card border border-border rounded-xl flex-shrink-0">
        <Select value={sprintFilter || '_all'} onValueChange={(val) => setSprintFilter(val === '_all' ? '' : val)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Sprints</SelectItem>
            {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={assigneeFilter || '_all'} onValueChange={(val) => setAssigneeFilter(val === '_all' ? '' : val)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Assignees</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter || '_all'} onValueChange={(val) => setTypeFilter(val === '_all' ? '' : val)}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Types</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="FEATURE">Feature</SelectItem>
            <SelectItem value="TASK">Task</SelectItem>
            <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-muted-foreground font-medium">Swimlane:</span>
          <Select value={swimlaneBy} onValueChange={(val) => setSwimlaneBy(val as any)}>
            <SelectTrigger className="w-[120px] h-9 text-sm border-transparent bg-transparent hover:bg-card hover:border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">None</SelectItem>
              <SelectItem value="ASSIGNEE">Assignee</SelectItem>
              <SelectItem value="PRIORITY">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 overflow-auto">
          <div className="flex gap-4 min-w-max">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[260px] flex-shrink-0 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-6 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="flex-1 min-h-[150px] p-2 rounded-[12px] bg-muted/50 border border-border space-y-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="bg-card border border-border p-[14px] rounded-[10px] animate-pulse space-y-3">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="flex justify-between">
                        <div className="h-6 w-6 bg-muted rounded-full" />
                        <div className="h-4 w-8 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className={`flex flex-col min-w-max ${swimlaneBy !== 'NONE' ? 'space-y-6' : ''}`}>

              {/* Header row for columns when using swimlanes */}
              {swimlaneBy !== 'NONE' && (
                <div className="flex gap-4 sticky top-0 z-20 bg-muted/30 pb-2 pt-1 border-b border-border mb-4">
                  {COLUMNS.map(col => (
                    <div key={col.id} className="w-[260px] flex-shrink-0 px-2">
                      <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{col.title}</h3>
                    </div>
                  ))}
                </div>
              )}

              {swimlanes.map((lane) => (
                <div key={lane.id} className="flex flex-col">
                  {lane.title && (
                    <div className="sticky left-0 flex items-center mb-3">
                      {lane.title}
                    </div>
                  )}

                  <div className="flex gap-4">
                    {COLUMNS.map((column) => {
                      const colTickets = lane.tickets.filter(t => t.status === column.id);
                      const droppableId = swimlaneBy === 'NONE' ? column.id : `col-${column.id}-${lane.id}`;
                      const isDeployedCol = column.id === 'LIVE';

                      return (
                        <div key={column.id} className="w-[260px] flex-shrink-0 flex flex-col">
                          {swimlaneBy === 'NONE' && (
                            <div className="flex items-center gap-2 mb-3 px-1">
                              <h3 className="text-[14px] font-semibold text-foreground">{column.title}</h3>
                              <span className="text-[12px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {colTickets.length}
                              </span>
                            </div>
                          )}

                          <Droppable droppableId={droppableId}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 min-h-[150px] p-2 rounded-[12px] border-2 border-t-4 transition-colors ${
                                  snapshot.isDraggingOver
                                    ? 'bg-[hsl(var(--color-info))]/10 border-[hsl(var(--color-info))]/30'
                                    : 'bg-muted/50 border-border'
                                }`}
                                style={{
                                  borderTopColor: snapshot.isDraggingOver
                                    ? undefined
                                    : COLUMN_TOP_BORDER_COLOR[column.id],
                                }}
                              >
                                {colTickets.length === 0 && !snapshot.isDraggingOver ? (
                                  <div className="flex items-center justify-center h-full min-h-[120px] border-2 border-dashed border-border rounded-[10px]">
                                    <span className="text-[12px] text-muted-foreground">No tickets</span>
                                  </div>
                                ) : (
                                  colTickets.map((ticket, index) => (
                                    <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              navigate(`/tickets/${ticket.id}`);
                                            }
                                          }}
                                          className={`bg-card border p-[14px] rounded-[10px] mb-2 cursor-pointer transition-all relative ${
                                            snapshot.isDragging
                                              ? 'border-[hsl(var(--color-info))] shadow-lg rotate-1 scale-105 opacity-90'
                                              : 'border-border shadow-sm hover:border-muted-foreground'
                                          }`}
                                        >
                                          {/* Deployed checkmark */}
                                          {isDeployedCol && (
                                            <CheckCircle2 className="absolute top-2 right-2 w-[14px] h-[14px] text-[hsl(var(--color-success))]" />
                                          )}

                                          {/* Top row: ticket number + priority */}
                                          <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-mono font-medium text-muted-foreground">
                                              {ticket.ticketNumber}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                              <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ background: PRIORITY_DOT_COLORS[ticket.priority] ?? '#94A3B8' }}
                                              />
                                              <span className="text-xs font-semibold tracking-wider uppercase text-[#0F172A]">
                                                {ticket.priority}
                                              </span>
                                            </span>
                                          </div>

                                          {/* Title */}
                                          <p className="text-[14px] font-medium text-foreground leading-snug mb-3 line-clamp-2">
                                            {ticket.title}
                                          </p>

                                          {/* Bottom row: assignees + due date */}
                                          <div className="flex items-center justify-between">
                                            {(() => {
                                              const assignees = ticket.assignees && ticket.assignees.length > 0
                                                ? ticket.assignees
                                                : ticket.assignedTo ? [{ userId: ticket.assignedTo.id, user: ticket.assignedTo }] : [];
                                              return assignees.length > 0 ? (
                                                <div className="flex items-center">
                                                  {assignees.slice(0, 3).map((a, i) => (
                                                    <div
                                                      key={a.userId}
                                                      className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border-2 border-card"
                                                      style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 10 - i }}
                                                      title={a.user.fullName}
                                                    >
                                                      <span className="text-[9px] font-bold text-muted-foreground">
                                                        {getInitials(a.user.fullName)}
                                                      </span>
                                                    </div>
                                                  ))}
                                                  {assignees.length > 3 && (
                                                    <span className="text-[10px] text-muted-foreground ml-1">
                                                      +{assignees.length - 3}
                                                    </span>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="w-6 h-6 rounded-full bg-muted border border-border border-dashed" title="Unassigned" />
                                              );
                                            })()}

                                            <div className="flex items-center gap-2">
                                              {ticket.dueDate && (
                                                <span className={`text-[12px] font-medium ${isOverdue(ticket.dueDate, ticket.status) ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                  {new Date(ticket.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Create Ticket Panel */}
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
