import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FormField, Input, Stepper } from '@/design-system';
import { usersApi } from '../../api';
import { useAuthStore } from '../../stores';

const STEPS = [
  { label: 'Sign up' },
  { label: 'Verify' },
  { label: 'Profile' },
  { label: 'Workspace' },
];

const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [designation, setDesignation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    try {
      setIsSaving(true);
      const res = await usersApi.updateProfile({
        designation,
        timezone: detectedTz,
      });
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
            <h2 className="text-xl font-semibold text-[#0F172A]">Your profile</h2>
            <p className="text-sm text-[#64748B] mt-1">Tell us your role in your organisation</p>
          </div>

          <div className="space-y-5">
            {/* Designation */}
            <FormField label="Your role / designation" required>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Frontend Developer"
                autoFocus
              />
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
