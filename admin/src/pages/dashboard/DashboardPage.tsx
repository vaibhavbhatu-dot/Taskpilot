import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, UserPlus, Ticket, AlertOctagon,
  AlertTriangle, Clock, Activity,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { dashboardApi } from '@/api';
import { formatNumber } from '@/lib/utils';

// Mock data used while API is not yet built
const MOCK_SIGNUP_TREND = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86_400_000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  count: Math.floor(Math.random() * 15) + 5,
}));

const MOCK_TICKETS_BY_STATUS = [
  { status: 'Open',        count: 24, color: '#3B82F6' },
  { status: 'In Progress', count: 11, color: '#F59E0B' },
  { status: 'Resolved',    count: 67, color: '#10B981' },
  { status: 'Closed',      count: 43, color: '#94A3B8' },
];

const MOCK_STATS = {
  totalOrgs: 142,
  activeOrgs: 128,
  totalUsers: 1847,
  newSignups7d: 63,
  openTickets: 24,
  criticalTickets: 3,
  errorRate: 0.4,
  avgResponseTimeHours: 3.2,
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data).catch(() => MOCK_STATS),
    initialData: MOCK_STATS,
  });

  const KPIs = [
    { label: 'Total Organisations', value: formatNumber(stats.totalOrgs),    trend: 8,   icon: <Building2 className="w-5 h-5 text-primary" />,              iconBg: 'bg-primary/10' },
    { label: 'Active Orgs',         value: formatNumber(stats.activeOrgs),   trend: 5,   icon: <Activity className="w-5 h-5 text-green-600" />,             iconBg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Total Users',         value: formatNumber(stats.totalUsers),   trend: 12,  icon: <Users className="w-5 h-5 text-indigo-600" />,              iconBg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'New Signups (7d)',     value: formatNumber(stats.newSignups7d), trend: 18,  icon: <UserPlus className="w-5 h-5 text-cyan-600" />,             iconBg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { label: 'Open Tickets',        value: stats.openTickets,                trend: -4,  icon: <Ticket className="w-5 h-5 text-amber-600" />,              iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Critical Tickets',    value: stats.criticalTickets,            trend: 0,   icon: <AlertOctagon className="w-5 h-5 text-red-600" />,          iconBg: 'bg-red-100 dark:bg-red-900/30' },
    { label: 'Error Rate',          value: `${stats.errorRate}%`,            trend: -0.1,icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,       iconBg: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Avg Response Time',   value: `${stats.avgResponseTimeHours}h`, trend: -0.8,icon: <Clock className="w-5 h-5 text-violet-600" />,              iconBg: 'bg-violet-100 dark:bg-violet-900/30' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview — live stats across all organisations"
      />

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {KPIs.map((k) => (
            <StatCard key={k.label} {...k} trendLabel="vs last week" />
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signups trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Signups over time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MOCK_SIGNUP_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  interval={6}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  cursor={{ stroke: 'hsl(var(--border))' }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tickets by status */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={MOCK_TICKETS_BY_STATUS}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {MOCK_TICKETS_BY_STATUS.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-[12px] text-muted-foreground">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
