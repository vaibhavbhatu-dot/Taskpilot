import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { dashboardApi, ticketsApi } from '../../api';
import { useAuthStore } from '../../stores';
import { Skeleton } from '../ui/Skeleton';
import type { DashboardData, Ticket } from '../../types';

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
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [dashRes, myTicketsRes] = await Promise.all([
          dashboardApi.getData(),
          ticketsApi.list({ assignedToId: user.id, status: 'IN_PROGRESS,TODO', limit: '4' }),
        ]);
        setData(dashRes.data);
        if (myTicketsRes.data?.tickets) {
          setActiveTickets(myTicketsRes.data.tickets.slice(0, 4));
        }
      } catch (error) {
        console.error('Member dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading || !data) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="w-4 h-4 text-blue-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">My Assigned</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{data.kpis.totalTickets}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{data.kpis.inProgressTickets}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-[13px] font-medium text-[#64748B] uppercase tracking-wider">Done</span>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{data.kpis.doneTickets}</p>
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[15px] text-[#0F172A]">My Active Tickets</h3>
            <button onClick={() => navigate('/tickets')} className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {activeTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-[#64748B]">
                <CheckCircle2 className="w-8 h-8 text-[#E2E8F0] mb-2" />
                <p className="text-sm">You have no active tickets</p>
              </div>
            ) : (
              activeTickets.map(ticket => (
                <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm cursor-pointer transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[12px] font-mono font-medium text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      ticket.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h4 className="font-medium text-[#0F172A] text-[14px] line-clamp-1 group-hover:text-[#2563EB] transition-colors">{ticket.title}</h4>
                  <div className="flex items-center justify-between mt-3 text-[12px] text-[#64748B]">
                    <span>{ticket.project?.name}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col">
          <h3 className="font-semibold text-[15px] text-[#0F172A] mb-4">Recent Activity</h3>
          <div className="flex-1">
            {data.recentActivity.length === 0 ? (
              <div className="flex items-center justify-center h-full py-8 text-[#64748B] text-sm">
                No recent activity
              </div>
            ) : (
              <div className="relative border-l-2 border-[#E2E8F0] ml-3 mt-2 space-y-6 pb-2">
                {data.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={activity.id || index} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#2563EB]" />
                    <div className="mb-1">
                      <span className="font-medium text-[13px] text-[#0F172A] mr-1">{activity.changedBy?.fullName || 'User'}</span>
                      <span className="text-[13px] text-[#64748B]">updated</span>
                      <span className="font-medium text-[13px] text-[#0F172A] mx-1">{activity.fieldChanged}</span>
                      <span className="text-[13px] text-[#64748B]">on</span>
                      <span className="text-[13px] font-mono text-[#2563EB] ml-1 bg-blue-50 px-1.5 py-0.5 rounded">
                        {activity.ticket?.ticketNumber || 'Ticket'}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-[#94A3B8]">
                      {new Date(activity.changedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
