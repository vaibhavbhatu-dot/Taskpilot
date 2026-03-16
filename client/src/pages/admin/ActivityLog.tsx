import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { History, Clock, User as UserIcon } from 'lucide-react';

interface ActivityRecord {
  id: string;
  ticketId: string;
  changedById: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy: { id: string; fullName: string; avatar: string | null };
  ticket: { id: string; ticketNumber: string; title: string };
}

export function ActivityLog() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadActivities(); }, [page]);

  async function loadActivities() {
    setLoading(true);
    try {
      const { data } = await adminApi.getActivityLog({ page, limit: 30 });
      setActivities(data.activities);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load activity log', error);
    } finally {
      setLoading(false);
    }
  }

  function formatValue(field: string, val: string) {
    if (!val || val === 'null') return <span className="text-[#94A3B8] italic">none</span>;
    if (field === 'dueDate') return new Date(val).toLocaleDateString();
    return <span className="font-medium text-[#1E293B]">{val}</span>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-6">
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <History className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold text-[#0F172A]">System Activity Log</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">Audit trail of all ticket modifications across the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" />
          </div>
        )}

        <div className="divide-y divide-[#E2E8F0]">
          {activities.length === 0 && !loading ? (
            <div className="p-8 text-center text-[#64748B] text-[14px]">No activity recorded yet.</div>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="p-5 flex gap-4 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {activity.changedBy.avatar ? (
                    <img src={activity.changedBy.avatar} alt="Avatar" className="w-9 h-9 rounded-full bg-[#E2E8F0] border border-[#CBD5E1] object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#E2E8F0] border border-[#CBD5E1] flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-[#64748B]" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-[14px] text-[#334155] leading-relaxed">
                    <span className="font-semibold text-[#0F172A]">{activity.changedBy.fullName}</span>
                    {' updated '}
                    <span className="font-mono text-[12px] bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[#2563EB] font-medium mx-1">
                      {activity.ticket.ticketNumber}
                    </span>
                    <span className="text-[#64748B] text-[13px]">({activity.ticket.title.substring(0, 40)}{activity.ticket.title.length > 40 ? '...' : ''})</span>
                  </p>
                  
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 mt-2 w-max max-w-full text-[13px]">
                    <span className="text-[#64748B] font-medium uppercase text-[11px] tracking-wider mb-1 block">
                      {activity.fieldChanged.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="text-[#64748B] line-through decoration-[#94A3B8]">
                        {formatValue(activity.fieldChanged, activity.oldValue)}
                      </div>
                      <span className="text-[#94A3B8]">→</span>
                      <div className="text-[#0F172A]">
                        {formatValue(activity.fieldChanged, activity.newValue)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8] pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(activity.changedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[13px] font-medium text-[#0F172A] disabled:text-[#94A3B8] disabled:cursor-not-allowed hover:bg-[#E2E8F0] px-3 py-1.5 rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-[13px] text-[#64748B]">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[13px] font-medium text-[#0F172A] disabled:text-[#94A3B8] disabled:cursor-not-allowed hover:bg-[#E2E8F0] px-3 py-1.5 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
