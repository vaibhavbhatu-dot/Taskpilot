import { useState, useEffect } from 'react';
import { Camera, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores';
import { usersApi, teamsApi } from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import type { User, Team } from '../types';

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-red-100', text: 'text-red-600' },
  MANAGER: { bg: 'bg-primary/15', text: 'text-primary' },
  PROJECT_MANAGER: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  MEMBER: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<User[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setDesignation(user.designation || '');
      setManagerId(user.managerId || '');
    }
    loadExtras();
  }, [user]);

  async function loadExtras() {
    try {
      const { data: users } = await usersApi.list();
      setManagers(users.filter((u: User) => ['ADMIN', 'MANAGER'].includes(u.role)));
      if (user?.teamId) {
        const { data: t } = await teamsApi.get(user.teamId);
        setTeam(t);
      }
    } catch { /* ignore */ }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      const { data } = await usersApi.update(user.id, {
        fullName,
        designation: designation || undefined,
        managerId: managerId || undefined,
      });
      updateUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) return null;

  const badge = ROLE_BADGES[user.role] || ROLE_BADGES.MEMBER;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Profile" />
      <div className="flex justify-center">
        <div className="w-full max-w-[600px]">
        <div className="bg-card rounded-xl border border-border p-8">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-primary">{getInitials(user.fullName)}</span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Success */}
            {saved && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-lg">
                <Check className="w-4 h-4" />
                Changes saved successfully
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="input bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="label">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Software Engineer"
                className="input"
              />
            </div>

            {/* Manager */}
            <div>
              <label className="label">Manager</label>
              <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="input">
                <option value="">No manager</option>
                {managers
                  .filter(m => m.id !== user.id)
                  .map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </div>

            {/* Role (read only) */}
            <div>
              <label className="label">Role</label>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-lg text-[13px] font-semibold ${badge.bg} ${badge.text}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Team (read only) */}
            <div>
              <label className="label">Team</label>
              <input
                type="text"
                value={team?.name || 'Not assigned'}
                readOnly
                className="input bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
