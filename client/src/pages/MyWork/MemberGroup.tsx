import { TicketRow } from './TicketRow';
import { getInitials } from '@/design-system';

interface MemberGroupProps {
  member: {
    id: string;
    fullName: string;
    avatar?: string;
    designation?: string;
    role?: string;
  };
  tickets: any[];
  tab: 'due' | 'today';
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: 'bg-destructive/15 text-destructive',
  MANAGER: 'bg-primary/15 text-primary',
  PROJECT_MANAGER: 'bg-[hsl(var(--color-info))]/15 text-[hsl(var(--color-info))]',
  MEMBER: 'bg-muted text-muted-foreground',
};

export function MemberGroup({ member, tickets, tab }: MemberGroupProps) {
  return (
    <div className="mb-5">
      {/* Member header */}
      <div className="flex items-center justify-between pb-3 mb-0 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            {member.avatar ? (
              <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-primary">{getInitials(member.fullName)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-foreground">{member.fullName}</span>
              <span className="text-[12px] text-muted-foreground">{member.designation}</span>
              <span className="bg-muted text-muted-foreground text-[11px] font-medium px-1.5 py-0.5 rounded-full">
                {tickets.length}
              </span>
            </div>
          </div>
        </div>
        {member.role && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${ROLE_BADGE_COLORS[member.role] || ROLE_BADGE_COLORS.MEMBER}`}>
            {member.role?.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Ticket list */}
      <div className="bg-card border border-border border-t-0 rounded-b-[12px] overflow-hidden">
        {tickets.map((ticket, i) => (
          <TicketRow key={ticket.id} ticket={ticket} tab={tab} isAlt={i % 2 === 1} />
        ))}
      </div>
    </div>
  );
}
