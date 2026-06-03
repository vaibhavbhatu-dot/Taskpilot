import { useEffect, useState } from 'react';
import { Search, Plus, MoreHorizontal, X, ChevronDown, ChevronRight, Mail, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { usersApi, invitationsApi, teamsApi } from '../api';
import type { User, Invitation, Team } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Users as UsersIcon } from 'lucide-react';
import { getInitials } from '@/design-system';

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-red-100', text: 'text-red-600' },
  MANAGER: { bg: 'bg-primary/15', text: 'text-primary' },
  PROJECT_MANAGER: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  MEMBER: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const ROLE_FILTERS = ['All', 'ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'MEMBER'] as const;

export function MembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Invite form
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('MEMBER');
  const [invTeam, setInvTeam] = useState('');
  const [invManager, setInvManager] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invError, setInvError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersRes, invRes, teamsRes] = await Promise.all([
        usersApi.list(),
        invitationsApi.list().catch(() => ({ data: [] })),
        teamsApi.list().catch(() => ({ data: [] })),
      ]);
      setUsers(usersRes.data);
      setInvitations((invRes.data as Invitation[]).filter((i: Invitation) => i.status === 'PENDING'));
      setTeams(teamsRes.data as Team[]);
      setManagers(usersRes.data.filter((u: User) => ['ADMIN', 'MANAGER'].includes(u.role)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.designation || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInvError('');
    setInviting(true);
    try {
      await invitationsApi.create({
        email: invEmail,
        role: invRole,
        teamId: invTeam || undefined,
        managerId: invManager || undefined,
      });
      setToast(`Invitation sent to ${invEmail}`);
      setShowInviteModal(false);
      setInvEmail(''); setInvRole('MEMBER'); setInvTeam(''); setInvManager('');
      loadData();
      setTimeout(() => setToast(''), 4000);
    } catch (err: any) {
      setInvError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      await invitationsApi.revoke(id);
      loadData();
    } catch { /* ignore */ }
  }

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-7 w-40 mb-2" /><Skeleton className="h-4 w-24" /></div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-16" /></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[hsl(var(--color-success))] text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-fade-in flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {toast}
        </div>
      )}

      <PageHeader
        title="Team Members"
        subtitle={`${users.length} members total`}
        actions={
          <button onClick={() => setShowInviteModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </button>
        }
      />

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or designation..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_FILTERS.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              }`}
            >
              {role === 'PROJECT_MANAGER' ? 'Project Manager' : role === 'All' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Designation</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
              <th className="text-right px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, i) => {
              const badge = ROLE_BADGES[user.role] || ROLE_BADGES.MEMBER;
              return (
                <tr
                  key={user.id}
                  className={`h-[56px] hover:bg-muted transition-colors ${i % 2 === 1 ? 'bg-muted/50' : 'bg-card'}`}
                >
                  <td className="px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-[11px] font-semibold text-primary">{getInitials(user.fullName)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-foreground">{user.fullName}</p>
                        <p className="text-[12px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 text-[14px] text-foreground">{user.designation || '—'}</td>
                  <td className="px-5 text-[14px] text-foreground">{user.team?.name || '—'}</td>
                  <td className="px-5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-[hsl(var(--color-success))]' : 'bg-gray-400'}`} />
                      <span className="text-[13px] text-muted-foreground">{user.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-5 text-[13px] text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 text-right relative">
                    <button
                      onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {actionMenuId === user.id && (
                      <div className="absolute right-5 top-full mt-1 w-40 bg-card rounded-lg border border-border z-20 text-left overflow-hidden">
                        <button className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 text-left">Edit Role</button>
                        <button className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 text-left">Deactivate</button>
                        <button className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left">Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && !loading && (
          <EmptyState
            icon={<UsersIcon className="w-12 h-12" />}
            title="No members found"
            description="Adjust your search filters or invite new team members."
            action={{ label: 'Invite Member', onClick: () => setShowInviteModal(true) }}
          />
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowInvites(!showInvites)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <span className="text-[15px] font-semibold text-foreground">
              Pending Invitations ({invitations.length})
            </span>
            {showInvites ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showInvites && (
            <table className="w-full">
              <thead>
                <tr className="border-t border-border">
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Invited By</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Sent</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Expires</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Role</th>
                  <th className="text-right px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-5 py-3 text-sm text-foreground">{inv.email}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{inv.invitedBy?.fullName || '—'}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${ROLE_BADGES[inv.presetRole]?.bg} ${ROLE_BADGES[inv.presetRole]?.text}`}>
                        {inv.presetRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-card rounded-2xl w-full max-w-[480px] p-7 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold text-foreground">Invite New Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {invError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {invError}
                </div>
              )}
              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select value={invRole} onChange={(e) => setInvRole(e.target.value)} className="input">
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                </select>
              </div>
              <div>
                <label className="label">Team (optional)</label>
                <select value={invTeam} onChange={(e) => setInvTeam(e.target.value)} className="input">
                  <option value="">No team</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Manager (optional)</label>
                <select value={invManager} onChange={(e) => setInvManager(e.target.value)} className="input">
                  <option value="">No manager</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={inviting} className="btn-primary flex-1">
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
                <button type="button" onClick={() => setShowInviteModal(false)} className="text-sm text-muted-foreground hover:text-foreground font-medium px-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
