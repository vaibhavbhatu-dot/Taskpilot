export const STATUS_STYLES: Record<string, string> = {
  BACKLOG:        'text-xs font-semibold tracking-wider uppercase text-[#94A3B8]',
  TODO:           'text-xs font-semibold tracking-wider uppercase text-[#64748B]',
  IN_PROGRESS:    'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  ON_DEVELOPMENT: 'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  IN_REVIEW:      'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  QA:             'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  DESIGN:         'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  REQUIREMENTS:   'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  HTML:           'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  BUGS:           'text-xs font-semibold tracking-wider uppercase text-[#EF4444]',
  ENHANCEMENT:    'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  UAT:            'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  LIVE:           'text-xs font-semibold tracking-wider uppercase text-[#0F172A]',
  DONE:           'text-xs font-semibold tracking-wider uppercase text-[#64748B]',
  BLOCKED:        'text-xs font-semibold tracking-wider uppercase text-[#EF4444]',
  CANCELLED:      'text-xs font-semibold tracking-wider uppercase text-[#94A3B8]',
  NOT_REQUIRED:   'text-xs font-semibold tracking-wider uppercase text-[#94A3B8]',
};

export const PRIORITY_DOT_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH:     '#F97316',
  MEDIUM:   '#F59E0B',
  LOW:      '#94A3B8',
};

export type BadgeVariant = 'info' | 'warning' | 'success' | 'secondary' | 'outline' | 'error' | 'default';

export const PRIORITY_BADGE_VARIANT: Record<string, BadgeVariant> = {
  CRITICAL: 'error',
  HIGH:     'warning',
  MEDIUM:   'secondary',
  LOW:      'outline',
};
