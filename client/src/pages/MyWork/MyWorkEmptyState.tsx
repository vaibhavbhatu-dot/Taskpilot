import { CheckCircle2, CalendarCheck } from 'lucide-react';

interface MyWorkEmptyStateProps {
  tab: 'due' | 'today';
  isTeamView?: boolean;
}

const config = {
  due: {
    icon: CheckCircle2,
    iconColor: '#10B981',
    heading: 'No overdue tasks',
    subtext: "You're all caught up! Great work.",
  },
  today: {
    icon: CalendarCheck,
    iconColor: '#94A3B8',
    heading: 'Nothing due today',
    subtext: "Enjoy your day or get ahead on upcoming work.",
  },
};

export function MyWorkEmptyState({ tab, isTeamView }: MyWorkEmptyStateProps) {
  const c = config[tab];
  const Icon = c.icon;

  if (isTeamView) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Icon className="w-12 h-12 mb-4" style={{ color: c.iconColor }} />
        <p className="text-[16px] font-semibold text-foreground">No tasks for the team in this view.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Icon className="w-12 h-12 mb-4" style={{ color: c.iconColor }} />
      <p className="text-[16px] font-semibold text-foreground mb-1">{c.heading}</p>
      <p className="text-[14px] text-muted-foreground">{c.subtext}</p>
    </div>
  );
}
