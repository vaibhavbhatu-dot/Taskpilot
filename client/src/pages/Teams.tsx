import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Plus, Crown, AlertCircle, ArrowLeft, UserPlus, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { teamsApi, usersApi } from '../api';
import { useAuthStore } from '../stores';
import type { Team, User } from '../types';
import {
  getInitials, Spinner, Button, Modal, ConfirmModal, useModal,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/design-system';
import { toast } from 'sonner';

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-red-100', text: 'text-red-600' },
  MANAGER: { bg: 'bg-primary/15', text: 'text-primary' },
  PROJECT_MANAGER: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  MEMBER: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

export function TeamsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [detail, setDetail] = useState<Team | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const createTeamModal = useModal();
  const confirmRemoveModal = useModal();

  // Create form
  const [teamName, setTeamName] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Member management
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const addMemberRef = useRef<HTMLDivElement>(null);

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const availableMembers = allUsers.filter(
    u => !detail?.members?.some(m => m.id === u.id)
  );

  const filteredAvailable = availableMembers.filter(m =>
    m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (id && teams.length) loadDetail(id);
    else setDetail(null);
  }, [id, teams]);

  useEffect(() => {
    if (!showAddMember) return;
    function handleClickOutside(e: MouseEvent) {
      if (addMemberRef.current && !addMemberRef.current.contains(e.target as Node)) {
        setShowAddMember(false);
        setMemberSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMember]);

  async function loadData() {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        teamsApi.list(),
        usersApi.list().catch(() => ({ data: [] })),
      ]);
      setTeams(teamsRes.data);
      setAllUsers(usersRes.data);
      setManagers(usersRes.data.filter((u: User) => ['ADMIN', 'MANAGER'].includes(u.role)));
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function loadDetail(teamId: string) {
    try {
      const { data } = await teamsApi.get(teamId);
      setDetail(data);
    } catch { /* ignore */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await teamsApi.create({ name: teamName, leadId: teamLead || undefined });
      createTeamModal.close();
      setTeamName(''); setTeamLead('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team');
    } finally { setSubmitting(false); }
  }

  async function handleAddMember(userId: string) {
    if (!detail) return;
    setAddingMemberId(userId);
    try {
      await teamsApi.addMembers(detail.id, [userId]);
      const member = allUsers.find(u => u.id === userId)!;
      setDetail(prev => prev ? {
        ...prev,
        members: [...(prev.members || []), member],
        _count: { members: (prev._count?.members || 0) + 1 },
      } : prev);
      toast.success(`${member.fullName} added to team`);
      if (availableMembers.length === 1) {
        setShowAddMember(false);
        setMemberSearch('');
      }
    } catch {
      toast.error('Failed to add member');
    } finally {
      setAddingMemberId(null);
    }
  }

  async function handleRemoveMember() {
    if (!detail || !removeTarget) return;
    setRemovingMember(true);
    try {
      await teamsApi.removeMember(detail.id, removeTarget.id);
      setDetail(prev => prev ? {
        ...prev,
        members: (prev.members || []).filter(m => m.id !== removeTarget.id),
        _count: { members: Math.max(0, (prev._count?.members || 0) - 1) },
      } : prev);
      toast.success(`${removeTarget.fullName} removed from team`);
      confirmRemoveModal.close();
      setRemoveTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  if (detail) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/teams')} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-[22px] font-semibold text-foreground">{detail.name}</h1>
            {detail.lead && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Crown className="w-3 h-3 text-yellow-500" />
                Led by {detail.lead.fullName}
              </p>
            )}
          </div>
        </div>

        {/* Team Lead card */}
        {detail.lead && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Team Lead</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{getInitials(detail.lead.fullName)}</span>
              </div>
              <div>
                <p className="text-[14px] font-medium text-foreground">{detail.lead.fullName}</p>
                <p className="text-[12px] text-muted-foreground">{detail.lead.designation || detail.lead.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Members section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-foreground">
              Members ({detail.members?.length || 0})
            </h3>

            {canManage && (
              <div className="relative" ref={addMemberRef}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  onClick={() => {
                    setShowAddMember(prev => !prev);
                    setMemberSearch('');
                  }}
                >
                  Add Member
                </Button>

                {showAddMember && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-[280px] bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {/* Search input */}
                    <div className="p-3 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search members..."
                          value={memberSearch}
                          onChange={e => setMemberSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* User list */}
                    <div className="max-h-[220px] overflow-y-auto py-1">
                      {filteredAvailable.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {availableMembers.length === 0 ? 'All members already added' : 'No results'}
                        </p>
                      ) : (
                        filteredAvailable.map(member => (
                          <button
                            key={member.id}
                            disabled={addingMemberId === member.id}
                            onClick={() => handleAddMember(member.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left disabled:opacity-50"
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-semibold text-primary">{getInitials(member.fullName)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{member.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.designation || member.role}</p>
                            </div>
                            {addingMemberId === member.id
                              ? <Spinner size="sm" color="muted" />
                              : <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            }
                          </button>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-border">
                      <p className="text-xs text-muted-foreground text-center">Click a member to add instantly</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Member</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Designation</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Tickets</th>
                  {canManage && <th className="px-5 py-3 w-20" />}
                </tr>
              </thead>
              <tbody>
                {detail.members?.map((member, i) => {
                  const badge = ROLE_BADGES[member.role] || ROLE_BADGES.MEMBER;
                  const isLead = detail.leadId === member.id;
                  return (
                    <tr
                      key={member.id}
                      className={`group h-[52px] hover:bg-muted transition-colors ${i % 2 === 1 ? 'bg-muted/50' : ''}`}
                    >
                      <td className="px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                            <span className="text-[11px] font-semibold text-primary">{getInitials(member.fullName)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.fullName}</p>
                            <p className="text-[12px] text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 text-sm text-foreground">{member.designation || '—'}</td>
                      <td className="px-5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 text-sm text-muted-foreground">{member._count?.assignedTickets || 0}</td>
                      {canManage && (
                        <td className="px-5 text-right">
                          {!isLead && (
                            <button
                              onClick={() => { setRemoveTarget(member); confirmRemoveModal.open(); }}
                              className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!detail.members || detail.members.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">No members in this team yet</div>
            )}
          </div>
        </div>

        <ConfirmModal
          {...confirmRemoveModal.props}
          title="Remove member"
          description={`Remove ${removeTarget?.fullName} from ${detail.name}?`}
          confirmLabel="Remove"
          variant="destructive"
          loading={removingMember}
          onConfirm={handleRemoveMember}
        />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teams"
        subtitle={`${teams.length} teams`}
        actions={canManage ? (
          <Button onClick={() => createTeamModal.open()} leftIcon={<Plus className="w-4 h-4" />}>
            Create Team
          </Button>
        ) : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => (
          <div key={team.id} className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[16px] font-semibold text-foreground">{team.name}</h3>
            </div>

            {team.lead && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary">{team.lead.fullName?.charAt(0)}</span>
                </div>
                <span className="text-[14px] text-foreground">{team.lead.fullName}</span>
              </div>
            )}

            <p className="text-[13px] text-muted-foreground mb-4">{team._count?.members || 0} members</p>

            <button
              onClick={() => navigate(`/teams/${team.id}`)}
              className="text-[14px] text-primary hover:underline font-medium"
            >
              View Team
            </button>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <UsersIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No teams yet. Create your first team.</p>
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        {...createTeamModal.props}
        title="Create Team"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <button type="button" onClick={() => createTeamModal.close()} className="text-sm text-muted-foreground hover:text-foreground font-medium px-4">
              Cancel
            </button>
            <Button type="submit" form="create-team-form" loading={submitting}>
              Create
            </Button>
          </div>
        }
      >
        <form id="create-team-form" onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="label">Team Name *</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Engineering"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Team Lead</label>
            <Select value={teamLead || '_none'} onValueChange={(val) => setTeamLead(val === '_none' ? '' : val)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Select lead</SelectItem>
                {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
