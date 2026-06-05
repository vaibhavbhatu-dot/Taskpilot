import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Users, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, FormField, Input, Stepper, cn } from '@/design-system';
import { authApi } from '../api';

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    companyName: z.string().min(2, 'Company name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const STEPS = [
  { label: 'Sign up' },
  { label: 'Verify' },
  { label: 'Profile' },
  { label: 'Workspace' },
];

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_CONFIG = [
  { label: '', color: '' },
  { label: 'Weak', color: 'bg-[#EF4444]' },
  { label: 'Fair', color: 'bg-[#F59E0B]' },
  { label: 'Good', color: 'bg-[#2563EB]' },
  { label: 'Strong', color: 'bg-[#16A34A]' },
];

export function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [domainExists, setDomainExists] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const strength = password ? getPasswordStrength(password) : 0;
  const { label: strengthLabel, color: strengthColor } = STRENGTH_CONFIG[strength] ?? STRENGTH_CONFIG[0];

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const email = e.target.value;
    if (email.includes('@')) {
      const domain = email.split('@')[1]?.split('.')[0];
      const company = domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : '';
      if (company) setValue('companyName', company);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      setDomainExists(null);

      const response = await authApi.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
      });

      if (response.data.companyDomainExists) {
        setDomainExists(response.data.existingCompanyName);
      }

      sessionStorage.setItem('signup_email', data.email);
      if (response.data.devOtp) {
        sessionStorage.setItem('dev_otp', response.data.devOtp);
      }

      navigate('/verify-email');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('email', { message: err.response.data.message });
      } else {
        toast.error('Failed to create account', { description: 'Please try again.' });
      }
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-semibold text-[#0F172A]">Create your account</h1>
          <p className="text-[#64748B] mt-1 text-sm">Start managing your projects today</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
          {/* Stepper */}
          <div className="mb-8">
            <Stepper steps={STEPS} currentStep={0} />
          </div>

          {/* Admin account info note */}
          <div className="flex items-start gap-2 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg mb-4 text-sm">
            <Info className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
            <p className="text-[#1D4ED8] text-xs">
              Signing up creates an <strong>Admin</strong> account for your organisation. Invite team members after setup.
            </p>
          </div>

          {/* Domain exists banner */}
          {domainExists && (
            <div className="flex items-start gap-3 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg mb-4">
              <Users className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#1D4ED8]">Your team is already on TaskPilot</p>
                <p className="text-xs text-[#2563EB] mt-0.5">
                  Someone from {domainExists} has already signed up. Ask them to invite you instead, or
                  continue to create a separate workspace.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Full name" error={errors.fullName?.message} required>
              <Input
                {...register('fullName')}
                placeholder="Arjun Patel"
                autoFocus
                variant={errors.fullName ? 'error' : 'default'}
              />
            </FormField>

            <FormField label="Work email" error={errors.email?.message} required>
              <Input
                {...register('email', { onChange: handleEmailChange })}
                type="email"
                placeholder="arjun@company.com"
                variant={errors.email ? 'error' : 'default'}
              />
            </FormField>

            <FormField label="Company / organization" error={errors.companyName?.message} required>
              <Input
                {...register('companyName')}
                placeholder="Acme Corp"
                variant={errors.companyName ? 'error' : 'default'}
              />
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="pr-10"
                  variant={errors.password ? 'error' : 'default'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          i <= strength ? strengthColor : 'bg-[#E2E8F0]'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#94A3B8]">{strengthLabel}</p>
                </div>
              )}
            </FormField>

            <FormField label="Confirm password" error={errors.confirmPassword?.message} required>
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  className="pr-10"
                  variant={errors.confirmPassword ? 'error' : 'default'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <Button type="submit" loading={isLoading} fullWidth className="mt-2">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2563EB] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
