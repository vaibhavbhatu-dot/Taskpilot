import { useMyWorkTeams, useMyWorkMembers } from '../../hooks/useMyWork';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/design-system';

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
      <Select
        value={teamId || '_all'}
        disabled={isManager}
        onValueChange={(val) => {
          onTeamChange(val === '_all' ? '' : val);
          onMemberChange('');
        }}
      >
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!isManager && <SelectItem value="_all">All Teams</SelectItem>}
          {(teams as any[]).map((t: any) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={memberId || '_all'}
        onValueChange={(val) => onMemberChange(val === '_all' ? '' : val)}
      >
        <SelectTrigger className="w-[200px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Members</SelectItem>
          {(members as any[]).map((m: any) => (
            <SelectItem key={m.id} value={m.id}>
              {m.fullName}{m.designation ? ` · ${m.designation}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
