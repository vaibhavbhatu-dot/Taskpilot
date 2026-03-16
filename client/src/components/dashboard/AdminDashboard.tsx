import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend, LineChart, Line } from 'recharts';
import { dashboardApi, sprintsApi } from '../../api';
import { Skeleton } from '../ui/Skeleton';
import type { DashboardData, VelocityData, BurndownData } from '../../types';

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

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [velocity, setVelocity] = useState<VelocityData | null>(null);
  const [workload, setWorkload] = useState<any[]>([]);
  const [burndown, setBurndown] = useState<BurndownData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, velRes, workRes, sprintsRes] = await Promise.all([
          dashboardApi.getData(),
          dashboardApi.getVelocity(),
          dashboardApi.getWorkload(),
          sprintsApi.list({ status: 'ACTIVE' })
        ]);
        setData(dashRes.data);
        setVelocity(velRes.data);
        setWorkload(workRes.data);
        const activeSprints = sprintsRes.data;
        if (activeSprints.length > 0) {
          const burnRes = await sprintsApi.getBurndown(activeSprints[0].id);
          setBurndown(burnRes.data);
        }
      } catch (error) {
        console.error('Admin dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) return <DashboardSkeleton />;

  const resolutionRate = data.kpis.totalTickets > 0
    ? Math.round((data.kpis.doneTickets / data.kpis.totalTickets) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">Total Tickets</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{data.kpis.totalTickets}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">Resolved</span>
          </div>
          <p className={`text-2xl font-bold ${resolutionRate >= 70 ? 'text-green-600' : 'text-[#0F172A]'}`}>
            {resolutionRate}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">Sprint Velocity</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{velocity?.avgVelocity || 0} pts</p>
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
          <h3 className="font-semibold text-[15px] text-[#0F172A] mb-4">Sprint Burndown</h3>
          <div className="h-64">
            {burndown ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndown.idealBurndown.map((ideal: any, i: number) => ({
                  day: 'Day ' + ideal.day,
                  ideal: ideal.ideal,
                  actual: i <= burndown.elapsedDays ? burndown.totalPoints - burndown.completedPoints : null
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="ideal" name="Ideal Remaining" stroke="#94A3B8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Actual Remaining" stroke="#2563EB" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#64748B] text-sm">No active sprint</div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[15px] text-[#0F172A] mb-4">Organization Workload</h3>
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
      </div>
    </div>
  );
}
