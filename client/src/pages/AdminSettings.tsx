import { useEffect, useState } from 'react';
import { Mail, UserCog, FolderKanban, Settings as SettingsIcon, Send, Trash2, Shield, X, Users } from 'lucide-react';
import { invitationsApi, usersApi, projectsApi, teamsApi } from '../api';
import type { Invitation, User, Project, Team } from '../types';

type Tab = 'invitations' | 'users' | 'projects' | 'teams' | 'platform';

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('invitations');

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'invitations', label: 'Invitations', icon: Mail },
    { id: 'users', label: 'Users', icon: UserCog },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'platform', label: 'Platform Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'invitations' && <InvitationsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'teams' && <TeamsTab />}
      {activeTab === 'platform' && <PlatformSettingsTab />}
    </div>
  );
}

// ─── Platform Settings Tab ──────────────────────────────
function PlatformSettingsTab() {
  const [subTab, setSubTab] = useState('general');
  const sections = [
    { id: 'general', label: 'General' },
    { id: 'designations', label: 'Designations' },
    { id: 'types', label: 'Ticket Types' },
    { id: 'labels', label: 'Labels' },
    { id: 'sprints', label: 'Sprint Defaults' },
    { id: 'notifications', label: 'Notification Preferences' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fade-in">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <nav className="flex flex-col p-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSubTab(s.id)}
                className={`text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  subTab === s.id ? 'bg-[#F1F5F9] text-[#0F172A]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-[16px] font-semibold text-[#0F172A] mb-4">
            {sections.find(s => s.id === subTab)?.label}
          </h2>
          <p className="text-[13px] text-[#64748B] mb-6">
            Configure platform-wide {sections.find(s => s.id === subTab)?.label.toLowerCase()} settings here. (This functionality is a placeholder for the blueprint implementation).
          </p>
          
          <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl h-64 flex items-center justify-center">
            <span className="text-[#94A3B8] text-[13px] font-medium uppercase tracking-widest px-4 text-center">
              {subTab} configuration coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invitations Tab ────────────────────────────────────
function InvitationsTab() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('MEMBER');
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [invRes, teamRes] = await Promise.all([
        invitationsApi.list(),
        teamsApi.list(),
      ]);
      setInvitations(invRes.data);
      setTeams(teamRes.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await invitationsApi.create({ email, role, teamId: teamId || undefined });
      setEmail(''); setRole('MEMBER'); setTeamId('');
      setShowInvite(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send invitation');
    } finally { setSending(false); }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this invitation?')) return;
    try {
      await invitationsApi.revoke(id);
      loadData();
    } catch { /* ignore */ }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'PENDING': return 'badge-yellow';
      case 'ACCEPTED': return 'badge-green';
      case 'EXPIRED': return 'badge-gray';
      case 'REVOKED': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Manage Invitations</h3>
        <button onClick={() => setShowInvite(true)} className="btn-primary btn-sm">
          <Send className="w-3.5 h-3.5 mr-1" /> Send Invitation
        </button>
      </div>

      {showInvite && (
        <div className="card p-5 border-primary-200 bg-primary-50/30 animate-fade-in">
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required placeholder="user@company.com" />
            </div>
            <div className="w-40">
              <label className="label">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="select">
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="w-40">
              <label className="label">Team</label>
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="select">
                <option value="">No team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={sending} className="btn-primary">
              {sending ? 'Sending...' : 'Send'}
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="btn-ghost">
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Email</th>
              <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Role</th>
              <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Invited By</th>
              <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Expires</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted text-sm">Loading...</td></tr>
            ) : invitations.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-muted text-sm">No invitations yet</td></tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm">{inv.email}</td>
                  <td className="px-4 py-3"><span className="badge-blue text-xs">{inv.presetRole?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3"><span className={statusColor(inv.status)}>{inv.status}</span></td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{inv.invitedBy?.fullName}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {inv.status === 'PENDING' && (
                      <button onClick={() => handleRevoke(inv.id)} className="btn-ghost btn-sm text-red-500 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data } = await usersApi.list();
      setUsers(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await usersApi.updateRole(userId, newRole);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update role');
    }
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">User</th>
            <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Email</th>
            <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Designation</th>
            <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Role</th>
            <th className="text-left text-xs font-medium text-text-secondary uppercase px-4 py-3">Team</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan={5} className="text-center py-8 text-text-muted text-sm">Loading...</td></tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">{u.fullName?.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium">{u.fullName}</span>
                    {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-primary-600" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{u.email}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{u.designation || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="select w-auto text-sm h-8"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{u.team?.name || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Projects Tab ───────────────────────────────────────
function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const { data } = await projectsApi.list();
      setProjects(data);
    } catch { /* ignore */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await projectsApi.create({ name, key: key.toUpperCase() });
      setName(''); setKey('');
      loadProjects();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create project');
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-medium mb-3">Create Project</h3>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" required placeholder="Project Name" />
          </div>
          <div className="w-32">
            <label className="label">Key</label>
            <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} className="input" required placeholder="KEY" maxLength={6} />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create'}</button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue font-mono">{p.key}</span>
              <h4 className="font-medium">{p.name}</h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>{p._count?.tickets || 0} tickets</span>
              <span>•</span>
              <span>{p._count?.sprints || 0} sprints</span>
            </div>
            {p.lead && (
              <p className="text-xs text-text-secondary mt-2">Lead: {p.lead.fullName}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Teams Tab ──────────────────────────────────────────
function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const { data } = await teamsApi.list();
      setTeams(data);
    } catch { /* ignore */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await teamsApi.create({ name });
      setName('');
      loadTeams();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create team');
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-medium mb-3">Create Team</h3>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Team Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" required placeholder="Team Name" />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create'}</button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="card p-4">
            <h4 className="font-medium">{t.name}</h4>
            <p className="text-xs text-text-muted mt-1">{t._count?.members || 0} members</p>
            {t.lead && <p className="text-xs text-text-secondary mt-1">Lead: {t.lead.fullName}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
