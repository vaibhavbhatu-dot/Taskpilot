import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bug, Layers, Calendar, ChevronRight, Activity } from 'lucide-react';
import { dashboardApi, sprintsApi } from '../../api';
import { Skeleton } from '../ui/Skeleton';
import type { DashboardData, Sprint } from '../../types';
import { STATUS_CONFIG } from '../../constants/ticketStatus';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-400',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-gray-300',
};

const PRIORITY_TEXT: Record<string, string> = {
  CRITICAL: 'text-red-600',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-gray-400',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0,1].map(i => (
          <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-12 w-full" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, sprintRes] = await Promise.all([
          dashboardApi.getData(),
          sprintsApi.list({ status: 'ACTIVE' }).catch(() => ({ data: [] })),
        ]);
        setData(dashRes.data);
        setActiveSprint(sprintRes.data[0] || null);
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) return <DashboardSkeleton />;

  const byStatus = data.ticketsByStatus as Record<string, number>;

  // Active Tickets = not in backlog, live, or not_required
  const activeTickets = data.kpis.totalTickets
    - (byStatus.BACKLOG || 0)
    - (byStatus.LIVE || 0)
    - (byStatus.NOT_REQUIRED || 0);

  const bugsCount = byStatus.BUGS || 0;

  // Days remaining in active sprint
  const daysLeft = activeSprint?.endDate
    ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / 86400000))
    : null;

  // Pipeline columns (exclude BACKLOG, LIVE, NOT_REQUIRED from pipeline view)
  const pipelineStatuses = ['REQUIREMENTS', 'DESIGN', 'HTML', 'ON_DEVELOPMENT', 'QA', 'BUGS', 'ENHANCEMENT', 'UAT'] as const;
  const pipelineMax = Math.max(...pipelineStatuses.map(s => byStatus[s] || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Row 1: KPI Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Active Tickets */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Active Tickets</span>
          </div>
          <p className="text-[32px] font-bold text-[#0F172A] leading-none mb-1">{activeTickets}</p>
          <p className="text-[12px] text-[#94A3B8]">Currently in progress</p>
        </div>

        {/* Overdue */}
        <div className={`rounded-xl border p-5 hover:shadow-sm transition-shadow ${
          data.kpis.overdueTickets > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.kpis.overdueTickets > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-4 h-4 ${data.kpis.overdueTickets > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <span className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Overdue</span>
          </div>
          <p className={`text-[32px] font-bold leading-none mb-1 ${data.kpis.overdueTickets > 0 ? 'text-red-600' : 'text-[#0F172A]'}`}>
            {data.kpis.overdueTickets}
          </p>
          <p className="text-[12px] text-[#94A3B8]">{data.kpis.overdueTickets > 0 ? 'Need immediate attention' : 'All on track'}</p>
        </div>

        {/* Active Sprint */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Active Sprint</span>
          </div>
          {activeSprint ? (
            <>
              <p className="text-[16px] font-bold text-[#0F172A] leading-none mb-1 truncate">{activeSprint.name}</p>
              <p className={`text-[12px] font-medium ${daysLeft !== null && daysLeft <= 2 ? 'text-orange-500' : 'text-[#94A3B8]'}`}>
                {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'No end date set'}
              </p>
            </>
          ) : (
            <>
              <p className="text-[16px] font-bold text-[#94A3B8] leading-none mb-1">No sprint</p>
              <p className="text-[12px] text-[#94A3B8]">Start one in Sprint Planning</p>
            </>
          )}
        </div>

        {/* Bugs */}
        <div className={`rounded-xl border p-5 hover:shadow-sm transition-shadow ${
          bugsCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bugsCount > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <Bug className={`w-4 h-4 ${bugsCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            <span className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Bugs</span>
          </div>
          <p className={`text-[32px] font-bold leading-none mb-1 ${bugsCount > 0 ? 'text-orange-600' : 'text-[#0F172A]'}`}>
            {bugsCount}
          </p>
          <p className="text-[12px] text-[#94A3B8]">{bugsCount > 0 ? 'Open bugs to fix' : 'No open bugs'}</p>
        </div>
      </div>

      {/* ── Row 2: Ticket Pipeline ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">Ticket Pipeline</h3>
          <div className="flex items-center gap-4 text-[12px] text-[#64748B]">
            <span>{byStatus.BACKLOG || 0} in Backlog</span>
            <span className="text-green-600 font-medium">{byStatus.LIVE || 0} Live</span>
            <span className="text-gray-400">{byStatus.NOT_REQUIRED || 0} Not Required</span>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-3">
          {pipelineStatuses.map(status => {
            const count = byStatus[status] || 0;
            const config = STATUS_CONFIG[status];
            const barHeight = pipelineMax > 0 ? Math.max(4, Math.round((count / pipelineMax) * 80)) : 4;
            return (
              <div key={status} className="flex flex-col items-center gap-2">
                {/* Bar */}
                <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: config.bg,
                      border: `1px solid ${config.text}20`,
                    }}
                  />
                </div>
                {/* Count badge */}
                <span className="text-[16px] font-bold" style={{ color: count > 0 ? config.text : '#CBD5E1' }}>
                  {count}
                </span>
                {/* Label */}
                <span className="text-[10px] text-center text-[#94A3B8] leading-tight font-medium">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 3: Overdue List + Recent Activity ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Overdue Tickets */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-[15px] font-semibold text-[#0F172A] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Overdue Tickets
              {data.overdueTicketsList.length > 0 && (
                <span className="text-[11px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                  {data.overdueTicketsList.length}
                </span>
              )}
            </h3>
            <button onClick={() => navigate('/tickets')} className="text-[12px] text-[#2563EB] hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {data.overdueTicketsList.length > 0 ? (
            <div className="divide-y divide-[#F1F5F9]">
              {data.overdueTicketsList.map(ticket => {
                const daysOverdue = ticket.dueDate
                  ? Math.ceil((Date.now() - new Date(ticket.dueDate).getTime()) / 86400000)
                  : 0;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFF5F5] cursor-pointer transition-colors group"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[ticket.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#94A3B8]">{ticket.ticketNumber}</span>
                        <span className={`text-[10px] font-semibold ${PRIORITY_TEXT[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-[#0F172A] truncate group-hover:text-red-600 transition-colors">
                        {ticket.title}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[11px] font-bold text-red-500">{daysOverdue}d overdue</span>
                      {ticket.assignedTo && (
                        <span className="text-[11px] text-[#94A3B8]">{ticket.assignedTo.fullName.split(' ')[0]}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-[#0F172A] mb-1">All caught up!</p>
              <p className="text-[12px] text-[#94A3B8]">No overdue tickets right now</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-[15px] font-semibold text-[#0F172A] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#64748B]" />
              Recent Activity
            </h3>
            <span className="text-[12px] text-[#94A3B8]">Last 10 changes</span>
          </div>
          {data.recentActivity.length > 0 ? (
            <div className="divide-y divide-[#F1F5F9] overflow-y-auto max-h-[340px]">
              {data.recentActivity.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/tickets/${entry.ticket?.id}`)}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#2563EB]">
                      {entry.changedBy?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0,2) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#0F172A] leading-snug">
                      <span className="font-semibold">{entry.changedBy?.fullName}</span>
                      <span className="text-[#64748B]"> changed </span>
                      <span className="font-medium text-[#2563EB] hover:underline">{entry.ticket?.ticketNumber}</span>
                      <span className="text-[#64748B]"> {entry.fieldChanged}</span>
                    </p>
                    {entry.oldValue && entry.newValue && (
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        <span className="line-through">{entry.oldValue.replace(/_/g,' ')}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium text-[#475569]">{entry.newValue.replace(/_/g,' ')}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-[#94A3B8] flex-shrink-0 whitespace-nowrap">
                    {new Date(entry.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-[#94A3B8]" />
              </div>
              <p className="text-[14px] font-medium text-[#0F172A] mb-1">No activity yet</p>
              <p className="text-[12px] text-[#94A3B8]">Changes will appear here</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
