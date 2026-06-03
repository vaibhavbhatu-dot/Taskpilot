import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Calendar as CalendarIcon, Target, TrendingUp, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { sprintsApi, ticketsApi, dashboardApi } from '../api';
import type { Sprint, Ticket, VelocityData } from '../types';

import { STATUS_CONFIG } from '../constants/ticketStatus';
import { Badge, getInitials } from '@/design-system';

type BadgeVariant = 'info' | 'warning' | 'success' | 'secondary' | 'outline' | 'error' | 'default';
const PRIORITY_BADGE_VARIANT: Record<string, BadgeVariant> = {
  CRITICAL: 'error', HIGH: 'warning', MEDIUM: 'secondary', LOW: 'outline',
};
const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low',
};

export function SprintReportsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [sprintRes, velRes] = await Promise.all([
        sprintsApi.list(),
        dashboardApi.getVelocity().catch(() => ({ data: null }))
      ]);
      const allSprints = sprintRes.data.sort((a, b) => new Date(b.startDate || b.id).getTime() - new Date(a.startDate || a.id).getTime());
      
      setSprints(allSprints);
      setVelocityData(velRes.data);
      
      if (allSprints.length > 0) {
        // Find latest active or completed sprint
        const defaultSprint = allSprints.find(s => s.status === 'ACTIVE' || s.status === 'COMPLETED') || allSprints[0];
        setSelectedSprintId(defaultSprint.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load sprints:', error);
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
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectedSprint = sprints.find(s => s.id === selectedSprintId);

  // Status breakdown from tickets
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    const colors: Record<string, string> = {
      BACKLOG: '#94A3B8', REQUIREMENTS: '#7C3AED', DESIGN: '#A21CAF',
      HTML: '#C2410C', ON_DEVELOPMENT: '#CA8A04', QA: '#4338CA',
      BUGS: '#DC2626', ENHANCEMENT: '#2563EB', UAT: '#059669',
      LIVE: '#16A34A', NOT_REQUIRED: '#6B7280',
    };
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status,
      value,
      color: colors[status] || '#94A3B8',
    }));
  }, [tickets]);

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
          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="w-full h-10 px-3 text-[14px] font-medium border border-border rounded-lg bg-card outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow shadow-sm"
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.status === 'ACTIVE' ? '(Active)' : s.status === 'COMPLETED' ? '(Done)' : '(Planned)'}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 border border-border rounded-xl bg-card shadow-sm">
           <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
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
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">Total Issues</p>
                <p className="text-[24px] font-semibold text-foreground">{tickets.length}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">Completed</p>
                <p className="text-[24px] font-semibold text-[hsl(var(--color-success))]">{tickets.filter(t => t.status === 'LIVE' || t.status === 'NOT_REQUIRED').length}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">Completion Rate</p>
                <p className="text-[24px] font-semibold text-foreground">
                  {tickets.length > 0
                    ? Math.round((tickets.filter(t => t.status === 'LIVE' || t.status === 'NOT_REQUIRED').length / tickets.length) * 100)
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground mb-1">Remaining</p>
                <p className="text-[24px] font-semibold text-[hsl(var(--color-warning))]">{tickets.filter(t => t.status !== 'LIVE' && t.status !== 'NOT_REQUIRED').length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Status Breakdown */}
            <div className="col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
              <h3 className="text-[15px] font-semibold text-foreground mb-4">Issue Status</h3>
              <div className="flex-1 min-h-[250px] flex flex-col justify-center items-center relative">
                {pieData.length > 0 ? (
                  <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                  </>
                ) : (
                  <div className="text-[13px] text-muted-foreground">No issues in sprint</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-6">
            {/* Individual Performance Table */}
            <div className="col-span-8 bg-card border border-border rounded-xl p-5 shadow-sm">
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
                                <img src={stat.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
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

            {/* Velocity Chart */}
            <div className="col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-[15px] font-semibold text-foreground mb-1 flex items-center justify-between">
                Velocity Trend
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </h3>
              <p className="text-[12px] text-muted-foreground mb-5">Comparing last 6 sprints</p>
              
              <div className="h-[250px]">
                {velocityData && velocityData.velocity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityData.velocity.slice(0, 6).reverse()} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="sprintName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} 
                             tickFormatter={(v) => v.length > 8 ? v.substring(0, 8) + '...' : v} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip 
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} iconType="circle" />
                      
                      {velocityData.avgVelocity > 0 && (
                        <ReferenceLine y={velocityData.avgVelocity} stroke="#94A3B8" strokeDasharray="3 3" />
                      )}

                      <Bar dataKey="totalTickets" name="Total" fill="#BFDBFE" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="completedTickets" name="Completed" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">No velocity data available</div>
                )}
              </div>
              
              {velocityData && velocityData.avgVelocity > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-[13px]">
                  <span className="text-muted-foreground font-medium">Average Velocity:</span>
                  <span className="font-semibold text-foreground">{Math.round(velocityData.avgVelocity)} tickets</span>
                </div>
              )}
            </div>
            
          </div>

          {/* Sprint Tickets */}
          {tickets.length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
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
                    const statusCfg = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];
                    const priorityVariant = PRIORITY_BADGE_VARIANT[ticket.priority] ?? 'secondary';
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
                          {statusCfg && (
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
                              style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
                            >
                              {statusCfg.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={priorityVariant} size="sm">{PRIORITY_LABEL[ticket.priority] ?? ticket.priority}</Badge>
                          </div>
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
