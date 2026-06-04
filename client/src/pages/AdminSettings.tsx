import { useEffect, useState } from 'react';
import { Mail, UserCog, FolderKanban, Settings as SettingsIcon, Send, Trash2, Shield, Users, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { invitationsApi, usersApi, projectsApi, teamsApi } from '../api';
import type { Invitation, User, Project, Team } from '../types';
import { Button, Badge, Modal, ConfirmModal, useModal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';

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
      <PageHeader title="Admin Settings" />
      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
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
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <nav className="flex flex-col p-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSubTab(s.id)}
                className={`text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  subTab === s.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-[16px] font-semibold text-foreground mb-4">
            {sections.find(s => s.id === subTab)?.label}
          </h2>
          <p className="text-[13px] text-muted-foreground mb-6">
            Configure platform-wide {sections.find(s => s.id === subTab)?.label.toLowerCase()} settings here.
          </p>
          <div className="border-2 border-dashed border-border rounded-xl h-64 flex items-center justify-center">
            <span className="text-muted-foreground text-[13px] font-medium uppercase tracking-widest px-4 text-center">
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

  const revokeModal = useModal();
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => { loadData(); }, []);

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
      toast.success(`Invitation sent to ${email}`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally { setSending(false); }
  }

  function openRevoke(id: string) {
    setRevokeId(id);
    revokeModal.open();
  }

  async function doRevoke() {
    if (!revokeId) return;
    setRevoking(true);
    try {
      await invitationsApi.revoke(revokeId);
      revokeModal.close();
      toast.success('Invitation revoked');
      loadData();
    } catch {
      toast.error('Failed to revoke invitation');
    } finally {
      setRevoking(false);
    }
  }

  type InvStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  const STATUS_BADGE: Record<InvStatus, 'warning' | 'success' | 'secondary' | 'error'> = {
    PENDING: 'warning',
    ACCEPTED: 'success',
    EXPIRED: 'secondary',
    REVOKED: 'error',
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-foreground">Manage Invitations</h3>
        <Button size="sm" leftIcon={<Send className="w-3.5 h-3.5" />} onClick={() => setShowInvite(true)}>
          Send Invitation
        </Button>
      </div>

      {showInvite && (
        <div className="bg-[hsl(var(--color-info))]/5 border border-[hsl(var(--color-info))]/30 rounded-xl p-5 animate-fade-in">
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required placeholder="user@company.com" />
            </div>
            <div className="w-40">
              <label className="label">Role</label>
              <Select value={role} onValueChange={(val) => setRole(val)}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <label className="label">Team</label>
              <Select value={teamId || '_none'} onValueChange={(val) => setTeamId(val === '_none' ? '' : val)}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No team</SelectItem>
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" loading={sending}>Send</Button>
            <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Email</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Role</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Invited By</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Expires</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
            ) : invitations.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No invitations yet</td></tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">{inv.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info" size="sm">{inv.presetRole?.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[inv.status as InvStatus] ?? 'secondary'} size="sm">
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inv.invitedBy?.fullName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {inv.status === 'PENDING' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openRevoke(inv.id)}
                        aria-label="Revoke invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        {...revokeModal.props}
        title="Revoke Invitation"
        description="This invitation will be invalidated and the recipient will not be able to join."
        confirmLabel="Revoke"
        variant="destructive"
        loading={revoking}
        onConfirm={doRevoke}
        onCancel={() => revokeModal.close()}
      />
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const { data } = await usersApi.list();
      setUsers(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await usersApi.updateRole(userId, newRole);
      toast.success('Role updated');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">User</th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Email</th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Designation</th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Role</th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Team</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--color-info))]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-[hsl(var(--color-info))]">{u.fullName?.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{u.fullName}</span>
                    {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-[hsl(var(--color-info))]" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.designation || '—'}</td>
                <td className="px-4 py-3">
                  <Select value={u.role} onValueChange={(val) => handleRoleChange(u.id, val)}>
                    <SelectTrigger className="w-[160px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.team?.name || '—'}</td>
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

  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editKey, setEditKey] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadProjects(); }, []);

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
      toast.success(`Project "${name}" created`);
      loadProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create project');
    } finally { setCreating(false); }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProject || !editName.trim() || !editKey.trim()) return;
    setSaving(true);
    const canEditKey = (editProject._count?.tickets || 0) === 0;
    try {
      await projectsApi.update(editProject.id, {
        name: editName.trim(),
        ...(canEditKey && editKey.trim() !== editProject.key ? { key: editKey.trim().toUpperCase() } : {}),
      });
      setEditProject(null);
      toast.success('Project updated');
      loadProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update project');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteProject) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteProject.id);
      toast.success(`Project "${deleteProject.name}" deleted`);
      setDeleteProject(null);
      setDeleteConfirmText('');
      loadProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete project');
    } finally { setDeleting(false); }
  }

  return (
    <div className="space-y-5">
      {/* Create form */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-medium text-foreground mb-3">Create Project</h3>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" required placeholder="Project Name" />
          </div>
          <div className="w-32">
            <label className="label">Key</label>
            <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} className="input" required placeholder="KEY" maxLength={6} />
          </div>
          <Button type="submit" loading={creating}>Create</Button>
        </form>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-4 group relative hover:border-border/60 transition-colors">
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditProject(p); setEditName(p.name); setEditKey(p.key); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors shadow-sm"
                aria-label="Edit project"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setDeleteProject(p); setDeleteConfirmText(''); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors shadow-sm"
                aria-label="Delete project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info" className="font-mono">{p.key}</Badge>
              <h4 className="font-medium text-foreground">{p.name}</h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{p._count?.tickets || 0} tickets</span>
              <span>•</span>
              <span>{p._count?.sprints || 0} sprints</span>
            </div>
            {p.lead && <p className="text-xs text-muted-foreground mt-2">Lead: {p.lead.fullName}</p>}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editProject}
        onOpenChange={(open) => { if (!open) setEditProject(null); }}
        title="Edit Project"
        size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button type="button" onClick={() => setEditProject(null)}
              className="h-9 px-4 text-muted-foreground text-[14px] font-medium hover:text-foreground transition-colors">
              Cancel
            </button>
            <Button
              type="submit"
              form="edit-project-form-settings"
              loading={saving}
              disabled={!editName.trim() || !editKey.trim()}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {editProject && (() => {
          const canEditKey = (editProject._count?.tickets || 0) === 0;
          return (
            <form id="edit-project-form-settings" onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Project Key</label>
                  {canEditKey ? (
                    <span className="text-[11px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Editable — no tickets yet
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Locked — {editProject._count?.tickets} ticket{editProject._count?.tickets !== 1 ? 's' : ''} exist
                    </span>
                  )}
                </div>
                <input
                  value={canEditKey ? editKey : editProject.key}
                  onChange={e => canEditKey && setEditKey(e.target.value.toUpperCase())}
                  disabled={!canEditKey}
                  maxLength={6}
                  className={`input font-mono tracking-widest uppercase ${
                    canEditKey
                      ? 'border-green-400 focus:border-green-500 bg-green-50/30'
                      : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="label">Project Name *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="input" required placeholder="Project name" />
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteProject}
        onOpenChange={(open) => { if (!open) { setDeleteProject(null); setDeleteConfirmText(''); } }}
        title="Delete Project"
        description="This action cannot be undone."
        size="sm"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button type="button" onClick={() => { setDeleteProject(null); setDeleteConfirmText(''); }}
              className="h-9 px-4 text-muted-foreground text-[14px] font-medium hover:text-foreground transition-colors">
              Cancel
            </button>
            <Button
              variant="destructive"
              loading={deleting}
              disabled={deleteConfirmText !== deleteProject?.key}
              onClick={handleDelete}
            >
              Delete Project
            </Button>
          </div>
        }
      >
        {deleteProject && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-[14px] text-red-800 font-medium mb-1">This action cannot be undone.</p>
              <p className="text-[13px] text-red-700">
                Deleting <strong>{deleteProject.name}</strong> will permanently remove all{' '}
                <strong>{deleteProject._count?.tickets || 0} tickets</strong> and{' '}
                <strong>{deleteProject._count?.sprints || 0} sprints</strong>.
              </p>
            </div>
            <div>
              <label className="text-[13px] font-medium text-foreground mb-1.5 block">
                Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">{deleteProject.key}</span> to confirm
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={deleteProject.key}
                className="input font-mono"
                autoFocus
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Teams Tab ──────────────────────────────────────────
function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadTeams(); }, []);

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
      toast.success(`Team "${name}" created`);
      loadTeams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create team');
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-medium text-foreground mb-3">Create Team</h3>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Team Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" required placeholder="Team Name" />
          </div>
          <Button type="submit" loading={creating}>Create</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="bg-card rounded-xl border border-border p-4">
            <h4 className="font-medium text-foreground">{t.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{t._count?.members || 0} members</p>
            {t.lead && <p className="text-xs text-muted-foreground mt-1">Lead: {t.lead.fullName}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
