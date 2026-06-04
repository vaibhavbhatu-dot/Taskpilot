import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button, OtpInput, Stepper } from '@/design-system';
import { authApi } from '../api';
import { useAuthStore } from '../stores';

const STEPS = [
  { label: 'Sign up' },
  { label: 'Verify' },
  { label: 'Profile' },
  { label: 'Workspace' },
];

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Capture once on mount — cleared from sessionStorage during handleVerify
  // before navigate fires, so reading it live would cause the guard to redirect
  const [email] = useState(() => sessionStorage.getItem('signup_email'));
  const [devOtp, setDevOtp] = useState(() => sessionStorage.getItem('dev_otp'));

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, []); // intentionally omit deps — only run on mount

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerify(code: string) {
    if (!email) {
      navigate('/signup');
      return;
    }

    try {
      setIsVerifying(true);
      setError('');

      const response = await authApi.verifyOtp({ email, otp: code });
      const { accessToken, user } = response.data;

      useAuthStore.getState().setAuth(user, accessToken);

      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('dev_otp');

      toast.success('Email verified! Welcome to TaskPilot');
      navigate('/onboarding/profile');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    try {
      const res = await authApi.resendOtp({ email });
      if (res.data.devOtp) {
        sessionStorage.setItem('dev_otp', res.data.devOtp);
        setDevOtp(res.data.devOtp);
        setOtp('');
      }
      toast.success('New code sent');
      setResendCooldown(60);
    } catch {
      toast.error('Failed to resend code');
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
          {/* Stepper */}
          <div className="mb-8">
            <Stepper steps={STEPS} currentStep={1} />
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EFF6FF] mb-4">
              <Mail className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h2 className="text-xl font-semibold text-[#0F172A]">Check your email</h2>
            <p className="text-sm text-[#64748B] mt-1">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-[#2563EB]">{email}</span>
            </p>
            <Link to="/signup" className="text-xs text-[#94A3B8] hover:text-[#64748B] mt-1 inline-block">
              Wrong email? Go back
            </Link>
          </div>

          {/* Dev mode banner */}
          {devOtp && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm">
              <span className="text-amber-600 font-mono text-base leading-none">&lt;/&gt;</span>
              <span className="text-amber-800">
                <strong>Dev mode:</strong> Your OTP is{' '}
                <code className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                  {devOtp}
                </code>{' '}
                or use{' '}
                <code className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                  000000
                </code>
              </span>
            </div>
          )}

          {/* OTP input */}
          <div className="flex justify-center">
            <OtpInput
              length={6}
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setError('');
                if (val.length === 6) handleVerify(val);
              }}
              error={!!error}
              autoFocus
              disabled={isVerifying}
            />
          </div>

          {error && (
            <p className="text-sm text-[#EF4444] text-center mt-2">{error}</p>
          )}

          <Button
            variant="default"
            fullWidth
            loading={isVerifying}
            disabled={otp.length < 6}
            onClick={() => handleVerify(otp)}
            className="mt-4"
          >
            Verify email
          </Button>

          <div className="text-center mt-4">
            {resendCooldown > 0 ? (
              <p className="text-sm text-[#94A3B8]">Resend code in {resendCooldown}s</p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-[#2563EB] hover:underline"
              >
                Didn't receive a code? Resend
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
