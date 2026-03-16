import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Calendar as CalendarIcon, Target, CheckCircle, Columns3, List } from 'lucide-react';
import { sprintsApi, ticketsApi } from '../api';
import type { Sprint, Ticket, TicketStatus, BurndownData } from '../types';

const COLUMNS: { id: TicketStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'IN_REVIEW', title: 'In Review' },
  { id: 'DONE', title: 'Done' },
  { id: 'BLOCKED', title: 'Blocked' },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-gray-400',
};

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function ActiveSprintPage() {
  const navigate = useNavigate();
  
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [burndown, setBurndown] = useState<BurndownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  
  // Complete Sprint Modal
  const [showComplete, setShowComplete] = useState(false);
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
        const [ticketsRes, burndownRes] = await Promise.all([
          ticketsApi.list({ sprintId: active.id, limit: '500' }),
          sprintsApi.getBurndown(active.id).catch(() => ({ data: null }))
        ]);
        setTickets(ticketsRes.data.tickets);
        setBurndown(burndownRes.data);
      }
    } catch (error) {
      console.error('Failed to load active sprint:', error);
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
      // Reload burndown slightly delayed if a ticket goes to DONE
      setTimeout(() => {
        if (activeSprint) {
          sprintsApi.getBurndown(activeSprint.id).then(r => setBurndown(r.data)).catch();
        }
      }, 500);
    } catch {
      loadData(); // Revert on failure
    }
  };

  const completedTickets = tickets.filter(t => t.status === 'DONE');
  const incompleteTickets = tickets.filter(t => t.status !== 'DONE');

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
      setShowComplete(false);
      navigate('/sprints/reports');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to complete sprint');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h2 className="text-[24px] font-semibold text-[#0F172A] mb-2">No Active Sprint</h2>
        <p className="text-[15px] text-[#64748B] mb-8 max-w-sm">
          You don't have any sprints currently running. Head over to Sprint Planning to start one.
        </p>
        <button
          onClick={() => navigate('/sprints/planning')}
          className="h-10 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium rounded-lg transition-colors"
        >
          Go to Sprint Planning
        </button>
      </div>
    );
  }

  // Pre-calculate days left based on burndown
  // If burndown data is unavailable (null), just show generic text
  const daysRemaining = burndown ? Math.max(0, burndown.totalDays - burndown.elapsedDays) : null;

  return (
    <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col relative">
      
      {/* Sprint Info Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-5 flex-shrink-0 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[18px] font-semibold text-[#0F172A]">{activeSprint.name}</h1>
            {activeSprint.startDate && activeSprint.endDate && (
              <span className="text-[14px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                {new Date(activeSprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(activeSprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {daysRemaining !== null && (
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${daysRemaining <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-[#DBEAFE] text-[#2563EB]'}`}>
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                </span>
              </div>
            )}
          </div>
          {activeSprint.goal && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#475569] mt-2">
              <Target className="w-4 h-4 text-[#64748B]" />
              <span className="font-medium mr-1 text-[#0F172A]">Goal:</span>
              {activeSprint.goal}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComplete(true)}
          className="flex items-center gap-2 h-9 px-4 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-[13px] font-medium rounded-lg transition-colors"
        >
          <CheckCircle className="w-4 h-4 text-green-500" />
          Complete Sprint
        </button>
      </div>

      {/* KPI Row */}
      {burndown && (
        <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
            <p className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">Committed</p>
            <p className="text-[24px] font-semibold text-[#0F172A]">{burndown.totalPoints}</p>
          </div>
          <div className="bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl p-4">
            <p className="text-[12px] font-semibold text-[#065F46] uppercase tracking-wider mb-1">Completed</p>
            <p className="text-[24px] font-semibold text-[#047857]">{burndown.completedPoints}</p>
          </div>
          <div className="bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl p-4">
            <p className="text-[12px] font-semibold text-[#1E3A8A] uppercase tracking-wider mb-1">Remaining</p>
            <p className="text-[24px] font-semibold text-[#1D4ED8]">{burndown.remainingPoints}</p>
          </div>
          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4">
            <p className="text-[12px] font-semibold text-[#92400E] uppercase tracking-wider mb-1">Progress</p>
            <p className="text-[24px] font-semibold text-[#B45309]">
              {burndown.totalPoints > 0 ? Math.round((burndown.completedPoints / burndown.totalPoints) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-end mb-4 flex-shrink-0">
        <div className="flex bg-[#F1F5F9] rounded-lg p-0.5 border border-[#E2E8F0]">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              viewMode === 'board' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Columns3 className="w-4 h-4" /> Board
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0 bg-white border border-[#E2E8F0] rounded-xl shadow-sm">
        {viewMode === 'board' ? (
          <div className="h-full overflow-auto p-4 flex gap-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              {COLUMNS.map(col => {
                const colTickets = tickets.filter(t => t.status === col.id);
                return (
                  <div key={col.id} className="w-[280px] flex-shrink-0 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">{col.title}</h3>
                      <span className="text-[12px] font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                        {colTickets.length}
                      </span>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[150px] p-2 rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? 'bg-[#F1F5F9] border-2 border-dashed border-[#CBD5E1]' : 'bg-[#F8FAFC] border-2 border-transparent'
                          }`}
                        >
                          {colTickets.map((ticket, index) => (
                            <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                                  className={`bg-white border p-[14px] rounded-[10px] mb-2 cursor-pointer transition-all ${
                                    snapshot.isDragging 
                                      ? 'border-[#2563EB] shadow-lg rotate-1 scale-105 opacity-90' 
                                      : 'border-[#E2E8F0] shadow-sm hover:border-[#94A3B8]'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-[11px] font-mono font-medium text-[#64748B]">{ticket.ticketNumber}</span>
                                    <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[ticket.priority]}`} title={ticket.priority} />
                                  </div>
                                  <p className="text-[14px] font-medium text-[#0F172A] leading-snug mb-3">
                                    {ticket.title}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    {ticket.assignedTo ? (
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-[24px] h-[24px] rounded-full bg-[#DBEAFE] flex items-center justify-center border border-white relative z-10" title={ticket.assignedTo.fullName}>
                                          <span className="text-[9px] font-bold text-[#2563EB]">{getInitials(ticket.assignedTo.fullName)}</span>
                                        </div>
                                        <span className="text-[12px] text-[#64748B] font-medium max-w-[100px] truncate">{ticket.assignedTo.fullName.split(' ')[0]}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[12px] text-[#94A3B8] font-medium">Unassigned</span>
                                    )}
                                    {ticket.storyPoints && (
                                      <span className="h-[20px] px-1.5 flex items-center justify-center bg-[#F1F5F9] text-[#64748B] text-[11px] font-semibold rounded">
                                        {ticket.storyPoints}
                                      </span>
                                    )}
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
              <thead className="sticky top-0 bg-[#F8FAFC] z-10 border-b border-[#E2E8F0] shadow-sm shadow-[#F8FAFC]">
                <tr>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider w-24">Ticket #</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider w-40">Assignee</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider w-32">Status</th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider w-24 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-[#F8FAFC] cursor-pointer transition-colors" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <td className="px-5 py-3">
                      <span className="text-[13px] font-mono text-primary-600 font-medium">{ticket.ticketNumber}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[ticket.priority]}`} />
                        <span className="text-[14px] font-medium text-[#0F172A]">{ticket.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                           <div className="w-[24px] h-[24px] rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-[#2563EB]">{getInitials(ticket.assignedTo.fullName)}</span>
                          </div>
                          <span className="text-[13px] text-[#475569]">{ticket.assignedTo.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#94A3B8] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] whitespace-nowrap">
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[13px] font-medium text-[#64748B]">{ticket.storyPoints || '—'}</span>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[#94A3B8] text-[14px]">
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
      {showComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[18px] font-semibold text-[#0F172A]">Complete {activeSprint.name}</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-5 mb-6 flex divide-x divide-[#E2E8F0]">
                <div className="flex-1 text-center px-4">
                  <p className="text-[32px] font-semibold text-[#10B981] leading-none mb-1">{completedTickets.length}</p>
                  <p className="text-[13px] font-medium text-[#64748B]">Completed issues</p>
                </div>
                <div className="flex-1 text-center px-4">
                  <p className="text-[32px] font-semibold text-[#F59E0B] leading-none mb-1">{incompleteTickets.length}</p>
                  <p className="text-[13px] font-medium text-[#64748B]">Incomplete issues</p>
                </div>
              </div>

              {incompleteTickets.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[14px] font-medium text-[#0F172A]">What should happen to the incomplete issues?</p>
                  
                  <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${incompleteAction === 'next' ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="incompleteAction" 
                        checked={incompleteAction === 'next'} 
                        onChange={() => setIncompleteAction('next')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]" 
                      />
                      <div>
                        <p className="text-[14px] font-semibold text-[#0F172A]">Move to next sprint</p>
                        <p className="text-[13px] text-[#64748B]">A new sprint will be created automatically</p>
                      </div>
                    </div>
                  </label>

                  <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${incompleteAction === 'backlog' ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="incompleteAction" 
                        checked={incompleteAction === 'backlog'} 
                        onChange={() => setIncompleteAction('backlog')}
                        className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]" 
                      />
                      <div>
                        <p className="text-[14px] font-semibold text-[#0F172A]">Move to backlog</p>
                        <p className="text-[13px] text-[#64748B]">Issues will be returned to the general backlog</p>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {incompleteTickets.length === 0 && (
                <div className="flex items-center gap-2 text-[#059669] bg-[#D1FAE5] p-4 rounded-lg">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-[14px] font-medium">All issues are complete! Great job!</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3 bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setShowComplete(false)}
                className="h-10 px-4 text-[#64748B] font-medium text-[14px] hover:text-[#0F172A] transition-colors"
                disabled={completing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSprint}
                disabled={completing}
                className="h-10 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] rounded-lg transition-colors disabled:opacity-50"
              >
                {completing ? 'Completing...' : 'Complete Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
