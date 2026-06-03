import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Plus, Crown, X, AlertCircle, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { teamsApi, usersApi } from '../api';
import { useAuthStore } from '../stores';
import type { Team, User } from '../types';
import { getInitials } from '@/design-system';

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
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [teamName, setTeamName] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (id && teams.length) loadDetail(id);
    else setDetail(null);
  }, [id, teams]);

  async function loadData() {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        teamsApi.list(),
        usersApi.list().catch(() => ({ data: [] })),
      ]);
      setTeams(teamsRes.data);
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
      setShowModal(false);
      setTeamName(''); setTeamLead('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team');
    } finally { setSubmitting(false); }
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Detail view
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

        {/* Team Lead */}
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

        {/* Members */}
        <div>
          <h3 className="text-[15px] font-semibold text-foreground mb-3">
            Members ({detail.members?.length || 0})
          </h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Member</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Designation</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {detail.members?.map((member, i) => {
                  const badge = ROLE_BADGES[member.role] || ROLE_BADGES.MEMBER;
                  return (
                    <tr key={member.id} className={`h-[52px] hover:bg-muted ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
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
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teams"
        subtitle={`${teams.length} teams`}
        actions={canCreate ? (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </button>
        ) : undefined}
      />

      {/* Teams Grid */}
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
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl w-full max-w-[480px] p-7 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold text-foreground">Create Team</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
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
                <select value={teamLead} onChange={(e) => setTeamLead(e.target.value)} className="input">
                  <option value="">Select lead</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-sm text-muted-foreground hover:text-foreground font-medium px-4">
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
