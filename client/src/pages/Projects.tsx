import { useEffect, useState } from 'react';
import { Plus, X, AlertCircle, FolderOpen } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0F172A]">Projects</h1>
          <p className="text-sm text-[#64748B] mt-1">{projects.length} projects</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </button>
        )}
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Project</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Lead</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Tickets</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Sprints</th>
              <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, i) => (
              <tr
                key={project.id}
                className={`h-[56px] hover:bg-[#F1F5F9] transition-colors ${i % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}`}
              >
                <td className="px-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-2 py-0.5 bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold font-mono rounded">
                      {project.key}
                    </span>
                    <span className="text-[14px] font-medium text-[#0F172A]">{project.name}</span>
                  </div>
                </td>
                <td className="px-5">
                  {project.lead ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-[#2563EB]">
                          {project.lead.fullName?.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-[#0F172A]">{project.lead.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#94A3B8]">—</span>
                  )}
                </td>
                <td className="px-5 text-sm text-[#0F172A]">{project._count?.tickets || 0}</td>
                <td className="px-5 text-sm text-[#0F172A]">{project._count?.sprints || 0}</td>
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
                  <button className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-8 h-8 mx-auto text-[#94A3B8] mb-3" />
            <p className="text-sm text-[#64748B]">No projects yet. Create your first project.</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-[480px] p-7 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold text-[#0F172A]">Create Project</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-[#F1F5F9]">
                <X className="w-5 h-5 text-[#64748B]" />
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
                <p className="text-[12px] text-[#94A3B8] mt-1">2-6 uppercase letters, used in ticket IDs</p>
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
                <button type="button" onClick={() => setShowModal(false)} className="text-sm text-[#64748B] hover:text-[#0F172A] font-medium px-4">
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
