import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, User, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FormField, Input, Stepper, AISuggestionChip, cn } from '@/design-system';
import { usersApi } from '../../api';
import { useAuthStore } from '../../stores';

const STEPS = [
  { label: 'Sign up' },
  { label: 'Verify' },
  { label: 'Profile' },
  { label: 'Workspace' },
];

type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';

const ROLE_META: Record<Role, { icon: React.ReactNode; desc: string }> = {
  ADMIN:   { icon: <Shield className="w-5 h-5" />,  desc: 'Full control' },
  MANAGER: { icon: <Users className="w-5 h-5" />,   desc: 'Manage team' },
  MEMBER:  { icon: <User className="w-5 h-5" />,    desc: 'Do the work' },
};

function suggestRole(designation: string): Role {
  const d = designation.toLowerCase();
  if (d.includes('manager') || d.includes('lead') || d.includes('head') ||
      d.includes('director') || d.includes('vp') || d.includes('cto') || d.includes('ceo'))
    return 'MANAGER';
  if (d.includes('admin') || d.includes('owner'))
    return 'ADMIN';
  return 'MEMBER';
}

const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [designation, setDesignation] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [suggestedRole, setSuggestedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleDesignationChange(val: string) {
    setDesignation(val);
    if (val.length >= 3) {
      const suggestion = suggestRole(val);
      setSuggestedRole(suggestion !== selectedRole ? suggestion : null);
    } else {
      setSuggestedRole(null);
    }
  }

  async function handleSubmit() {
    try {
      setIsSaving(true);
      const res = await usersApi.updateProfile({
        designation,
        role: selectedRole,
        timezone: detectedTz,
      });
      // Refresh user in store with updated role/designation
      const token = useAuthStore.getState().accessToken!;
      setAuth(res.data as any, token);
      navigate('/onboarding/workspace');
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563EB] mb-4">
            <span className="text-white font-bold text-xl">TP</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
          <div className="mb-8">
            <Stepper steps={STEPS} currentStep={2} />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#0F172A]">Tell us about yourself</h2>
            <p className="text-sm text-[#64748B] mt-1">This helps us personalize your experience</p>
          </div>

          <div className="space-y-5">
            {/* Designation */}
            <FormField label="Your role / designation" required>
              <Input
                value={designation}
                onChange={(e) => handleDesignationChange(e.target.value)}
                placeholder="e.g. Frontend Developer"
                autoFocus
              />
            </FormField>

            {/* Role cards */}
            <FormField label="Your role in TaskPilot" required>
              <div className="grid grid-cols-3 gap-3 mt-1">
                {(['ADMIN', 'MANAGER', 'MEMBER'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setSelectedRole(r); setSuggestedRole(null); }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center cursor-pointer',
                      selectedRole === r
                        ? 'border-[#2563EB] bg-[#EFF6FF]'
                        : 'border-[#E2E8F0] bg-white hover:border-[#2563EB]/50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      selectedRole === r ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    )}>
                      {ROLE_META[r].icon}
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        selectedRole === r ? 'text-[#2563EB]' : 'text-[#0F172A]'
                      )}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{ROLE_META[r].desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {suggestedRole && suggestedRole !== selectedRole && (
                <div className="mt-3">
                  <AISuggestionChip
                    suggestion={`Based on your title, you might be a ${suggestedRole.charAt(0) + suggestedRole.slice(1).toLowerCase()}`}
                    onAccept={() => { setSelectedRole(suggestedRole); setSuggestedRole(null); }}
                    onDismiss={() => setSuggestedRole(null)}
                  />
                </div>
              )}
            </FormField>

            {/* Timezone */}
            <div>
              <p className="text-sm font-medium text-[#0F172A] mb-1.5">Timezone</p>
              <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <Globe className="w-4 h-4 text-[#64748B]" />
                <span className="text-sm text-[#0F172A]">{detectedTz}</span>
                <span className="text-xs text-[#94A3B8] ml-auto">Auto-detected</span>
              </div>
            </div>

            <Button variant="default" fullWidth loading={isSaving} onClick={handleSubmit}>
              Continue
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/onboarding/workspace')}
                className="text-sm text-[#94A3B8] hover:text-[#64748B]"
              >
                Skip for now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
