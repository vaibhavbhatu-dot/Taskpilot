interface MyWorkTabsProps {
  activeTab: 'due' | 'today';
  onTabChange: (tab: 'due' | 'today') => void;
  counts: { due: number; today: number };
}

const tabs: { key: 'due' | 'today'; label: string }[] = [
  { key: 'due', label: 'Due Task' },
  { key: 'today', label: "Today's Task" },
];

export function MyWorkTabs({ activeTab, onTabChange, counts }: MyWorkTabsProps) {
  return (
    <div className="inline-flex bg-card border border-border rounded-[10px] p-1">
      {tabs.map(({ key, label }) => {
        const isActive = activeTab === key;
        const count = counts[key];
        const isDueBadge = key === 'due' && count > 0;

        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                isActive
                  ? 'bg-card/20 text-white'
                  : isDueBadge
                    ? 'bg-destructive text-white'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
