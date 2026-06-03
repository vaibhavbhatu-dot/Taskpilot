import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, CheckCircle, Calendar, Target } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { sprintsApi, projectsApi } from '../api';
import type { Sprint, Project } from '../types';

export function SprintsPage() {
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sprintRes, projRes] = await Promise.all([
        sprintsApi.list(),
        projectsApi.list(),
      ]);
      setSprints(sprintRes.data);
      setProjects(projRes.data);

      // Auto-select active sprint
      const active = sprintRes.data.find((s: Sprint) => s.status === 'ACTIVE');
      if (active) selectSprint(active);
    } catch (error) {
      console.error('Failed to load sprints:', error);
    } finally {
      setLoading(false);
    }
  }

  async function selectSprint(sprint: Sprint) {
    setSelectedSprint(sprint);
    try {
      const detailRes = await sprintsApi.get(sprint.id);
      setSelectedSprint(detailRes.data);
    } catch { /* ignore */ }
  }

  async function handleStartSprint(sprintId: string) {
    try {
      await sprintsApi.start(sprintId);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start sprint');
    }
  }

  async function handleCompleteSprint(sprintId: string) {
    if (!confirm('Complete this sprint? Incomplete tickets will be moved to backlog.')) return;
    try {
      await sprintsApi.complete(sprintId);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to complete sprint');
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return 'badge-green';
      case 'PLANNED': return 'badge-blue';
      case 'COMPLETED': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sprints" action={
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4 mr-1" /> New Sprint
        </button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint list */}
        <div className="space-y-3">
          {sprints.length === 0 ? (
            <div className="card p-8 text-center text-text-muted text-sm">
              No sprints yet. Create your first sprint!
            </div>
          ) : (
            sprints.map((sprint) => (
              <div
                key={sprint.id}
                onClick={() => selectSprint(sprint)}
                className={`card-hover p-4 cursor-pointer ${
                  selectedSprint?.id === sprint.id ? 'ring-2 ring-primary-500 border-primary-200' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-primary">{sprint.name}</h3>
                  <span className={statusColor(sprint.status)}>{sprint.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{sprint.project?.name || sprint.project?.key}</span>
                  <span>•</span>
                  <span>{sprint._count?.sprintTickets || 0} tickets</span>
                </div>
                {sprint.startDate && sprint.endDate && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(sprint.startDate).toLocaleDateString()} — {new Date(sprint.endDate).toLocaleDateString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {sprint.status === 'PLANNED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartSprint(sprint.id); }}
                      className="btn-primary btn-sm flex-1"
                    >
                      <Play className="w-3 h-3 mr-1" /> Start
                    </button>
                  )}
                  {sprint.status === 'ACTIVE' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCompleteSprint(sprint.id); }}
                      className="btn-secondary btn-sm flex-1"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sprint Detail */}
        <div className="lg:col-span-2">
          {selectedSprint ? (
            <div className="space-y-5">
              {/* Metrics */}
              {selectedSprint._count && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div className="kpi-card">
                    <span className="kpi-label">Total Tickets</span>
                    <span className="kpi-value">{selectedSprint._count.sprintTickets}</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Status</span>
                    <span className="kpi-value capitalize text-[16px]">{selectedSprint.status.toLowerCase()}</span>
                  </div>
                </div>
              )}

              {/* Sprint tickets */}
              {selectedSprint.sprintTickets && selectedSprint.sprintTickets.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-medium text-text-primary">
                      Sprint Tickets ({selectedSprint.sprintTickets.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {selectedSprint.sprintTickets.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => st.ticket && navigate(`/tickets/${st.ticket.id}`)}
                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-text-muted">{st.ticket?.ticketNumber}</span>
                          <span className="text-sm text-text-primary truncate">{st.ticket?.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {st.ticket?.assignedTo && (
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-[10px] text-primary-600">{st.ticket.assignedTo.fullName?.charAt(0)}</span>
                            </div>
                          )}
                          <span className={`ticket-status-${st.ticket?.status?.toLowerCase().replace(/_/g, '-')}`}>
                            {st.ticket?.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSprint.goal && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary-600" />
                    <h3 className="font-medium text-text-primary">Sprint Goal</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{selectedSprint.goal}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center text-text-muted">
              <Target className="w-8 h-8 mx-auto mb-3 text-text-muted" />
              <p>Select a sprint to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Sprint Modal */}
      {showCreate && (
        <CreateSprintModal
          projects={projects}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData(); }}
        />
      )}
    </div>
  );
}

function CreateSprintModal({ projects, onClose, onCreated }: {
  projects: Project[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [goal, setGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sprintsApi.create({ name, projectId, goal: goal || undefined });
      onCreated();
    } catch (error) {
      console.error('Create sprint failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <h2 className="text-lg font-semibold mb-4">Create Sprint</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Sprint Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" required autoFocus placeholder="Sprint 2" />
          </div>
          <div>
            <label className="label">Project *</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="select" required>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Sprint Goal</label>
            <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="input h-20 resize-none" placeholder="What do we want to achieve?" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
