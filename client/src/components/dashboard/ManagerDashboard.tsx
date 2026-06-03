import { useEffect, useState } from 'react';
import { Users, AlertTriangle, Briefcase, ListTodo } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../../api';
import { Skeleton } from '../ui/Skeleton';
import type { DashboardData } from '../../types';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4">
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

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, workRes] = await Promise.all([
          dashboardApi.getData(),
          dashboardApi.getWorkload(),
        ]);
        setData(dashRes.data);
        setWorkload(workRes.data);
      } catch (error) {
        console.error('Manager dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) return <DashboardSkeleton />;

  const priorityChartData = Object.entries(data.ticketsByPriority).map(([name, value]) => ({
    name,
    value,
    fill: PRIORITY_COLORS[name] || '#9CA3AF',
  })).filter((item: any) => item.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">Team Members</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{data.kpis.teamMemberCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">Total Tickets</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{data.kpis.totalTickets}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="w-4 h-4 text-yellow-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">In Development</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{data.kpis.devInProgressTickets}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">Overdue</span>
          </div>
          <p className={`text-2xl font-bold ${data.kpis.overdueTickets > 0 ? 'text-red-600' : 'text-[#0F172A]'}`}>
            {data.kpis.overdueTickets}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[15px] text-[#0F172A] mb-4">Team Workload</h3>
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
              <div className="flex items-center justify-center h-full text-[#64748B] text-sm">No workload data</div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[15px] text-[#0F172A] mb-4">Priority Breakdown</h3>
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
              <div className="text-[#64748B] text-sm">No tickets to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
