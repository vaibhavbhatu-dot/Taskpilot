import { useEffect, useState } from 'react';
import { Users, AlertTriangle, Briefcase, ListTodo, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../../api';
import { Skeleton } from '../ui/Skeleton';
import type { DashboardData } from '../../types';
import { PRIORITY_DOT_COLORS } from '../../constants/ticketStyles';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManagerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [workload, setWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setError(false);
    setLoading(true);
    try {
      const [dashRes, workRes] = await Promise.all([
        dashboardApi.getData(),
        dashboardApi.getWorkload(),
      ]);
      setData(dashRes.data);
      setWorkload(workRes.data);
    } catch (err) {
      console.error('Manager dashboard load error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle className="w-10 h-10 text-destructive mb-3" />
      <p className="text-[16px] font-semibold text-foreground mb-1">Failed to load dashboard</p>
      <p className="text-[13px] text-muted-foreground mb-4">Check your connection and try again</p>
      <button onClick={load} className="h-9 px-5 bg-primary text-primary-foreground text-[14px] font-medium rounded-lg hover:bg-primary/90 transition-colors">
        Retry
      </button>
    </div>
  );

  const priorityChartData = Object.entries(data.ticketsByPriority).map(([name, value]) => ({
    name,
    value,
    fill: PRIORITY_DOT_COLORS[name] || '#9CA3AF',
  })).filter((item: any) => item.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Team Members</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.kpis.teamMemberCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Total Tickets</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.kpis.totalTickets}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="w-4 h-4 text-yellow-600" />
            <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">In Development</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.kpis.devInProgressTickets}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Overdue</span>
          </div>
          <p className={`text-2xl font-bold ${data.kpis.overdueTickets > 0 ? 'text-red-600' : 'text-foreground'}`}>
            {data.kpis.overdueTickets}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-[15px] text-foreground mb-4">Team Workload</h3>
          <div className="h-64">
            {workload.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 500 }} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} barSize={24} />
                  <Bar dataKey="total" name="Pending" stackId="a" fill="#E2E8F0" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No workload data</div>
            )}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-[15px] text-foreground mb-4">Priority Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            {priorityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                    {priorityChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm">No tickets to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
