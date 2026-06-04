import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/design-system';
import { useAuthStore } from '../../stores';

const CHECKLIST_ITEMS = [
  { id: 'create_ticket',  label: 'Create your first ticket',    link: '/tickets',       minutes: 2 },
  { id: 'move_ticket',    label: 'Move a ticket on the board',  link: '/board',         minutes: 1 },
  { id: 'invite_member',  label: 'Invite a team member',        link: '/members',       minutes: 1 },
  { id: 'start_sprint',   label: 'Check your active sprint',    link: '/sprints/active',minutes: 2 },
];

type ChecklistState = Record<string, boolean>;

export function OnboardingChecklist() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const storageKey = user ? `checklist_${user.id}` : null;

  const [completed, setCompleted] = useState<ChecklistState>(() => {
    if (!storageKey) return {};
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });

  const doneCount = CHECKLIST_ITEMS.filter((i) => completed[i.id]).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const allDone = doneCount === totalCount;
  // SVG circle circumference for r=9: 2π×9 ≈ 56.55
  const progress = doneCount / totalCount;
  const dashArray = `${progress * 56.55} 56.55`;

  function markDone(id: string) {
    setCompleted((prev) => {
      const updated = { ...prev, [id]: true };
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated));
      if (CHECKLIST_ITEMS.filter((i) => updated[i.id]).length === totalCount) {
        toast.success('Onboarding complete! 🎉', {
          description: 'You know the basics. Now go build something.',
        });
      }
      return updated;
    });
  }

  // Auto-detect completion based on navigation + dwell time
  useEffect(() => {
    const path = location.pathname;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (path === '/tickets'          && !completed.create_ticket) timeouts.push(setTimeout(() => markDone('create_ticket'),  30000));
    if (path === '/board'            && !completed.move_ticket)   timeouts.push(setTimeout(() => markDone('move_ticket'),    20000));
    if (path === '/members'          && !completed.invite_member) timeouts.push(setTimeout(() => markDone('invite_member'),  15000));
    if (path.includes('/sprints')    && !completed.start_sprint)  timeouts.push(setTimeout(() => markDone('start_sprint'),   20000));

    return () => timeouts.forEach(clearTimeout);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't show if not onboarded or all done
  if (!user?.onboardingCompleted || allDone) return null;

  return (
    <div className="mx-3 mb-3">
      {/* Collapsed header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        {/* Circular progress ring */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
            <circle
              cx="12" cy="12" r="9"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray={dashArray}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
            {doneCount}/{totalCount}
          </span>
        </div>

        <span className="text-xs font-medium text-white/80 flex-1 text-left">Get started</span>

        <ChevronDown className={cn('w-3.5 h-3.5 text-white/50 transition-transform', isExpanded && 'rotate-180')} />
      </button>

      {/* Expanded list */}
      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {CHECKLIST_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
            >
              <div className={cn(
                'w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center',
                completed[item.id] ? 'bg-[#10B981] border-[#10B981]' : 'border-white/20'
              )}>
                {completed[item.id] && <Check className="w-2.5 h-2.5 text-white" />}
              </div>

              <span className={cn(
                'text-xs flex-1',
                completed[item.id] ? 'text-white/40 line-through' : 'text-white/70'
              )}>
                {item.label}
              </span>

              {!completed[item.id] && (
                <span className="text-[10px] text-white/30">{item.minutes}m</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
