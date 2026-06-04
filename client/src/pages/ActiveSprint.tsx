import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Calendar as CalendarIcon, Target, CheckCircle, CheckCircle2, Columns3, List } from 'lucide-react';
import { sprintsApi, ticketsApi } from '../api';
import type { Sprint, Ticket, TicketStatus } from '../types';
import { STATUS_CONFIG, TICKET_STATUSES, getStatusLabel } from '../constants/ticketStatus';
import { toast } from 'sonner';
import { getInitials, Spinner, Button, Modal, useModal } from '@/design-system';
import { PRIORITY_DOT_COLORS } from '../constants/ticketStyles';

// Active sprint board excludes BACKLOG column
const COLUMNS: { id: TicketStatus; title: string }[] = TICKET_STATUSES
  .filter(s => s !== 'BACKLOG')
  .map(s => ({ id: s, title: STATUS_CONFIG[s].label }));


export function ActiveSprintPage() {
  const navigate = useNavigate();

  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Complete Sprint Modal
  const completeSprintModal = useModal();
  const [completing, setCompleting] = useState(false);
  const [incompleteAction, setIncompleteAction] = useState<'next' | 'backlog'>('next');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const sprintRes = await sprintsApi.list({ status: 'ACTIVE' });
      const active = sprintRes.data[0] || null;
      setActiveSprint(active);

      if (active) {
        const ticketsRes = await ticketsApi.list({ sprintId: active.id, limit: '500' });
        setTickets(ticketsRes.data.tickets);
      }
    } catch {
      toast.error('Failed to load active sprint. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const newStatus = destination.droppableId as TicketStatus;

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await ticketsApi.update(draggableId, { status: newStatus });
    } catch {
      loadData(); // Revert on failure
    }
  };

  const completedTickets = tickets.filter(t => t.status === 'LIVE' || t.status === 'NOT_REQUIRED');
  const incompleteTickets = tickets.filter(t => t.status !== 'LIVE' && t.status !== 'NOT_REQUIRED');

  const handleCompleteSprint = async () => {
    if (!activeSprint || completing) return;
    setCompleting(true);
    try {
      let nextSprintId: string | undefined = undefined;

      // If moving to next sprint, create it first
      if (incompleteAction === 'next' && incompleteTickets.length > 0) {
        const numPattern = /\d+/;
        const match = activeSprint.name.match(numPattern);
        let nextNum = 1;
        let baseName = activeSprint.name;
        if (match) {
          nextNum = parseInt(match[0], 10) + 1;
          baseName = activeSprint.name.replace(numPattern, nextNum.toString());
        } else {
          baseName = `${activeSprint.name} 2`;
        }

        const newSprintRes = await sprintsApi.create({
          name: baseName,
          projectId: activeSprint.projectId,
          status: 'PLANNED'
        });
        nextSprintId = newSprintRes.data.id;
      }

      await sprintsApi.complete(activeSprint.id, nextSprintId);
      completeSprintModal.close();
      navigate('/sprints/reports');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete sprint');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h2 className="text-[24px] font-semibold text-foreground mb-2">No Active Sprint</h2>
        <p className="text-[15px] text-muted-foreground mb-8 max-w-sm">
          You don't have any sprints currently running. Head over to Sprint Planning to start one.
        </p>
        <button
          onClick={() => navigate('/sprints/planning')}
          className="h-10 px-6 bg-primary hover:bg-primary/90 text-white text-[14px] font-medium rounded-lg transition-colors"
        >
          Go to Sprint Planning
        </button>
      </div>
    );
  }

  const daysRemaining = activeSprint?.endDate ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col relative">

      {/* Sprint Info Bar */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5 flex-shrink-0 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[18px] font-semibold text-foreground">{activeSprint.name}</h1>
            {activeSprint.startDate && activeSprint.endDate && (
              <span className="text-[14px] text-muted-foreground bg-muted px-2 py-0.5 rounded flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                {new Date(activeSprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(activeSprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {daysRemaining !== null && (
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${daysRemaining <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-primary/15 text-primary'}`}>
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                </span>
              </div>
            )}
          </div>
          {activeSprint.goal && (
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium mr-1 text-foreground">Goal:</span>
              {activeSprint.goal}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<CheckCircle className="w-4 h-4 text-green-500" />}
          onClick={() => completeSprintModal.open()}
        >
          Complete Sprint
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <div className="bg-muted/50 border border-border rounded-xl p-4">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-[24px] font-semibold text-foreground">{tickets.length}</p>
        </div>
        <div className="bg-[hsl(var(--color-success))]/15 border border-[hsl(var(--color-success))]/30 rounded-xl p-4">
          <p className="text-[12px] font-semibold text-[hsl(var(--color-success))] uppercase tracking-wider mb-1">Done</p>
          <p className="text-[24px] font-semibold text-[hsl(var(--color-success))]">{completedTickets.length}</p>
        </div>
        <div className="bg-primary/15 border border-primary/30 rounded-xl p-4">
          <p className="text-[12px] font-semibold text-[hsl(var(--color-info))] uppercase tracking-wider mb-1">Remaining</p>
          <p className="text-[24px] font-semibold text-primary">{incompleteTickets.length}</p>
        </div>
        <div className="bg-[hsl(var(--color-warning))]/15 border border-[hsl(var(--color-warning))]/30 rounded-xl p-4">
          <p className="text-[12px] font-semibold text-[hsl(var(--color-warning))] uppercase tracking-wider mb-1">Progress</p>
          <p className="text-[24px] font-semibold text-[hsl(var(--color-warning))]">
            {tickets.length > 0 ? Math.round((completedTickets.length / tickets.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-end mb-4 flex-shrink-0">
        <div className="flex bg-muted rounded-lg p-0.5 border border-border">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              viewMode === 'board' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Columns3 className="w-4 h-4" /> Board
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0 bg-card border border-border rounded-xl shadow-sm">
        {viewMode === 'board' ? (
          <div className="h-full overflow-auto p-4 flex gap-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <DragDropContext onDragEnd={handleDragEnd}>
              {COLUMNS.map(col => {
                const colTickets = tickets.filter(t => t.status === col.id);
                const isDeployedCol = col.id === 'LIVE';
                return (
                  <div key={col.id} className="w-[260px] flex-shrink-0 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{col.title}</h3>
                      <span className="text-[12px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {colTickets.length}
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[150px] p-2 rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? 'bg-muted border-2 border-dashed border-border' : 'bg-muted/50 border-2 border-transparent'
                          }`}
                        >
                          {colTickets.map((ticket, index) => (
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
                                      ? 'border-primary shadow-lg rotate-1 scale-105 opacity-90'
                                      : 'border-border shadow-sm hover:border-muted-foreground'
                                  }`}
                                >
                                  {isDeployedCol && (
                                    <CheckCircle2 className="absolute top-2 right-2 w-[14px] h-[14px] text-[hsl(var(--color-success))]" />
                                  )}
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-[11px] font-mono font-medium text-muted-foreground">{ticket.ticketNumber}</span>
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_DOT_COLORS[ticket.priority] ?? '#94A3B8' }} />
                                      <span className="text-xs font-semibold tracking-wider uppercase text-[#0F172A]">{ticket.priority}</span>
                                    </span>
                                  </div>
                                  <p className="text-[14px] font-medium text-foreground leading-snug mb-3">
                                    {ticket.title}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    {(() => {
                                      const assignees = ticket.assignees && ticket.assignees.length > 0
                                        ? ticket.assignees
                                        : ticket.assignedTo ? [{ userId: ticket.assignedTo.id, user: ticket.assignedTo }] : [];
                                      return assignees.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                          {assignees.slice(0, 3).map((a, i) => (
                                            <div key={a.userId} className="w-[24px] h-[24px] rounded-full bg-primary/15 flex items-center justify-center border-2 border-white" style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 10 - i }} title={a.user.fullName}>
                                              <span className="text-[9px] font-bold text-primary">{getInitials(a.user.fullName)}</span>
                                            </div>
                                          ))}
                                          <span className="text-[12px] text-muted-foreground font-medium ml-1 truncate max-w-[80px]">
                                            {assignees.length === 1 ? assignees[0].user.fullName.split(' ')[0] : `${assignees.length} people`}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[12px] text-muted-foreground font-medium">Unassigned</span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </DragDropContext>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-muted/50 z-10 border-b border-border shadow-sm shadow-muted/50">
                <tr>
                  <th className="px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Ticket #</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider w-40">Assignee</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider w-48">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <td className="px-5 py-3">
                      <span className="text-[13px] font-mono text-[hsl(var(--color-info))] font-medium">{ticket.ticketNumber}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_DOT_COLORS[ticket.priority] ?? '#94A3B8' }} />
                          <span className="text-xs font-semibold tracking-wider uppercase text-[#0F172A]">{ticket.priority}</span>
                        </span>
                        <span className="text-[14px] font-medium text-foreground">{ticket.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const assignees = ticket.assignees && ticket.assignees.length > 0
                          ? ticket.assignees
                          : ticket.assignedTo ? [{ userId: ticket.assignedTo.id, user: ticket.assignedTo }] : [];
                        if (assignees.length === 0) return <span className="text-[13px] text-muted-foreground italic">Unassigned</span>;
                        return (
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {assignees.slice(0, 3).map((a, i) => (
                                <div key={a.userId} className="w-[24px] h-[24px] rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 border-2 border-white" style={{ marginLeft: i > 0 ? '-6px' : 0 }} title={a.user.fullName}>
                                  <span className="text-[9px] font-bold text-primary">{getInitials(a.user.fullName)}</span>
                                </div>
                              ))}
                            </div>
                            <span className="text-[13px] text-muted-foreground">
                              {assignees.length === 1 ? assignees[0].user.fullName : `${assignees.length} assignees`}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[12px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: STATUS_CONFIG[ticket.status]?.bg, color: STATUS_CONFIG[ticket.status]?.text }}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground text-[14px]">
                      No tickets in this sprint yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Sprint Modal */}
      <Modal
        {...completeSprintModal.props}
        title={`Complete ${activeSprint.name}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button type="button" onClick={() => completeSprintModal.close()} disabled={completing}
              className="h-10 px-4 text-muted-foreground font-medium text-[14px] hover:text-foreground transition-colors">
              Cancel
            </button>
            <Button onClick={handleCompleteSprint} loading={completing}>
              Complete Sprint
            </Button>
          </div>
        }
      >
        <div className="bg-muted/50 border border-border rounded-lg p-5 mb-6 flex divide-x divide-border">
          <div className="flex-1 text-center px-4">
            <p className="text-[32px] font-semibold text-[hsl(var(--color-success))] leading-none mb-1">{completedTickets.length}</p>
            <p className="text-[13px] font-medium text-muted-foreground">Done</p>
          </div>
          <div className="flex-1 text-center px-4">
            <p className="text-[32px] font-semibold text-[hsl(var(--color-warning))] leading-none mb-1">{incompleteTickets.length}</p>
            <p className="text-[13px] font-medium text-muted-foreground">Incomplete issues</p>
          </div>
        </div>

        {incompleteTickets.length > 0 && (
          <div className="space-y-4">
            <p className="text-[14px] font-medium text-foreground">What should happen to the incomplete issues?</p>
            <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${incompleteAction === 'next' ? 'border-primary bg-primary/10' : 'border-border hover:border-border'}`}>
              <div className="flex items-center gap-3">
                <input type="radio" name="incompleteAction" checked={incompleteAction === 'next'} onChange={() => setIncompleteAction('next')} className="w-4 h-4 text-primary focus:ring-primary" />
                <div>
                  <p className="text-[14px] font-semibold text-foreground">Move to next sprint</p>
                  <p className="text-[13px] text-muted-foreground">A new sprint will be created automatically</p>
                </div>
              </div>
            </label>
            <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${incompleteAction === 'backlog' ? 'border-primary bg-primary/10' : 'border-border hover:border-border'}`}>
              <div className="flex items-center gap-3">
                <input type="radio" name="incompleteAction" checked={incompleteAction === 'backlog'} onChange={() => setIncompleteAction('backlog')} className="w-4 h-4 text-primary focus:ring-primary" />
                <div>
                  <p className="text-[14px] font-semibold text-foreground">Move to backlog</p>
                  <p className="text-[13px] text-muted-foreground">Issues will be returned to the general backlog</p>
                </div>
              </div>
            </label>
          </div>
        )}

        {incompleteTickets.length === 0 && (
          <div className="flex items-center gap-2 text-[hsl(var(--color-success))] bg-[hsl(var(--color-success))]/15 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-[14px] font-medium">All issues are deployed! Great job!</p>
          </div>
        )}
      </Modal>

    </div>
  );
}
