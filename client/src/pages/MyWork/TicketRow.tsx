import { useNavigate } from 'react-router-dom';
import { STATUS_CONFIG, getStatusLabel } from '../../constants/ticketStatus';
import type { TicketStatus } from '../../types';

interface TicketRowProps {
  ticket: any;
  tab: 'due' | 'today';
  isAlt: boolean;
}

const PRIORITY_DOTS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#94A3B8',
};

function getDueDateDisplay(dueDate: string, tab: string) {
  if (tab === 'today') {
    return { text: 'Today', className: 'text-[hsl(var(--color-warning))]' };
  }
  // Due tab — overdue
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = now.getTime() - due.getTime();
  const days = Math.max(1, Math.ceil(diffMs / 86400000));
  return {
    text: `${days} day${days > 1 ? 's' : ''} overdue`,
    className: 'text-destructive bg-destructive/10 px-1.5 py-0.5 rounded',
  };
}

export function TicketRow({ ticket, tab, isAlt }: TicketRowProps) {
  const navigate = useNavigate();
  const statusCfg = STATUS_CONFIG[ticket.status as TicketStatus];
  const dueDateDisplay = ticket.dueDate ? getDueDateDisplay(ticket.dueDate, tab) : null;

  return (
    <div
      className={`flex items-center h-[52px] px-4 cursor-pointer hover:bg-muted/50 transition-colors ${isAlt ? 'bg-muted/30' : 'bg-card'} border-t border-muted first:border-t-0`}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: PRIORITY_DOTS[ticket.priority] || '#94A3B8' }}
        />
        <span
          className="text-[12px] font-mono font-medium text-primary flex-shrink-0 cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
        >
          {ticket.ticketNumber}
        </span>
        <span className="text-[14px] font-medium text-foreground truncate">
          {ticket.title}
        </span>
        {ticket.project && (
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[11px] font-semibold">
            {ticket.project.key}
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        {statusCfg && (
          <span
            className="px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
          >
            {getStatusLabel(ticket.status)}
          </span>
        )}
        {ticket.sprint && (
          <span className="text-[12px] text-muted-foreground whitespace-nowrap">{ticket.sprint.name}</span>
        )}
        {dueDateDisplay && (
          <span className={`text-[12px] font-medium whitespace-nowrap ${dueDateDisplay.className}`}>
            {dueDateDisplay.text}
          </span>
        )}
      </div>
    </div>
  );
}
