import { useMyWorkTeams, useMyWorkMembers } from '../../hooks/useMyWork';

interface MyWorkFiltersProps {
  teamId: string;
  memberId: string;
  onTeamChange: (teamId: string) => void;
  onMemberChange: (memberId: string) => void;
  isManager: boolean;
}

export function MyWorkFilters({ teamId, memberId, onTeamChange, onMemberChange, isManager }: MyWorkFiltersProps) {
  const { data: teams = [] } = useMyWorkTeams();
  const { data: members = [] } = useMyWorkMembers(teamId || undefined);

  return (
    <div className="flex items-center gap-3">
      <select
        value={teamId}
        onChange={(e) => {
          onTeamChange(e.target.value);
          onMemberChange('');
        }}
        disabled={isManager}
        className="h-9 px-3 text-[13px] border border-border rounded-lg bg-card text-foreground focus:ring-1 focus:ring-primary outline-none disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {!isManager && <option value="">All Teams</option>}
        {(teams as any[]).map((t: any) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <select
        value={memberId}
        onChange={(e) => onMemberChange(e.target.value)}
        className="h-9 px-3 text-[13px] border border-border rounded-lg bg-card text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[200px]"
      >
        <option value="">All Members</option>
        {(members as any[]).map((m: any) => (
          <option key={m.id} value={m.id}>
            {m.fullName}{m.designation ? ` · ${m.designation}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
