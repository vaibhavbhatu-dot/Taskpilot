import { useEffect, useState } from 'react';
import { Plus, X, AlertCircle, FolderOpen, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { projectsApi, usersApi } from '../api';
import { useAuthStore } from '../stores';
import type { Project, User } from '../types';

export function ProjectsPage() {
  const { user: currentUser } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [leadId, setLeadId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'PROJECT_MANAGER';
  const canManage = currentUser?.role === 'ADMIN';

  // Edit state
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editLeadId, setEditLeadId] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  function openEdit(p: Project) {
    setEditProject(p);
    setEditName(p.name);
    setEditKey(p.key);
    setEditLeadId(p.lead?.id || '');
    setEditStatus(p.status as 'ACTIVE' | 'ARCHIVED');
    setEditError('');
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProject) return;
    setSaving(true);
    setEditError('');
    const canEditKey = (editProject._count?.tickets || 0) === 0;
    try {
      await projectsApi.update(editProject.id, {
        name: editName.trim(),
        ...(canEditKey && editKey.trim() !== editProject.key ? { key: editKey.trim().toUpperCase() } : {}),
        leadId: editLeadId || undefined,
        status: editStatus,
      } as any);
      setEditProject(null);
      loadData();
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update project');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteProject) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteProject.id);
      setDeleteProject(null);
      setDeleteConfirmText('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete project');
    } finally { setDeleting(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [projRes, usersRes] = await Promise.all([
        projectsApi.list(),
        usersApi.list().catch(() => ({ data: [] })),
      ]);
      setProjects(projRes.data);
      setUsers(usersRes.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  function autoKey(projectName: string) {
    return projectName
      .replace(/[^a-zA-Z ]/g, '')
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
  }

  function handleNameChange(v: string) {
    setName(v);
    if (!key || key === autoKey(name)) {
      setKey(autoKey(v));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await projectsApi.create({ name, key: key.toUpperCase(), leadId: leadId || undefined });
      setShowModal(false);
      setName(''); setKey(''); setLeadId('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} projects`}
        actions={canCreate ? (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </button>
        ) : undefined}
      />

      {/* Projects Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Project</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Tickets</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Sprints</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, i) => (
              <tr
                key={project.id}
                className={`h-[56px] hover:bg-muted transition-colors ${i % 2 === 1 ? 'bg-muted/50' : 'bg-card'}`}
              >
                <td className="px-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-2 py-0.5 bg-primary/15 text-primary text-[11px] font-bold font-mono rounded">
                      {project.key}
                    </span>
                    <span className="text-[14px] font-medium text-foreground">{project.name}</span>
                  </div>
                </td>
                <td className="px-5">
                  {project.lead ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary">
                          {project.lead.fullName?.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-foreground">{project.lead.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 text-sm text-foreground">{project._count?.tickets || 0}</td>
                <td className="px-5 text-sm text-foreground">{project._count?.sprints || 0}</td>
                <td className="px-5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                    project.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(project)}
                      className="flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {canManage && (
                      <button
                        onClick={() => { setDeleteProject(project); setDeleteConfirmText(''); }}
                        className="flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No projects yet. Create your first project.</p>
          </div>
        )}
      </div>

      {/* ── Edit Project Modal ─────────────────────────── */}
      {editProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditProject(null)} />
          <div className="relative bg-card rounded-2xl w-full max-w-[480px] p-7 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold text-foreground">Edit Project</h2>
              <button onClick={() => setEditProject(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{editError}
                </div>
              )}

              {/* Key — editable only if no tickets */}
              {(() => {
                const canEditKey = (editProject._count?.tickets || 0) === 0;
                return (
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
                );
              })()}

              <div>
                <label className="label">Project Name *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="input" required autoFocus placeholder="Project name" />
              </div>

              <div>
                <label className="label">Project Lead</label>
                <select value={editLeadId} onChange={e => setEditLeadId(e.target.value)} className="input">
                  <option value="">No lead</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value as 'ACTIVE' | 'ARCHIVED')} className="input">
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !editName.trim()} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditProject(null)}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium px-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────── */}
      {deleteProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteProject(null)} />
          <div className="relative bg-card rounded-2xl w-full max-w-[440px] p-7 animate-fade-in shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-foreground">Delete Project</h2>
                <p className="text-[13px] text-muted-foreground">This action cannot be undone</p>
              </div>
              <button onClick={() => setDeleteProject(null)} className="ml-auto p-1 rounded-lg hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4 text-[13px] text-red-700">
              Deleting <strong>{deleteProject.name}</strong> will permanently remove{' '}
              <strong>{deleteProject._count?.tickets || 0} ticket{deleteProject._count?.tickets !== 1 ? 's' : ''}</strong> and{' '}
              <strong>{deleteProject._count?.sprints || 0} sprint{deleteProject._count?.sprints !== 1 ? 's' : ''}</strong>.
            </div>
            <div className="mb-5">
              <label className="text-[13px] font-medium text-foreground mb-1.5 block">
                Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-red-600">{deleteProject.key}</span> to confirm
              </label>
              <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={deleteProject.key} className="input font-mono" autoFocus />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== deleteProject.key || deleting}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
              <button onClick={() => setDeleteProject(null)}
                className="text-sm text-muted-foreground hover:text-foreground font-medium px-4">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl w-full max-w-[480px] p-7 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold text-foreground">Create Project</h2>
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
                <label className="label">Project Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Web Platform"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Project Key *</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="WEB"
                  maxLength={6}
                  className="input font-mono uppercase"
                  required
                />
                <p className="text-[12px] text-muted-foreground mt-1">2-6 uppercase letters, used in ticket IDs</p>
              </div>
              <div>
                <label className="label">Project Lead</label>
                <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="input">
                  <option value="">Select lead</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
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
