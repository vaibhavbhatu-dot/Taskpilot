import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { Clock, User as UserIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';

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
    if (!val || val === 'null') return <span className="text-muted-foreground italic">none</span>;
    if (field === 'dueDate') return new Date(val).toLocaleDateString();
    return <span className="font-medium text-foreground">{val}</span>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-6">
      <PageHeader title="Activity Log" subtitle="Audit trail of all ticket modifications across the platform." />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" />
          </div>
        )}

        <div className="divide-y divide-border">
          {activities.length === 0 && !loading ? (
            <div className="p-8 text-center text-muted-foreground text-[14px]">No activity recorded yet.</div>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="p-5 flex gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {activity.changedBy.avatar ? (
                    <img src={activity.changedBy.avatar} alt="Avatar" className="w-9 h-9 rounded-full bg-muted border border-border object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-[14px] text-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">{activity.changedBy.fullName}</span>
                    {' updated '}
                    <span className="font-mono text-[12px] bg-muted px-1.5 py-0.5 rounded text-primary font-medium mx-1">
                      {activity.ticket.ticketNumber}
                    </span>
                    <span className="text-muted-foreground text-[13px]">({activity.ticket.title.substring(0, 40)}{activity.ticket.title.length > 40 ? '...' : ''})</span>
                  </p>
                  
                  <div className="bg-muted/50 border border-border rounded-md px-3 py-2 mt-2 w-max max-w-full text-[13px]">
                    <span className="text-muted-foreground font-medium uppercase text-[11px] tracking-wider mb-1 block">
                      {activity.fieldChanged.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground line-through decoration-muted-foreground">
                        {formatValue(activity.fieldChanged, activity.oldValue)}
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="text-foreground">
                        {formatValue(activity.fieldChanged, activity.newValue)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(activity.changedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/50">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[13px] font-medium text-foreground disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-[13px] text-muted-foreground">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[13px] font-medium text-foreground disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
