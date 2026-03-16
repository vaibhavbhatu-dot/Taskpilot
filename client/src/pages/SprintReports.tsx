import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Calendar as CalendarIcon, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { sprintsApi, ticketsApi, dashboardApi } from '../api';
import type { Sprint, Ticket, BurndownData, VelocityData } from '../types';

const STATUS_COLORS = {
  DONE: '#10B981',
  IN_PROGRESS: '#3B82F6',
  BLOCKED: '#EF4444',
  TODO: '#94A3B8',
};

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function SprintReportsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  
  const [burndown, setBurndown] = useState<BurndownData | null>(null);
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
      const [bdRes, tixRes] = await Promise.all([
        sprintsApi.getBurndown(sprintId).catch(() => ({ data: null })),
        ticketsApi.list({ sprintId, limit: '500' }).catch(() => ({ data: { tickets: [] } }))
      ]);
      setBurndown(bdRes.data);
      setTickets(tixRes.data.tickets);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectedSprint = sprints.find(s => s.id === selectedSprintId);

  // Process Burndown data for chart
  const burndownChartData = useMemo(() => {
    if (!burndown) return [];
    return burndown.idealBurndown.map((ideal, idx) => {
      // Create actual progress line only up to current elapsed days
      const isFuture = idx >= burndown.elapsedDays;
      // In a real app we'd need historical snapshot per day. 
      // For this step, we'll mimic actual decreasing by simulating a line based on completed vs remaining.
      // E.g., if total is 40, completed is 10 in 2 days. Day 1 -> 35, Day 2 -> 30.
      
      // Using mock actual line for demo to show two lines visually based on total and remaining
      let actual = undefined;
      if (!isFuture) {
        const dropPerDay = burndown.completedPoints / Math.max(1, burndown.elapsedDays - 1);
        actual = Math.max(0, burndown.totalPoints - (idx * dropPerDay));
      }
      if (idx === burndown.elapsedDays - 1) actual = burndown.remainingPoints;

      return {
        day: `Day ${ideal.day}`,
        Ideal: ideal.ideal,
        Actual: actual,
      };
    });
  }, [burndown]);

  // Process Status Pie Data
  const pieData = useMemo(() => {
    if (!burndown) return [];
    const stats = burndown.ticketStats;
    const todo = stats.total - stats.done - stats.inProgress - stats.blocked;
    return [
      { name: 'Done', value: stats.done, color: STATUS_COLORS.DONE },
      { name: 'In Progress', value: stats.inProgress, color: STATUS_COLORS.IN_PROGRESS },
      { name: 'Blocked', value: stats.blocked, color: STATUS_COLORS.BLOCKED },
      { name: 'To Do', value: Math.max(0, todo), color: STATUS_COLORS.TODO },
    ].filter(d => d.value > 0);
  }, [burndown]);

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
          assignedPoints: 0,
          completedPoints: 0,
        };
      }
      
      userMap[uid].assignedCount++;
      userMap[uid].assignedPoints += (ticket.storyPoints || 0);
      
      if (ticket.status === 'DONE') {
        userMap[uid].completedCount++;
        userMap[uid].completedPoints += (ticket.storyPoints || 0);
      }
    });

    return Object.values(userMap).map(stats => {
      const completionPct = stats.assignedPoints > 0 
        ? (stats.completedPoints / stats.assignedPoints) * 100 
        : (stats.assignedCount > 0 ? (stats.completedCount / stats.assignedCount) * 100 : 0);
        
      return {
        ...stats,
        completionPct: Math.round(completionPct)
      };
    }).sort((a, b) => b.completionPct - a.completionPct);
    
  }, [tickets]);

  if (sprints.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-fade-in text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-[24px] font-semibold text-[#0F172A] mb-2">No Sprint Data</h2>
        <p className="text-[15px] text-[#64748B] mb-8 max-w-sm">
          There are no sprints available for reporting.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#0F172A]">Sprint Reports</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Analyze sprint performance, velocity, and burndown metrics.</p>
        </div>
        
        <div className="w-64">
          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="w-full h-10 px-3 text-[14px] font-medium border border-[#E2E8F0] rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow shadow-sm"
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.status === 'ACTIVE' ? '(Active)' : s.status === 'COMPLETED' ? '(Done)' : '(Planned)'}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 border border-[#E2E8F0] rounded-xl bg-white shadow-sm">
           <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : selectedSprint ? (
        <div className="space-y-6">
          
          {/* Sprint Summary Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-5 pb-5 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-[18px] font-semibold text-[#0F172A]">{selectedSprint.name}</h2>
                {selectedSprint.startDate && selectedSprint.endDate && (
                  <span className="text-[14px] text-[#64748B] mt-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(selectedSprint.startDate).toLocaleDateString()} — {new Date(selectedSprint.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {selectedSprint.goal && (
                <div className="bg-[#F1F5F9] px-4 py-2.5 rounded-lg max-w-sm text-right">
                  <div className="flex items-center justify-end gap-1.5 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                    <Target className="w-3.5 h-3.5" /> Sprint Goal
                  </div>
                  <p className="text-[13px] text-[#0F172A] italic">{selectedSprint.goal}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              <div>
                <p className="text-[12px] font-medium text-[#64748B] mb-1">Committed (pts)</p>
                <p className="text-[24px] font-semibold text-[#0F172A]">{burndown?.totalPoints || 0}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#64748B] mb-1">Completed (pts)</p>
                <p className="text-[24px] font-semibold text-[#10B981]">{burndown?.completedPoints || 0}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#64748B] mb-1">Completion Rate</p>
                <p className="text-[24px] font-semibold text-[#0F172A]">
                  {burndown && burndown.totalPoints > 0 
                    ? Math.round((burndown.completedPoints / burndown.totalPoints) * 100)
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#64748B] mb-1">Carryover (pts)</p>
                <p className="text-[24px] font-semibold text-[#F59E0B]">{burndown?.remainingPoints || 0}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#64748B] mb-1">Total Issues</p>
                <p className="text-[24px] font-semibold text-[#0F172A]">{burndown?.ticketStats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            
            {/* Burndown Chart */}
            <div className="col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <h3 className="text-[15px] font-semibold text-[#0F172A] mb-4">Burndown Chart</h3>
              <div className="h-[300px]">
                {burndownChartData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={burndownChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       labelStyle={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}
                     />
                     <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                     <Line type="monotone" dataKey="Ideal" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                     <Line type="monotone" dataKey="Actual" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                   </LineChart>
                 </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-[#64748B]">No burndown data available</div>
                )}
              </div>
            </div>
            
            {/* Status Breakdown */}
            <div className="col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col">
              <h3 className="text-[15px] font-semibold text-[#0F172A] mb-4">Issue Status</h3>
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
                      <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-[#475569] font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                  </>
                ) : (
                  <div className="text-[13px] text-[#64748B]">No issues in sprint</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-6">
            {/* Individual Performance Table */}
            <div className="col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <h3 className="text-[15px] font-semibold text-[#0F172A] mb-4">Team Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="pb-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Member</th>
                      <th className="pb-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Assigned Pts</th>
                      <th className="pb-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Completed Pts</th>
                      <th className="pb-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Completion %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {performanceStats.map(stat => (
                      <tr key={stat.user.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                              {stat.user.avatar ? (
                                <img src={stat.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                              ) : (
                                <span className="text-[11px] font-bold text-[#2563EB]">{getInitials(stat.user.fullName)}</span>
                              )}
                            </div>
                            <span className="text-[14px] font-medium text-[#0F172A]">{stat.user.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-[14px] text-[#0F172A] font-medium">{stat.assignedPoints}</td>
                        <td className="py-3 text-center text-[14px] text-[#10B981] font-medium">{stat.completedPoints}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[14px] font-bold ${stat.completionPct >= 80 ? 'text-[#10B981]' : stat.completionPct < 50 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                            {stat.completionPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {performanceStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#64748B] text-[13px]">No assignments found for this sprint.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Velocity Chart */}
            <div className="col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1 flex items-center justify-between">
                Velocity Trend
                <TrendingUp className="w-4 h-4 text-[#64748B]" />
              </h3>
              <p className="text-[12px] text-[#64748B] mb-5">Comparing last 6 sprints</p>
              
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

                      <Bar dataKey="totalPoints" name="Committed" fill="#BFDBFE" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="completedPoints" name="Completed" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[13px] text-[#64748B]">No velocity data available</div>
                )}
              </div>
              
              {velocityData && velocityData.avgVelocity > 0 && (
                <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-between items-center text-[13px]">
                  <span className="text-[#64748B] font-medium">Average Velocity:</span>
                  <span className="font-semibold text-[#0F172A]">{Math.round(velocityData.avgVelocity)} pts</span>
                </div>
              )}
            </div>
            
          </div>
          
        </div>
      ) : null}

    </div>
  );
}
