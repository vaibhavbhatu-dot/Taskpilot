import { useEffect, useState } from 'react';
import { Search, Plus, MoreHorizontal, ChevronDown, ChevronRight, Clock, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { usersApi, invitationsApi, teamsApi } from '../api';
import { useAuthStore } from '../stores';
import { markChecklistDone } from '../lib/checklist';
import type { User, Invitation, Team } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Users as UsersIcon } from 'lucide-react';
import { Button, Modal, ConfirmModal, getInitials, useModal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-red-100', text: 'text-red-600' },
  MANAGER: { bg: 'bg-primary/15', text: 'text-primary' },
  PROJECT_MANAGER: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  MEMBER: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const ROLE_FILTERS = ['All', 'ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'MEMBER'] as const;

export function MembersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const inviteModal = useModal();
  const [showInvites, setShowInvites] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Edit Role modal
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  // Deactivate modal
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Remove modal
  const [removeUser, setRemoveUser] = useState<User | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Invite form
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('MEMBER');
  const [invTeam, setInvTeam] = useState('');
  const [invManager, setInvManager] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invError, setInvError] = useState('');

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
    } catch {
      toast.error('Failed to load members. Please refresh.');
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
      toast.success(`Invitation sent to ${invEmail}`);
      inviteModal.close();
      setInvEmail(''); setInvRole('MEMBER'); setInvTeam(''); setInvManager('');
      if (currentUser?.id) markChecklistDone(currentUser.id, 'invite_member');
      loadData();
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

  async function handleEditRole() {
    if (!editRoleUser || !newRole) return;
    setRoleLoading(true);
    try {
      await usersApi.updateRole(editRoleUser.id, newRole);
      setEditRoleUser(null);
      await loadData();
      toast.success(`Role updated to ${newRole.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setRoleLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateUser) return;
    setDeactivateLoading(true);
    try {
      await usersApi.deactivate(deactivateUser.id);
      setDeactivateUser(null);
      await loadData();
      toast.success(`${deactivateUser.fullName} has been deactivated`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deactivate member');
    } finally {
      setDeactivateLoading(false);
    }
  }

  async function handleRemove() {
    if (!removeUser) return;
    setRemoveLoading(true);
    try {
      await usersApi.deleteUser(removeUser.id);
      setRemoveUser(null);
      await loadData();
      toast.success(`${removeUser.fullName} has been removed`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemoveLoading(false);
    }
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

      <PageHeader
        title="Team Members"
        subtitle={`${users.length} members total`}
        actions={
          <Button onClick={() => inviteModal.open()} leftIcon={<Plus className="w-4 h-4" />}>
            Invite Member
          </Button>
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
                      aria-label={`${user.fullName} actions`}
                      aria-expanded={actionMenuId === user.id}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {actionMenuId === user.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                        <div className="absolute right-5 top-full mt-1 w-40 bg-card rounded-lg border border-border z-20 text-left overflow-hidden shadow-lg">
                          <button
                            className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 text-left"
                            onClick={() => { setEditRoleUser(user); setNewRole(user.role); setActionMenuId(null); }}
                          >
                            Edit Role
                          </button>
                          <button
                            className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 text-left"
                            onClick={() => { setDeactivateUser(user); setActionMenuId(null); }}
                          >
                            Deactivate
                          </button>
                          <button
                            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                            onClick={() => { setRemoveUser(user); setActionMenuId(null); }}
                          >
                            Remove
                          </button>
                        </div>
                      </>
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
            action={{ label: 'Invite Member', onClick: () => inviteModal.open() }}
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

      {/* Edit Role Modal */}
      <Modal
        open={!!editRoleUser}
        onOpenChange={(open) => { if (!open) setEditRoleUser(null); }}
        title="Edit Role"
        description={editRoleUser ? `Change role for ${editRoleUser.fullName}` : undefined}
        size="sm"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setEditRoleUser(null)} disabled={roleLoading}>Cancel</Button>
            <Button size="sm" onClick={handleEditRole} loading={roleLoading}>Save Changes</Button>
          </div>
        }
      >
        <div className="py-2">
          <label className="text-[13px] font-medium text-foreground block mb-2">New Role</label>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <ConfirmModal
        open={!!deactivateUser}
        onOpenChange={(open) => { if (!open) setDeactivateUser(null); }}
        title="Deactivate Member"
        description="This will prevent them from logging in. You can reactivate them later."
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivateLoading}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateUser(null)}
      />

      {/* Remove Modal */}
      <ConfirmModal
        open={!!removeUser}
        onOpenChange={(open) => { if (!open) setRemoveUser(null); }}
        title="Remove Member"
        description={`Remove ${removeUser?.fullName ?? 'this member'} from the project? This cannot be undone.`}
        confirmLabel="Remove"
        variant="destructive"
        loading={removeLoading}
        onConfirm={handleRemove}
        onCancel={() => setRemoveUser(null)}
      />

      {/* Invite Modal */}
      <Modal
        {...inviteModal.props}
        title="Invite New Member"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <button type="button" onClick={() => inviteModal.close()} className="text-sm text-muted-foreground hover:text-foreground font-medium px-4">
              Cancel
            </button>
            <Button type="submit" form="invite-member-form" loading={inviting}>
              Send Invitation
            </Button>
          </div>
        }
      >
        <form id="invite-member-form" onSubmit={handleInvite} className="space-y-4">
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
          <div className="flex items-start gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
            <Info className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0 mt-0.5" />
            <p>Invited users will set up their own password and profile. Their role will be set to what you select below.</p>
          </div>
          <div>
            <label className="label">Role</label>
            <Select value={invRole} onValueChange={setInvRole}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label">Team (optional)</label>
            <Select value={invTeam || '_none'} onValueChange={(val) => setInvTeam(val === '_none' ? '' : val)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No team</SelectItem>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label">Manager (optional)</label>
            <Select value={invManager || '_none'} onValueChange={(val) => setInvManager(val === '_none' ? '' : val)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No manager</SelectItem>
                {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
