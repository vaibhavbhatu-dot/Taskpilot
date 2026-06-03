import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores';
import { PageHeader } from '../../components/ui/PageHeader';
import { useMyWorkTickets } from '../../hooks/useMyWork';
import { MyWorkTabs } from './MyWorkTabs';
import { MyWorkFilters } from './MyWorkFilters';
import { MyWorkSkeleton } from './MyWorkSkeleton';
import { MyWorkEmptyState } from './MyWorkEmptyState';
import { TicketRow } from './TicketRow';
import { MemberGroup } from './MemberGroup';

type Tab = 'due' | 'today';

export function MyWorkPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const showFilters = isAdmin || isManager;

  const [activeTab, setActiveTab] = useState<Tab>('due');
  const [teamId, setTeamId] = useState('');
  const [memberId, setMemberId] = useState('');

  // For manager: auto-select their team
  useEffect(() => {
    if (isManager && user?.teamId) {
      setTeamId(user.teamId);
    }
  }, [isManager, user?.teamId]);

  // Build query params
  const queryParams: Record<string, string | undefined> = {
    tab: activeTab,
  };

  if (showFilters) {
    if (memberId) {
      queryParams.userId = memberId;
    } else if (teamId) {
      queryParams.teamId = teamId;
    }
    // If admin with no team and no member selected, don't pass userId
    // so backend returns all tasks
  }

  const { data, isLoading, isError, refetch } = useMyWorkTickets({
    tab: activeTab,
    userId: queryParams.userId,
    teamId: queryParams.teamId,
  });

  const tickets = data?.tickets || [];
  const counts = data?.counts || { due: 0, today: 0 };

  // Determine if we're in "all members" view (showing grouped by member)
  // This happens when: admin/manager AND (team selected with no member, OR no filters at all)
  const isTeamView = showFilters && !memberId;

  // Group tickets by member for team view
  const memberGroups = isTeamView ? groupByMember(tickets) : null;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Work" subtitle="Track and manage your pending tasks." />

      {/* Filters (Admin/Manager only) */}
      {showFilters && (
        <MyWorkFilters
          teamId={teamId}
          memberId={memberId}
          onTeamChange={setTeamId}
          onMemberChange={setMemberId}
          isManager={isManager}
        />
      )}

      {/* Tabs */}
      <MyWorkTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {/* Content */}
      {isLoading ? (
        <MyWorkSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-[16px] font-semibold text-foreground mb-3">Failed to load tasks</p>
          <button
            onClick={() => refetch()}
            className="h-9 px-5 bg-primary hover:bg-primary/90 text-white text-[14px] font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <MyWorkEmptyState tab={activeTab} isTeamView={!!isTeamView} />
      ) : isTeamView && memberGroups ? (
        <div className="space-y-5">
          {memberGroups.map((group) => (
            <MemberGroup
              key={group.member.id}
              member={group.member}
              tickets={group.tickets}
              tab={activeTab}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[12px] overflow-hidden">
          {tickets.map((ticket: any, i: number) => (
            <TicketRow key={ticket.id} ticket={ticket} tab={activeTab} isAlt={i % 2 === 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function groupByMember(tickets: any[]) {
  const map = new Map<string, { member: any; tickets: any[] }>();

  for (const ticket of tickets) {
    if (!ticket.assignee) continue;
    const id = ticket.assignee.id;
    if (!map.has(id)) {
      map.set(id, {
        member: ticket.assignee,
        tickets: [],
      });
    }
    map.get(id)!.tickets.push(ticket);
  }

  return Array.from(map.values());
}
