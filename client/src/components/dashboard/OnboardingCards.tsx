import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderPlus, UserPlus, Zap, Check } from 'lucide-react';
import { cn } from '@/design-system';
import type { User } from '../../types';

const CHECKLIST_ITEMS = [
  {
    id: 'invite_member',
    icon: <UserPlus className="w-4 h-4" />,
    title: 'Invite a team member',
    description: 'Add your team so you can assign tickets and collaborate.',
    link: '/members',
    time: '1 min',
    cta: 'Invite member',
  },
  {
    id: 'create_project',
    icon: <FolderPlus className="w-4 h-4" />,
    title: 'Create a project',
    description: 'Organise your work into a project with a name and key.',
    link: '/projects',
    time: '1 min',
    cta: 'Create project',
  },
  {
    id: 'create_ticket',
    icon: <Plus className="w-4 h-4" />,
    title: 'Create your first ticket',
    description: 'Add a task, bug, or feature to start tracking your work.',
    link: '/tickets',
    time: '2 min',
    cta: 'Create ticket',
  },
  {
    id: 'start_sprint',
    icon: <Zap className="w-4 h-4" />,
    title: 'Plan your sprints',
    description: 'Move tickets into a sprint and start your first cycle.',
    link: '/sprints/planning',
    time: '2 min',
    cta: 'Go to planning',
  },
];

interface OnboardingCardsProps {
  user: User;
}

export function OnboardingCards({ user }: OnboardingCardsProps) {
  if (!user.onboardingCompleted) return null;

  const storageKey = `checklist_${user.id}`;
  const doneFlagKey = `checklist_done_${user.id}`;

  function readChecklist(): Record<string, boolean> {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  }

  // Migrate old IDs (move_ticket → create_project) once on first load
  function migrateChecklist() {
    const data = readChecklist();
    if (data.move_ticket && !data.create_project) {
      localStorage.setItem(storageKey, JSON.stringify({ ...data, create_project: true }));
    }
  }

  const [checklistData, setChecklistData] = useState<Record<string, boolean>>(() => {
    migrateChecklist();
    return readChecklist();
  });

  // Re-read whenever an action page fires checklist-updated
  useEffect(() => {
    function handleUpdate() { setChecklistData(readChecklist()); }
    window.addEventListener('checklist-updated', handleUpdate);
    return () => window.removeEventListener('checklist-updated', handleUpdate);
  }, []);

  const checklistDone = CHECKLIST_ITEMS.filter((i) => checklistData[i.id]).length;

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Show success banner the first time all 4 are completed
  useEffect(() => {
    if (checklistDone === 4 && !localStorage.getItem(doneFlagKey)) {
      localStorage.setItem(doneFlagKey, 'true');
      setShowSuccessBanner(true);
    }
  }, [checklistDone]);

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

  // In progress — welcome banner + cards unified in one box
  return (
    <div className="mb-8 bg-white border-2 border-[#BFDBFE] rounded-2xl overflow-hidden">

      {/* Welcome banner — top */}
      <div className="bg-[#EFF6FF] px-6 py-5 border-b border-[#BFDBFE]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1E3A8A] mb-1">
              Welcome to TaskPilot, {user.fullName}!
            </h2>
            <p className="text-sm text-[#2563EB]">
              Complete these steps to get the most out of TaskPilot.
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-6">
            <p className="text-2xl font-bold text-[#2563EB]">{checklistDone}/4</p>
            <p className="text-xs text-[#64748B]">steps done</p>
          </div>
        </div>
        <div className="mt-3 bg-[#BFDBFE] rounded-full h-1.5">
          <div
            className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(checklistDone / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist cards — bottom, divided by lines */}
      <div className="grid grid-cols-4 gap-0 divide-x divide-[#E2E8F0]">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = !!checklistData[item.id];
          return (
            <Link
              key={item.id}
              to={item.link}
              className={cn(
                'block p-5 transition-all',
                isDone ? 'bg-[#F0FDF4]' : 'bg-white hover:bg-[#F8FAFC]',
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  isDone ? 'bg-[#10B981] text-white' : 'bg-[#EFF6FF] text-[#2563EB]',
                )}>
                  {isDone ? <Check className="w-4 h-4" /> : item.icon}
                </div>
                <span className="text-xs text-[#94A3B8]">{isDone ? '✓' : item.time}</span>
              </div>
              <h3 className={cn(
                'text-sm font-semibold mb-1',
                isDone ? 'text-[#15803D] line-through' : 'text-[#0F172A]',
              )}>
                {item.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-2">{item.description}</p>
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
