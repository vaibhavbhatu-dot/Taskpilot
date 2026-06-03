import { TicketRow } from './TicketRow';

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
  ADMIN: 'bg-[#FEE2E2] text-[#DC2626]',
  MANAGER: 'bg-[#DBEAFE] text-[#2563EB]',
  PROJECT_MANAGER: 'bg-[#EDE9FE] text-[#7C3AED]',
  MEMBER: 'bg-[#F1F5F9] text-[#64748B]',
};

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function MemberGroup({ member, tickets, tab }: MemberGroupProps) {
  return (
    <div className="mb-5">
      {/* Member header */}
      <div className="flex items-center justify-between pb-3 mb-0 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
            {member.avatar ? (
              <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-[#2563EB]">{getInitials(member.fullName)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#0F172A]">{member.fullName}</span>
              <span className="text-[12px] text-[#64748B]">{member.designation}</span>
              <span className="bg-[#F1F5F9] text-[#64748B] text-[11px] font-medium px-1.5 py-0.5 rounded-full">
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
      <div className="bg-white border border-[#E2E8F0] border-t-0 rounded-b-[12px] overflow-hidden">
        {tickets.map((ticket, i) => (
          <TicketRow key={ticket.id} ticket={ticket} tab={tab} isAlt={i % 2 === 1} />
        ))}
      </div>
    </div>
  );
}
