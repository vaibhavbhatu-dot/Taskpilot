import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code, Palette, Megaphone, Briefcase,
  Zap, LayoutDashboard, Sparkles,
  User, Users, Building,
  CheckCircle2, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Stepper, cn } from '@/design-system';
import { onboardingApi } from '../../api';
import { useAuthStore } from '../../stores';

const STEPS = [
  { label: 'Sign up' },
  { label: 'Verify' },
  { label: 'Profile' },
  { label: 'Workspace' },
];

const LOADING_MESSAGES = [
  'Setting up your workspace...',
  'Creating your first project...',
  'Adding sample tickets...',
  'Configuring your workflow...',
  'Almost ready...',
];

const TEAM_TYPES = [
  { value: 'software',  label: 'Software team',   icon: <Code className="w-5 h-5" />,     desc: 'Build and ship products' },
  { value: 'design',    label: 'Design team',      icon: <Palette className="w-5 h-5" />,  desc: 'Create and iterate on UX' },
  { value: 'marketing', label: 'Marketing team',   icon: <Megaphone className="w-5 h-5" />,desc: 'Campaigns and content' },
  { value: 'other',     label: 'Other team',       icon: <Briefcase className="w-5 h-5" />,desc: 'General project management' },
];

const WORK_STYLES = [
  { value: 'scrum',   label: 'We use sprints',          icon: <Zap className="w-5 h-5" />,               desc: '2-week cycles, daily standups, sprint reviews' },
  { value: 'kanban',  label: 'Continuous flow',         icon: <LayoutDashboard className="w-5 h-5" />,    desc: 'Work flows through stages, no fixed timeboxes' },
  { value: 'starter', label: 'Just getting started',    icon: <Sparkles className="w-5 h-5" />,           desc: "We're new to project management tools" },
];

const TEAM_SIZES = [
  { value: 'solo',   label: 'Just me', icon: <User className="w-4 h-4" /> },
  { value: 'small',  label: '2–5',     icon: <Users className="w-4 h-4" /> },
  { value: 'medium', label: '6–20',    icon: <Users className="w-4 h-4" /> },
  { value: 'large',  label: '20+',     icon: <Building className="w-4 h-4" /> },
];

export function OnboardingWorkspacePage() {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ teamType: '', workStyle: '', teamSize: '' });
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (msgRef.current) clearInterval(msgRef.current);
    };
  }, []);

  function startProgressAnimation() {
    setProgress(0);
    setMsgIndex(0);

    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) { clearInterval(progressRef.current!); return 95; }
        return p + 2;
      });
    }, 100);

    msgRef.current = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1500);
  }

  async function handleGenerateWorkspace(teamSize: string) {
    const finalAnswers = { ...answers, teamSize };
    setStep(3);
    startProgressAnimation();

    try {
      await onboardingApi.generate({
        teamType: finalAnswers.teamType,
        workStyle: finalAnswers.workStyle,
        teamSize: finalAnswers.teamSize,
      });

      clearInterval(progressRef.current!);
      clearInterval(msgRef.current!);
      setProgress(100);
      updateUser({ onboardingCompleted: true });
      setTimeout(() => setStep(4), 500);
    } catch {
      toast.error('Setup failed — skipping to dashboard');
      navigate('/');
    }
  }

  // ── Q1: Team type ─────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <PageShell>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#0F172A]">What kind of team are you?</h2>
          <p className="text-sm text-[#64748B] mt-1">We'll set up the right workflow for you</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TEAM_TYPES.map((t) => (
            <OptionCard
              key={t.value}
              selected={answers.teamType === t.value}
              icon={t.icon}
              label={t.label}
              desc={t.desc}
              onClick={() => {
                setAnswers((a) => ({ ...a, teamType: t.value }));
                setStep(1);
              }}
            />
          ))}
        </div>
      </PageShell>
    );
  }

  // ── Q2: Work style ────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <PageShell>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#0F172A]">How does your team work?</h2>
          <p className="text-sm text-[#64748B] mt-1">Choose the workflow style that fits best</p>
        </div>
        <div className="flex flex-col gap-3">
          {WORK_STYLES.map((w) => (
            <OptionCard
              key={w.value}
              selected={answers.workStyle === w.value}
              icon={w.icon}
              label={w.label}
              desc={w.desc}
              horizontal
              onClick={() => {
                setAnswers((a) => ({ ...a, workStyle: w.value }));
                setStep(2);
              }}
            />
          ))}
        </div>
      </PageShell>
    );
  }

  // ── Q3: Team size ─────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <PageShell>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#0F172A]">How big is your team?</h2>
          <p className="text-sm text-[#64748B] mt-1">Helps us tailor the initial setup</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {TEAM_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setAnswers((a) => ({ ...a, teamSize: s.value }));
                handleGenerateWorkspace(s.value);
              }}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                'border-[#E2E8F0] bg-white hover:border-[#2563EB]/50 hover:bg-[#EFF6FF]'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center">
                {s.icon}
              </div>
              <p className="text-sm font-medium text-[#0F172A]">{s.label}</p>
            </button>
          ))}
        </div>
      </PageShell>
    );
  }

  // ── Generating ────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#2563EB] animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-[#0F172A]">{LOADING_MESSAGES[msgIndex]}</p>
            <p className="text-sm text-[#94A3B8] mt-1">This takes about 5 seconds</p>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 mt-2">
            <div
              className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="flex flex-col items-center py-8 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#0F172A]">Your workspace is ready!</h3>
          <p className="text-sm text-[#64748B] mt-1">
            We've set up a sample project with tickets and a sprint to get you started.
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => navigate('/')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Go to my workspace
        </Button>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-[#94A3B8] hover:text-[#64748B]"
        >
          I'll set up manually
        </button>
      </div>
    </PageShell>
  );
}

// ── Shared layout shell ───────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563EB] mb-4">
            <span className="text-white font-bold text-xl">TP</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
          <div className="mb-8">
            <Stepper steps={STEPS} currentStep={3} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Reusable option card ──────────────────────────────────────────────────────
function OptionCard({
  selected, icon, label, desc, horizontal = false, onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  desc: string;
  horizontal?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border-2 transition-all cursor-pointer text-left',
        horizontal ? 'flex items-center gap-4 p-4' : 'flex flex-col items-center gap-2 p-4 text-center',
        selected ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-white hover:border-[#2563EB]/40'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
        selected ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
      )}>
        {icon}
      </div>
      <div>
        <p className={cn('text-sm font-medium', selected ? 'text-[#2563EB]' : 'text-[#0F172A]')}>{label}</p>
        <p className="text-xs text-[#94A3B8] mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
