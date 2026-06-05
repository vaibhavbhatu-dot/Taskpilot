import { useEffect, useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Target, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { sprintsApi, ticketsApi } from '../api';
import type { Sprint, Ticket } from '../types';

import { toast } from 'sonner';
import { getInitials, Spinner, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';
import { STATUS_STYLES, PRIORITY_DOT_COLORS } from '../constants/ticketStyles';

export function SprintReportsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const sprintRes = await sprintsApi.list();
      const allSprints = sprintRes.data.sort((a, b) => new Date(b.startDate || b.id).getTime() - new Date(a.startDate || a.id).getTime());

      setSprints(allSprints);

      if (allSprints.length > 0) {
        // Find latest active or completed sprint
        const defaultSprint = allSprints.find(s => s.status === 'ACTIVE' || s.status === 'COMPLETED') || allSprints[0];
        setSelectedSprintId(defaultSprint.id);
      } else {
        setLoading(false);
      }
    } catch {
      toast.error('Failed to load sprints.');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedSprintId) {
      loadSprintData(selectedSprintId);
    }
  }, [selectedSprintId]);

  async function loadSprintData(sprintId: string) {
    try {
      setLoading(true);
      const tixRes = await ticketsApi.list({ sprintId, limit: '500' }).catch(() => ({ data: { tickets: [] } }));
      setTickets(tixRes.data.tickets);
    } catch {
      toast.error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }

  const selectedSprint = sprints.find(s => s.id === selectedSprintId);

  // Process Individual Performance
  const performanceStats = useMemo(() => {
    if (!tickets.length) return [];
    
    const userMap: Record<string, any> = {};
    
    tickets.forEach(ticket => {
      if (!ticket.assignedTo) return;
      
      const uid = ticket.assignedTo.id;
      if (!userMap[uid]) {
        userMap[uid] = {
          user: ticket.assignedTo,
          assignedCount: 0,
          completedCount: 0,
        };
      }

      userMap[uid].assignedCount++;

      if (ticket.status === 'LIVE' || ticket.status === 'NOT_REQUIRED') {
        userMap[uid].completedCount++;
      }
    });

    return Object.values(userMap).map(stats => {
      const completionPct = stats.assignedCount > 0
        ? (stats.completedCount / stats.assignedCount) * 100
        : 0;
        
      return {
        ...stats,
        completionPct: Math.round(completionPct)
      };
    }).sort((a, b) => b.completionPct - a.completionPct);
    
  }, [tickets]);

  const completedTickets = tickets.filter(t => t.status === 'LIVE' || t.status === 'NOT_REQUIRED');
  const remainingTickets = tickets.filter(t => t.status !== 'LIVE' && t.status !== 'NOT_REQUIRED');

  if (sprints.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-[24px] font-semibold text-foreground mb-2">No Sprint Data</h2>
        <p className="text-[15px] text-muted-foreground mb-8 max-w-sm">
          There are no sprints available for reporting.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Sprint Reports" subtitle="Analyze sprint performance and metrics." />
        <div className="w-64">
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Select sprint…" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.status === 'ACTIVE' ? '(Active)' : s.status === 'COMPLETED' ? '(Done)' : '(Planned)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 border border-border rounded-xl bg-card shadow-sm">
          <Spinner size="lg" />
        </div>
      ) : selectedSprint ? (
        <div className="space-y-6">
          
          {/* Sprint Summary Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-5 pb-5 border-b border-border">
              <div>
                <h2 className="text-[18px] font-semibold text-foreground">{selectedSprint.name}</h2>
                {selectedSprint.startDate && selectedSprint.endDate && (
                  <span className="text-[14px] text-muted-foreground mt-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(selectedSprint.startDate).toLocaleDateString()} — {new Date(selectedSprint.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {selectedSprint.goal && (
                <div className="bg-muted px-4 py-2.5 rounded-lg max-w-sm text-right">
                  <div className="flex items-center justify-end gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    <Target className="w-3.5 h-3.5" /> Sprint Goal
                  </div>
                  <p className="text-[13px] text-foreground italic">{selectedSprint.goal}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-start divide-x divide-[#E2E8F0]">
              <div className="px-6 pl-0">
                <p className="text-xs text-[#94A3B8] mb-1">Total Issues</p>
                <p className="text-2xl font-semibold text-[#0F172A]">{tickets.length}</p>
              </div>
              <div className="px-6">
                <p className="text-xs text-[#94A3B8] mb-1">Completed</p>
                <p className="text-2xl font-semibold text-[#10B981]">{completedTickets.length}</p>
              </div>
              <div className="px-6">
                <p className="text-xs text-[#94A3B8] mb-1">Completion Rate</p>
                <p className="text-2xl font-semibold text-[#0F172A]">
                  {tickets.length > 0 ? Math.round((completedTickets.length / tickets.length) * 100) : 0}%
                </p>
              </div>
              <div className="px-6">
                <p className="text-xs text-[#94A3B8] mb-1">Remaining</p>
                <p className="text-2xl font-semibold text-[#F59E0B]">{remainingTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Individual Performance Table */}
            <div className="col-span-12 bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[15px] font-semibold text-foreground mb-4">Team Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                      <th className="pb-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Assigned</th>
                      <th className="pb-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Completed</th>
                      <th className="pb-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Completion %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {performanceStats.map(stat => (
                      <tr key={stat.user.id} className="hover:bg-muted/50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              {stat.user.avatar ? (
                                <img src={stat.user.avatar} className="w-8 h-8 rounded-full object-cover" alt={stat.user.fullName} />
                              ) : (
                                <span className="text-[11px] font-bold text-primary">{getInitials(stat.user.fullName)}</span>
                              )}
                            </div>
                            <span className="text-[14px] font-medium text-foreground">{stat.user.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-[14px] text-foreground font-medium">{stat.assignedCount}</td>
                        <td className="py-3 text-center text-[14px] text-[hsl(var(--color-success))] font-medium">{stat.completedCount}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[14px] font-bold ${stat.completionPct >= 80 ? 'text-[hsl(var(--color-success))]' : stat.completionPct < 50 ? 'text-destructive' : 'text-[hsl(var(--color-warning))]'}`}>
                            {stat.completionPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {performanceStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground text-[13px]">No assignments found for this sprint.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Sprint Tickets */}
          {tickets.length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-semibold text-foreground">Sprint Tickets</h3>
                  <div className="flex items-center gap-4 text-[13px]">
                    <span className="flex items-center gap-1.5 text-[hsl(var(--color-success))] font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {completedTickets.length} completed
                    </span>
                    <span className="flex items-center gap-1.5 text-[hsl(var(--color-warning))] font-medium">
                      <Clock className="w-4 h-4" />
                      {remainingTickets.length} remaining
                    </span>
                  </div>
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assignee</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...completedTickets, ...remainingTickets].map((ticket, i) => {
                    const isDone = ticket.status === 'LIVE' || ticket.status === 'NOT_REQUIRED';
                    return (
                      <tr key={ticket.id} className={`hover:bg-muted/50 transition-colors ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {isDone && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--color-success))] flex-shrink-0" />}
                            <span className={`text-[14px] font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {ticket.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={STATUS_STYLES[ticket.status] ?? STATUS_STYLES['BACKLOG']}>
                            {ticket.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: PRIORITY_DOT_COLORS[ticket.priority] ?? PRIORITY_DOT_COLORS['LOW'] }}
                            />
                            <span className="text-xs font-semibold tracking-wider uppercase text-[#0F172A]">
                              {ticket.priority}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] text-muted-foreground capitalize">{ticket.type?.toLowerCase().replace('_', ' ') || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {ticket.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                                {ticket.assignedTo.avatar ? (
                                  <img src={ticket.assignedTo.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                                ) : (
                                  <span className="text-[9px] font-bold text-primary">{getInitials(ticket.assignedTo.fullName)}</span>
                                )}
                              </div>
                              <span className="text-[13px] text-muted-foreground">{ticket.assignedTo.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-[13px] text-muted-foreground">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {ticket.completedAt ? (
                            <span className="text-[13px] text-muted-foreground">
                              {new Date(ticket.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-[13px] text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
}
