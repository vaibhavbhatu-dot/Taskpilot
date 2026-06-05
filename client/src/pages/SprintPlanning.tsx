import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Search, Calendar as CalendarIcon, Play, Trash2, Rocket, Inbox, ChevronDown, Check } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ticketsApi, sprintsApi, usersApi, projectsApi } from '../api';
import { useAuthStore } from '../stores';
import { markChecklistDone } from '../lib/checklist';
import type { Ticket, Sprint, User, Project } from '../types';
import { toast } from 'sonner';
import { getInitials, Spinner, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';
import { PRIORITY_DOT_COLORS } from '../constants/ticketStyles';


export function SprintPlanningPage() {
  const { user } = useAuthStore();
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
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]); // empty = All
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goal, setGoal] = useState('');
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [priorityFilter, typeFilter, assigneeFilter, selectedProjectIds]);

  useEffect(() => {
    if (!projectDropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [projectDropdownOpen]);

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

      // Filter backlog tickets manually for priority/type/assignee/project
      let filteredBacklog = ticketsRes.data.tickets;
      if (priorityFilter) filteredBacklog = filteredBacklog.filter(t => t.priority === priorityFilter);
      if (typeFilter) filteredBacklog = filteredBacklog.filter(t => t.type === typeFilter);
      if (assigneeFilter) filteredBacklog = filteredBacklog.filter(t => t.assignedToId === assigneeFilter);
      if (selectedProjectIds.length > 0) {
        filteredBacklog = filteredBacklog.filter(t => selectedProjectIds.includes((t as any).projectId));
      }
      
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

    } catch {
      toast.error('Failed to load planning data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  // For creation, use first selected project or fall back to first available
  const sprintProjectId = selectedProjectIds[0] || projects[0]?.id || '';

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName || !sprintProjectId) return;
    setCreating(true);
    try {
      // If multiple specific projects selected, create one sprint per project
      const projectsToCreate = selectedProjectIds.length > 1
        ? selectedProjectIds
        : [sprintProjectId];

      for (const pid of projectsToCreate) {
        await sprintsApi.create({
          name: sprintName,
          projectId: pid,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          goal: goal || undefined,
          status: 'PLANNED'
        });
      }
      setSprintName('');
      setStartDate('');
      setEndDate('');
      setGoal('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create sprint');
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
      toast.error('Cannot start a sprint with 0 tickets.');
      return;
    }

    setStarting(true);
    try {
      await sprintsApi.start(plannedSprint.id);
      toast.success(`${plannedSprint.name} has started with ${sprintTickets.length} tickets!`);
      if (user?.id) markChecklistDone(user.id, 'start_sprint');
      navigate('/sprints/active');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start sprint. Only 1 active sprint is allowed per project.');
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
    <div className={`bg-card border border-border p-3 rounded-lg mb-2 flex flex-col gap-2 ${removable ? 'hover:border-[hsl(var(--color-info))]/30' : ''} shadow-sm group`}>
      <div className="flex justify-between items-start">
        <span className="text-[12px] font-mono font-medium text-[hsl(var(--color-info))]">{ticket.ticketNumber}</span>
        <div className="flex items-center gap-2">
          {removable && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleRemoveFromSprint(ticket.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <Trash2 className="w-[14px] h-[14px]" />
            </button>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_DOT_COLORS[ticket.priority] ?? '#94A3B8' }} />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0F172A]">{ticket.priority}</span>
          </span>
        </div>
      </div>
      <p className="text-[14px] font-medium text-foreground leading-snug">{ticket.title}</p>
      <div className="flex items-center justify-between mt-1">
        {ticket.assignedTo ? (
          <div className="w-[24px] h-[24px] rounded-full bg-primary/15 flex items-center justify-center border border-white" title={ticket.assignedTo.fullName}>
            <span className="text-[9px] font-bold text-primary">{getInitials(ticket.assignedTo.fullName)}</span>
          </div>
        ) : (
          <div className="w-[24px] h-[24px] rounded-full bg-muted border border-white border-dashed" title="Unassigned" />
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
        <div className="w-1/2 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                Backlog
                <span className="text-[12px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{searchedBacklog.length}</span>
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search backlog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-[13px] border border-border rounded-lg bg-card outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                />
              </div>
              <div className="flex gap-2">
                <Select value={priorityFilter || '_all'} onValueChange={(val) => setPriorityFilter(val === '_all' ? '' : val)}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Priority</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter || '_all'} onValueChange={(val) => setTypeFilter(val === '_all' ? '' : val)}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Type</SelectItem>
                    <SelectItem value="BUG">Bug</SelectItem>
                    <SelectItem value="FEATURE">Feature</SelectItem>
                    <SelectItem value="TASK">Task</SelectItem>
                    <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter || '_all'} onValueChange={(val) => setAssigneeFilter(val === '_all' ? '' : val)}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Assignee</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-muted/50 p-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner size="sm" />
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
                        <div>
                          {search ? (
                            <div className="text-center mt-10">
                              <p className="text-[14px] text-muted-foreground">No tickets match your search.</p>
                            </div>
                          ) : (
                            <EmptyState
                              icon={<Inbox className="w-12 h-12" />}
                              title="Backlog is empty"
                              description="Tickets you create will appear here. Drag them into a sprint to start planning."
                              action={{ label: 'Create a ticket', onClick: () => navigate('/tickets') }}
                              size="sm"
                            />
                          )}
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
        <div className="w-1/2 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {!plannedSprint && !loading ? (
            // Form to Create Sprint
            <div className="p-8 flex-1 overflow-auto">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 bg-[hsl(var(--color-info))]/10 text-[hsl(var(--color-info))] rounded-xl flex items-center justify-center mb-6">
                  <Rocket className="w-6 h-6" />
                </div>
                <h2 className="text-[20px] font-semibold text-foreground mb-2">Plan your next Sprint</h2>
                <p className="text-[14px] text-muted-foreground mb-8">Create a new sprint to start dragging tickets from the backlog.</p>
                
                <form onSubmit={handleCreateSprint} className="space-y-5">
                  <div ref={projectDropdownRef} className="relative">
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Project *</label>
                    {/* Multi-select trigger */}
                    <button
                      type="button"
                      onClick={() => setProjectDropdownOpen(v => !v)}
                      className="w-full h-9 px-3 text-[14px] border border-border rounded-lg bg-card outline-none flex items-center justify-between hover:border-primary/50 transition-colors"
                    >
                      <span className={selectedProjectIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                        {selectedProjectIds.length === 0
                          ? 'All Projects'
                          : selectedProjectIds.length === 1
                            ? projects.find(p => p.id === selectedProjectIds[0])?.name ?? '1 project'
                            : `${selectedProjectIds.length} projects selected`}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {projectDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                        {/* All Projects option */}
                        <button
                          type="button"
                          onClick={() => { setSelectedProjectIds([]); setProjectDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedProjectIds.length === 0 ? 'bg-primary border-primary' : 'border-border'}`}>
                            {selectedProjectIds.length === 0 && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-[13px] font-medium text-foreground">All Projects</span>
                        </button>

                        <div className="border-t border-border" />

                        {/* Individual projects */}
                        {projects.map(p => {
                          const isSelected = selectedProjectIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProjectIds(prev =>
                                  prev.includes(p.id)
                                    ? prev.filter(x => x !== p.id)
                                    : [...prev, p.id]
                                );
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className="text-[13px] text-foreground">{p.name}</span>
                            </button>
                          );
                        })}

                        <div className="border-t border-border px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setProjectDropdownOpen(false)}
                            className="w-full text-[12px] text-muted-foreground hover:text-foreground py-0.5"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Sprint Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Sprint 1"
                      value={sprintName}
                      onChange={(e) => setSprintName(e.target.value)}
                      className="w-full h-10 px-3 text-[14px] border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full h-10 px-3 text-[14px] border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-10 px-3 text-[14px] border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Sprint Goal</label>
                    <textarea
                      placeholder="What are we trying to achieve?"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full py-2 px-3 text-[14px] border border-border rounded-lg min-h-[100px] outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating || !sprintProjectId}
                    className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Sprint'}
                  </button>
                </form>
              </div>
            </div>
          ) : plannedSprint ? (
            // Sprint view
            <>
              <div className="p-5 border-b border-border bg-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-[18px] font-semibold text-foreground">{plannedSprint.name}</h2>
                    {plannedSprint.startDate && plannedSprint.endDate && (
                      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(plannedSprint.startDate).toLocaleDateString()} — {new Date(plannedSprint.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleStartSprint}
                    disabled={sprintTickets.length === 0 || starting}
                    className="flex items-center gap-2 h-9 px-4 bg-primary hover:bg-primary/90 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {starting ? 'Starting...' : 'Start Sprint'}
                  </button>
                </div>
                
                {plannedSprint.goal && (
                  <p className="text-[13px] text-muted-foreground bg-muted p-3 rounded-lg mb-4 italic">
                    <span className="font-semibold not-italic mr-2">Goal:</span>
                    {plannedSprint.goal}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[13px] font-medium text-muted-foreground">
                    <span className="text-foreground font-semibold">{sprintTickets.length}</span> tickets
                  </span>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    <span className="text-foreground font-semibold">{sprintTickets.length}</span> tickets committed
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-muted/50 p-3 border-t border-border">
                  <Droppable droppableId="sprint-list">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`h-full min-h-[300px] rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-[hsl(var(--color-info))]/5 border-2 border-dashed border-[hsl(var(--color-info))]/30' : 'border-2 border-dashed border-transparent'
                        }`}
                      >
                        {sprintTickets.length === 0 && !snapshot.isDraggingOver ? (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                            <Rocket className="w-10 h-10 text-muted-foreground mb-4" />
                            <p className="text-[15px] font-medium text-muted-foreground mb-1">Drag tickets here</p>
                            <p className="text-[13px] text-muted-foreground">Pull tickets from the backlog to plan your sprint scope.</p>
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
