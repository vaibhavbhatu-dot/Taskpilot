import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../stores';
import { Button } from '@/design-system';

const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@taskpilot.com', password: 'admin123', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { role: 'Manager', email: 'vikram@taskpilot.com', password: 'demo123', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { role: 'Member', email: 'rahul@taskpilot.com', password: 'demo123', color: 'bg-green-50 border-green-200 text-green-700' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.user as any, data.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function fillCredentials(cred: { email: string; password: string }) {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 mb-4">
            <span className="text-white font-bold text-xl">TP</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Welcome to TaskPilot</h1>
          <p className="text-text-secondary mt-1 text-sm">Sign in to manage your projects</p>
        </div>

        {/* TODO: Remove before customer production deploy */}
        {import.meta.env.DEV && (
          <div className="mb-5 bg-muted/50 border border-border rounded-xl p-4">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Demo Credentials — click to fill</p>
            <div className="flex flex-col gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillCredentials(cred)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-opacity ${cred.color}`}
                >
                  <span className="text-[12px] font-semibold">{cred.role}</span>
                  <span className="text-[12px] font-mono opacity-75">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-error text-sm px-4 py-3 rounded-btn animate-fade-in border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: jane@company.com"
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-[13px] text-center text-text-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#2563EB] hover:underline font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
