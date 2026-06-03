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
    <div className="inline-flex bg-white border border-[#E2E8F0] rounded-[10px] p-1">
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
                ? 'bg-[#2563EB] text-white'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {label}
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                isActive
                  ? 'bg-white/20 text-white'
                  : isDueBadge
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B]'
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
