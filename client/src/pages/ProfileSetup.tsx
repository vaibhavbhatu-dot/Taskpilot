import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { UserCircle, Eye, EyeOff } from 'lucide-react';
import { authApi, usersApi } from '../api';
import { useAuthStore } from '../stores';
import { Button, Card, Spinner, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';

export function ProfileSetupPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const token = params.token || searchParams.get('token') || '';
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [managerId, setManagerId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [managers, setManagers] = useState<any[]>([]);

  useEffect(() => {
    verifyToken();
  }, [token]);

  async function verifyToken() {
    try {
      const { data } = await authApi.verifyInvite(token);
      setInviteData(data);
      if (data.presetManagerId) {
        setManagerId(data.presetManagerId);
      }
      // Load managers for dropdown
      try {
        const { data: usersList } = await usersApi.list({ role: 'MANAGER' });
        setManagers(usersList);
      } catch { /* Silently fail — managers list is optional */ }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data } = await authApi.setup({
        token,
        fullName,
        designation: designation || undefined,
        managerId: managerId || undefined,
        password,
      });
      setAuth(data.user as any, data.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Invalid Invitation</h2>
          <p className="text-sm text-muted-foreground">{error || 'This invitation link is invalid or has expired.'}</p>
          <Button onClick={() => navigate('/login')} className="mt-8 w-full">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  const designations = [
    'Software Engineer', 'Senior Developer', 'QA Engineer', 'Designer',
    'Product Manager', 'DevOps Engineer', 'Team Lead', 'Manager', 'Other',
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <UserCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Set Up Your Account</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Invited by <span className="font-medium text-foreground">{inviteData.invitedBy}</span>
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-btn animate-fade-in">
                {error}
              </div>
            )}

            <div className="bg-primary-50 border border-primary-100 px-4 py-3 rounded-btn">
              <p className="text-sm text-primary-700">
                <span className="font-medium">Email:</span> {inviteData.email}
              </p>
              <p className="text-sm text-primary-700 mt-1">
                <span className="font-medium">Role:</span> {inviteData.presetRole?.replace('_', ' ')}
              </p>
            </div>

            <div>
              <label htmlFor="fullName" className="label">Full Name *</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="designation" className="label">Designation</label>
              <Select value={designation || '_none'} onValueChange={(val) => setDesignation(val === '_none' ? '' : val)}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Select your designation</SelectItem>
                  {designations.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {managers.length > 0 && (
              <div>
                <label htmlFor="managerId" className="label">Manager</label>
                <Select value={managerId || '_none'} onValueChange={(val) => setManagerId(val === '_none' ? '' : val)}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select your manager</SelectItem>
                    {managers.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label htmlFor="password" className="label">Password *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="input"
                required
              />
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Complete Setup
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
