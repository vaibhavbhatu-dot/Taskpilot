import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Search, Calendar as CalendarIcon, Play, Trash2, Rocket } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { ticketsApi, sprintsApi, usersApi, projectsApi } from '../api';
import type { Ticket, Sprint, User, Project } from '../types';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-gray-400',
};

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function SprintPlanningPage() {
  const navigate = useNavigate();
  
  const [backlogTickets, setBacklogTickets] = useState<Ticket[]>([]);
  const [plannedSprint, setPlannedSprint] = useState<Sprint | null>(null);
  const [sprintTickets, setSprintTickets] = useState<Ticket[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Filters for Backlog
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Create Form
  const [sprintName, setSprintName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goal, setGoal] = useState('');
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadData();
  }, [priorityFilter, typeFilter, assigneeFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [ticketsRes, sprintsRes, usersRes, projsRes] = await Promise.all([
        ticketsApi.list({ status: 'BACKLOG', limit: '500' }),
        sprintsApi.list({ status: 'PLANNED' }),
        usersApi.list().catch(() => ({ data: [] })),
        projectsApi.list().catch(() => ({ data: [] }))
      ]);

      setUsers(usersRes.data);
      setProjects(projsRes.data);
      if (projsRes.data.length > 0 && !projectId) {
        setProjectId(projsRes.data[0].id);
      }

      // Filter backlog tickets manually for priority/type/assignee since search isn't in API out of box
      let filteredBacklog = ticketsRes.data.tickets;
      if (priorityFilter) filteredBacklog = filteredBacklog.filter(t => t.priority === priorityFilter);
      if (typeFilter) filteredBacklog = filteredBacklog.filter(t => t.type === typeFilter);
      if (assigneeFilter) filteredBacklog = filteredBacklog.filter(t => t.assignedToId === assigneeFilter);
      
      const planned = sprintsRes.data[0] || null;
      setPlannedSprint(planned);

      if (planned) {
        // Fetch tickets for this sprint
        const sprintDetailRes = await sprintsApi.get(planned.id);
        const st = sprintDetailRes.data.sprintTickets || [];
        const sprintTix = st.map(s => s.ticket!).filter(Boolean);
        setSprintTickets(sprintTix);
        
        // Remove sprint tickets from backlog view just in case they overlap
        const sprintTixIds = new Set(sprintTix.map(t => t.id));
        setBacklogTickets(filteredBacklog.filter(t => !sprintTixIds.has(t.id)));
      } else {
        setSprintTickets([]);
        setBacklogTickets(filteredBacklog);
      }

    } catch (error) {
      console.error('Failed to load planning data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName || !projectId) return;
    setCreating(true);
    try {
      await sprintsApi.create({
        name: sprintName,
        projectId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        goal: goal || undefined,
        status: 'PLANNED'
      });
      setSprintName('');
      setStartDate('');
      setEndDate('');
      setGoal('');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create sprint');
    } finally {
      setCreating(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return; // Reordering not strictly needed for this view

    const isToSprint = destination.droppableId === 'sprint-list';
    
    // Optimistic UI update
    if (isToSprint) {
      const ticket = backlogTickets.find(t => t.id === draggableId);
      if (ticket) {
        setBacklogTickets(prev => prev.filter(t => t.id !== draggableId));
        setSprintTickets(prev => [...prev, ticket]);
        try {
          await sprintsApi.addTickets(plannedSprint!.id, [ticket.id]);
        } catch {
          loadData(); // Revert on failure
        }
      }
    } else {
      const ticket = sprintTickets.find(t => t.id === draggableId);
      if (ticket) {
        setSprintTickets(prev => prev.filter(t => t.id !== draggableId));
        setBacklogTickets(prev => [ticket, ...prev]);
        try {
          await sprintsApi.removeTicket(plannedSprint!.id, ticket.id);
        } catch {
          loadData(); // Revert on failure
        }
      }
    }
  };

  const handleRemoveFromSprint = async (ticketId: string) => {
    if (!plannedSprint) return;
    const ticket = sprintTickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    setSprintTickets(prev => prev.filter(t => t.id !== ticketId));
    setBacklogTickets(prev => [ticket, ...prev]);
    
    try {
      await sprintsApi.removeTicket(plannedSprint.id, ticketId);
    } catch {
      loadData();
    }
  };

  const handleStartSprint = async () => {
    if (!plannedSprint) return;
    if (sprintTickets.length === 0) {
      alert("Cannot start a sprint with 0 tickets.");
      return;
    }
    
    if (!confirm(`Start ${plannedSprint.name} with ${sprintTickets.length} tickets?`)) return;

    setStarting(true);
    try {
      await sprintsApi.start(plannedSprint.id);
      alert(`${plannedSprint.name} has started with ${sprintTickets.length} tickets!`);
      navigate('/sprints/active');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start sprint. Note: Only 1 active sprint is allowed per project.');
    } finally {
      setStarting(false);
    }
  };

  const searchedBacklog = useMemo(() => {
    if (!search) return backlogTickets;
    const q = search.toLowerCase();
    return backlogTickets.filter(t => t.title.toLowerCase().includes(q) || t.ticketNumber.toLowerCase().includes(q));
  }, [backlogTickets, search]);


  const renderTicketCard = (ticket: Ticket, removable: boolean = false) => (
    <div className={`bg-white border border-[#E2E8F0] p-3 rounded-lg mb-2 flex flex-col gap-2 ${removable ? 'hover:border-primary-300' : ''} shadow-sm group`}>
      <div className="flex justify-between items-start">
        <span className="text-[12px] font-mono font-medium text-primary-600">{ticket.ticketNumber}</span>
        <div className="flex items-center gap-2">
          {removable && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleRemoveFromSprint(ticket.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <Trash2 className="w-[14px] h-[14px]" />
            </button>
          )}
          <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[ticket.priority]}`} title={ticket.priority} />
        </div>
      </div>
      <p className="text-[14px] font-medium text-[#0F172A] leading-snug">{ticket.title}</p>
      <div className="flex items-center justify-between mt-1">
        {ticket.assignedTo ? (
          <div className="w-[24px] h-[24px] rounded-full bg-[#DBEAFE] flex items-center justify-center border border-white" title={ticket.assignedTo.fullName}>
            <span className="text-[9px] font-bold text-[#2563EB]">{getInitials(ticket.assignedTo.fullName)}</span>
          </div>
        ) : (
          <div className="w-[24px] h-[24px] rounded-full bg-[#F1F5F9] border border-white border-dashed" title="Unassigned" />
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <PageHeader title="Sprint Planning" subtitle="Drag tickets from the backlog into your upcoming sprint." />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-1 min-h-0 gap-6">
        
        {/* LEFT PANEL: BACKLOG */}
        <div className="w-1/2 flex flex-col bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-[#0F172A] flex items-center gap-2">
                Backlog
                <span className="text-[12px] bg-[#E2E8F0] text-[#64748B] px-2 py-0.5 rounded-full">{searchedBacklog.length}</span>
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search backlog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-[13px] border border-[#E2E8F0] rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                />
              </div>
              <div className="flex gap-2">
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="flex-1 h-8 px-2 text-[12px] border border-[#E2E8F0] rounded-md bg-white outline-none">
                  <option value="">Priority</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex-1 h-8 px-2 text-[12px] border border-[#E2E8F0] rounded-md bg-white outline-none">
                  <option value="">Type</option>
                  <option value="BUG">Bug</option>
                  <option value="FEATURE">Feature</option>
                  <option value="TASK">Task</option>
                  <option value="IMPROVEMENT">Improvement</option>
                </select>
                <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="flex-1 h-8 px-2 text-[12px] border border-[#E2E8F0] rounded-md bg-white outline-none">
                  <option value="">Assignee</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-[#F8FAFC] p-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <Droppable droppableId="backlog-list">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-primary-50/50' : ''}`}
                    >
                      {searchedBacklog.length === 0 && !snapshot.isDraggingOver ? (
                        <div className="text-center mt-10">
                          <p className="text-[14px] text-[#94A3B8]">No tickets found in backlog.</p>
                        </div>
                      ) : (
                        searchedBacklog.map((ticket, index) => (
                          <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={snapshot.isDragging ? 'opacity-80 scale-105 shadow-xl rotate-1 z-50' : ''}
                                style={provided.draggableProps.style}
                              >
                                {renderTicketCard(ticket)}
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SPRINT */}
        <div className="w-1/2 flex flex-col bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
          {!plannedSprint && !loading ? (
            // Form to Create Sprint
            <div className="p-8 flex-1 overflow-auto">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                  <Rocket className="w-6 h-6" />
                </div>
                <h2 className="text-[20px] font-semibold text-[#0F172A] mb-2">Plan your next Sprint</h2>
                <p className="text-[14px] text-[#64748B] mb-8">Create a new sprint to start dragging tickets from the backlog.</p>
                
                <form onSubmit={handleCreateSprint} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Project *</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      required
                      className="w-full h-10 px-3 text-[14px] border border-[#E2E8F0] rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Sprint Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Sprint 1"
                      value={sprintName}
                      onChange={(e) => setSprintName(e.target.value)}
                      className="w-full h-10 px-3 text-[14px] border border-[#E2E8F0] rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full h-10 px-3 text-[14px] border border-[#E2E8F0] rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-10 px-3 text-[14px] border border-[#E2E8F0] rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#0F172A] mb-1.5">Sprint Goal</label>
                    <textarea
                      placeholder="What are we trying to achieve?"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full py-2 px-3 text-[14px] border border-[#E2E8F0] rounded-lg min-h-[100px] outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating || !projectId}
                    className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Sprint'}
                  </button>
                </form>
              </div>
            </div>
          ) : plannedSprint ? (
            // Sprint view
            <>
              <div className="p-5 border-b border-[#E2E8F0] bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#0F172A]">{plannedSprint.name}</h2>
                    {plannedSprint.startDate && plannedSprint.endDate && (
                      <div className="flex items-center gap-1.5 text-[13px] text-[#64748B] mt-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(plannedSprint.startDate).toLocaleDateString()} — {new Date(plannedSprint.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleStartSprint}
                    disabled={sprintTickets.length === 0 || starting}
                    className="flex items-center gap-2 h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {starting ? 'Starting...' : 'Start Sprint'}
                  </button>
                </div>
                
                {plannedSprint.goal && (
                  <p className="text-[13px] text-[#475569] bg-[#F1F5F9] p-3 rounded-lg mb-4 italic">
                    <span className="font-semibold not-italic mr-2">Goal:</span>
                    {plannedSprint.goal}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[13px] font-medium text-[#64748B]">
                    <span className="text-[#0F172A] font-semibold">{sprintTickets.length}</span> tickets
                  </span>
                  <span className="text-[13px] font-medium text-[#64748B]">
                    <span className="text-[#0F172A] font-semibold">{sprintTickets.length}</span> tickets committed
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-[#F8FAFC] p-3 border-t border-[#E2E8F0]">
                  <Droppable droppableId="sprint-list">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`h-full min-h-[300px] rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : 'border-2 border-dashed border-transparent'
                        }`}
                      >
                        {sprintTickets.length === 0 && !snapshot.isDraggingOver ? (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                            <Rocket className="w-10 h-10 text-[#94A3B8] mb-4" />
                            <p className="text-[15px] font-medium text-[#64748B] mb-1">Drag tickets here</p>
                            <p className="text-[13px] text-[#94A3B8]">Pull tickets from the backlog to plan your sprint scope.</p>
                          </div>
                        ) : (
                          sprintTickets.map((ticket, index) => (
                            <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={snapshot.isDragging ? 'opacity-80 scale-105 shadow-xl rotate-1 z-50' : ''}
                                  style={provided.draggableProps.style}
                                >
                                  {renderTicketCard(ticket, true)}
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
            </>
          ) : null}
        </div>

      </div>
      </DragDropContext>
    </div>
  );
}
