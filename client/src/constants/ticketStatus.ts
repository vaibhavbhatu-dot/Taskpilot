import type { TicketStatus } from '../types';

export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
}

export const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  BACKLOG: {
    label: 'Backlog',
    bg: '#F1F5F9',
    text: '#64748B',
  },
  REQUIREMENTS: {
    label: 'Requirements',
    bg: '#EDE9FE',
    text: '#7C3AED',
  },
  DESIGN: {
    label: 'Design',
    bg: '#FAE8FF',
    text: '#A21CAF',
  },
  HTML: {
    label: 'HTML',
    bg: '#FFF7ED',
    text: '#C2410C',
  },
  ON_DEVELOPMENT: {
    label: 'On Development',
    bg: '#FEF9C3',
    text: '#CA8A04',
  },
  QA: {
    label: 'QA',
    bg: '#E0E7FF',
    text: '#4338CA',
  },
  BUGS: {
    label: 'Bugs',
    bg: '#FEE2E2',
    text: '#DC2626',
  },
  ENHANCEMENT: {
    label: 'Enhancement',
    bg: '#DBEAFE',
    text: '#2563EB',
  },
  UAT: {
    label: 'UAT',
    bg: '#D1FAE5',
    text: '#059669',
  },
  LIVE: {
    label: 'Live',
    bg: '#DCFCE7',
    text: '#16A34A',
  },
  NOT_REQUIRED: {
    label: 'Not Required',
    bg: '#F3F4F6',
    text: '#6B7280',
  },
};

export const TICKET_STATUSES = Object.keys(STATUS_CONFIG) as TicketStatus[];

export function getStatusLabel(status: TicketStatus): string {
  return STATUS_CONFIG[status]?.label || status.replace(/_/g, ' ');
}

export function getStatusBadgeClasses(status: TicketStatus): string {
  const config = STATUS_CONFIG[status];
  if (!config) return '';
  return `background-color: ${config.bg}; color: ${config.text};`;
}
