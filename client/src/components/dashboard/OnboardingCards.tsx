import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutDashboard, UserPlus, Zap, Check } from 'lucide-react';
import { cn } from '@/design-system';
import type { User } from '../../types';

const CHECKLIST_ITEMS = [
  {
    id: 'create_ticket',
    icon: <Plus className="w-5 h-5" />,
    title: 'Create your first ticket',
    description: 'Add a task, bug, or feature to start tracking your work.',
    link: '/tickets',
    time: '2 min',
    cta: 'Create ticket',
  },
  {
    id: 'move_ticket',
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: 'Move a ticket on the board',
    description: 'Drag a ticket to a new column to update its status.',
    link: '/board',
    time: '1 min',
    cta: 'Open board',
  },
  {
    id: 'invite_member',
    icon: <UserPlus className="w-5 h-5" />,
    title: 'Invite a team member',
    description: 'TaskPilot works better with your whole team.',
    link: '/members',
    time: '1 min',
    cta: 'Invite member',
  },
  {
    id: 'start_sprint',
    icon: <Zap className="w-5 h-5" />,
    title: 'Check your active sprint',
    description: 'Your first sprint is ready with sample tickets.',
    link: '/sprints/active',
    time: '2 min',
    cta: 'View sprint',
  },
];

interface OnboardingCardsProps {
  user: User;
}

export function OnboardingCards({ user }: OnboardingCardsProps) {
  if (!user.onboardingCompleted) return null;

  const storageKey = `checklist_${user.id}`;
  const doneFlagKey = `checklist_done_${user.id}`;

  const checklistData: Record<string, boolean> = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  })();

  const checklistDone = CHECKLIST_ITEMS.filter((i) => checklistData[i.id]).length;

  const [showSuccessBanner, setShowSuccessBanner] = useState(() => {
    if (checklistDone === 4 && !localStorage.getItem(doneFlagKey)) {
      localStorage.setItem(doneFlagKey, 'true');
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (!showSuccessBanner) return;
    const t = setTimeout(() => setShowSuccessBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showSuccessBanner]);

  // All done and banner dismissed — show nothing
  if (checklistDone === 4 && !showSuccessBanner) return null;

  // All done, show success banner
  if (checklistDone === 4 && showSuccessBanner) {
    return (
      <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl">
        <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#15803D]">You're all set!</p>
          <p className="text-xs text-[#16A34A]">Your dashboard is ready with your team's data.</p>
        </div>
      </div>
    );
  }

  // In progress — show welcome banner + cards
  return (
    <div className="mb-8">
      {/* Welcome banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1E3A8A] mb-1">
              Welcome to TaskPilot, {user.fullName}!
            </h2>
            <p className="text-sm text-[#2563EB]">
              Your workspace is set up. Complete these steps to get the most out of TaskPilot.
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-2xl font-bold text-[#2563EB]">{checklistDone}/4</p>
            <p className="text-xs text-[#64748B]">steps done</p>
          </div>
        </div>
        <div className="mt-4 bg-[#BFDBFE] rounded-full h-2">
          <div
            className="bg-[#2563EB] h-2 rounded-full transition-all duration-500"
            style={{ width: `${(checklistDone / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = !!checklistData[item.id];
          return (
            <Link
              key={item.id}
              to={item.link}
              className={cn(
                'block p-5 rounded-xl border-2 transition-all duration-150',
                isDone ? 'border-[#10B981] bg-[#F0FDF4]' : 'border-[#E2E8F0] bg-white',
                'hover:border-[#2563EB] hover:shadow-sm'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  isDone ? 'bg-[#10B981] text-white' : 'bg-[#EFF6FF] text-[#2563EB]'
                )}>
                  {isDone ? <Check className="w-5 h-5" /> : item.icon}
                </div>
                <span className="text-xs text-[#94A3B8]">{isDone ? 'Done ✓' : item.time}</span>
              </div>
              <h3 className={cn(
                'text-sm font-semibold mb-1',
                isDone ? 'text-[#15803D] line-through' : 'text-[#0F172A]'
              )}>
                {item.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-3">{item.description}</p>
              {!isDone && (
                <span className="text-xs font-medium text-[#2563EB]">{item.cta} →</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
