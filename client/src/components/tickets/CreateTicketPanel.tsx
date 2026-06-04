import { useState, useEffect, useMemo, useRef } from 'react';
import { X, AlertCircle, Tag as TagIcon, Paperclip, Link as LinkIcon, ExternalLink, Check, Users } from 'lucide-react';
import { Button, Input, Textarea, Label, FormField, getInitials, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';
import { ticketsApi } from '../../api';
import type { Project, User, Sprint, Team } from '../../types';

const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export function CreateTicketPanel({ projects, users, teams, sprints, onClose, onCreated }: {
  projects: Project[]; users: User[]; teams: Team[]; sprints: Sprint[];
  onClose: () => void; onCreated: () => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [teamId, setTeamId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sprintId, setSprintId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const assigneeSectionRef = useRef<HTMLDivElement>(null);

  const availableTeams = useMemo(() => {
    if (assigneeIds.length === 0) return teams;
    const selectedUsers = users.filter(u => assigneeIds.includes(u.id));
    const memberTeamIds = new Set(selectedUsers.map(u => u.teamId).filter(Boolean));
    return teams.filter(t => memberTeamIds.has(t.id));
  }, [assigneeIds, users, teams]);

  useEffect(() => {
    if (teamId && !availableTeams.find(t => t.id === teamId)) setTeamId('');
    if (availableTeams.length === 1 && assigneeIds.length > 0) setTeamId(availableTeams[0].id);
  }, [availableTeams]);

  useEffect(() => {
    if (!showAssigneeDropdown) return;
    function handleOutside(e: MouseEvent) {
      if (assigneeSectionRef.current && !assigneeSectionRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
        setAssigneeSearch('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showAssigneeDropdown]);

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  function toggleAssignee(uid: string) {
    setAssigneeIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  }

  function addLabel(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      if (!labels.includes(labelInput.trim())) setLabels([...labels, labelInput.trim()]);
      setLabelInput('');
    }
  }

  function addLink(e?: React.KeyboardEvent) {
    if (e && e.key !== 'Enter') return;
    e?.preventDefault();
    const url = linkInput.trim();
    if (!url) return;
    const full = url.startsWith('http') ? url : `https://${url}`;
    if (!links.includes(full)) setLinks([...links, full]);
    setLinkInput('');
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    setPendingFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existing.has(f.name))];
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }

  const activeSprints = sprints.filter(s => s.status === 'PLANNED' || s.status === 'ACTIVE');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await ticketsApi.create({
        title, projectId, type: type as any, priority: priority as any,
        description: description || undefined,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
        assignedToId: assigneeIds[0] || undefined,
        teamId: teamId || undefined,
        dueDate: dueDate || undefined,
        labels,
        links,
      } as any);
      const ticketId = res.data.id;
      if (pendingFiles.length > 0) {
        await Promise.allSettled(pendingFiles.map(f => ticketsApi.uploadAttachment(ticketId, f)));
      }
      setToast('Ticket created successfully');
      setTimeout(() => onCreated(), 700);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[580px] bg-card border-l border-border flex flex-col animate-slide-in-right shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[18px] font-semibold text-foreground">Create Ticket</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {toast && (
            <div className="bg-[hsl(var(--color-success))]/10 border border-[hsl(var(--color-success))]/20 text-[hsl(var(--color-success))] text-sm px-4 py-3 rounded-lg">
              {toast}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <FormField label="Project" required>
            <Select value={projectId || '_none'} onValueChange={(val) => setProjectId(val === '_none' ? '' : val)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Select project</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.key})</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the ticket"
              required
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TASK">🔵 Task</SelectItem>
                  <SelectItem value="BUG">🔴 Bug</SelectItem>
                  <SelectItem value="FEATURE">🟢 Feature</SelectItem>
                  <SelectItem value="IMPROVEMENT">🟡 Improvement</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
                  <SelectItem value="HIGH">🟠 High</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                  <SelectItem value="LOW">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              rows={4}
            />
          </FormField>

          <div ref={assigneeSectionRef} className="relative flex flex-col gap-1.5">
            <Label>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Assignees</span>
            </Label>
            {assigneeIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assigneeIds.map(id => {
                  const u = users.find(x => x.id === id);
                  if (!u) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[hsl(var(--color-info))]/15 text-[hsl(var(--color-info))] text-[12px] font-medium rounded-full">
                      <span className="w-4 h-4 rounded-full bg-[hsl(var(--color-info))] text-white flex items-center justify-center text-[9px] font-bold">{getInitials(u.fullName)}</span>
                      {u.fullName.split(' ')[0]}
                      <button type="button" onClick={() => toggleAssignee(id)} className="hover:text-destructive leading-none">×</button>
                    </span>
                  );
                })}
              </div>
            )}
            <button type="button" onClick={() => setShowAssigneeDropdown(v => !v)}
              className="input text-left flex items-center justify-between text-[14px]">
              <span className={assigneeIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                {assigneeIds.length === 0 ? 'Search & add assignees...' : `${assigneeIds.length} assignee${assigneeIds.length > 1 ? 's' : ''} selected`}
              </span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </button>
            {showAssigneeDropdown && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 border-b border-border">
                  <Input
                    autoFocus
                    value={assigneeSearch}
                    onChange={e => setAssigneeSearch(e.target.value)}
                    placeholder="Search members..."
                    className="h-8 text-[13px]"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-3 text-[13px] text-muted-foreground">No members found</p>
                  ) : filteredUsers.map(u => (
                    <button key={u.id} type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => toggleAssignee(u.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[hsl(var(--color-info))]/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[hsl(var(--color-info))]">{getInitials(u.fullName)}</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{u.fullName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.designation || u.role}</p>
                      </div>
                      {assigneeIds.includes(u.id) && <Check className="w-4 h-4 text-[hsl(var(--color-info))] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-border">
                  <button type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                    className="w-full text-[12px] text-muted-foreground hover:text-foreground py-1">Done</button>
                </div>
              </div>
            )}
          </div>

          <FormField label="Team">
            <Select value={teamId || '_none'} onValueChange={(val) => setTeamId(val === '_none' ? '' : val)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No team</SelectItem>
                {availableTeams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {assigneeIds.length > 0 && availableTeams.length < teams.length && (
              <p className="text-[11px] text-muted-foreground mt-1">Showing {availableTeams.length} team{availableTeams.length !== 1 ? 's' : ''} matching selected assignees</p>
            )}
          </FormField>

          <FormField label="Due Date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>

          <FormField label="Sprint">
            <Select value={sprintId || '_none'} onValueChange={(val) => setSprintId(val === '_none' ? '' : val)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No sprint</SelectItem>
                {activeSprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.status})</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex flex-col gap-1.5">
            <Label>Labels</Label>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[hsl(var(--color-info))]/15 text-[hsl(var(--color-info))] text-[12px] font-medium rounded">
                    <TagIcon className="w-3 h-3" />{l}
                    <button type="button" onClick={() => setLabels(labels.filter(x => x !== l))} className="ml-0.5 hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            )}
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={addLabel}
              placeholder="Type and press Enter to add a label"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              <span className="flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> Links</span>
            </Label>
            {links.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {links.map(l => (
                  <div key={l} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg group">
                    <ExternalLink className="w-3.5 h-3.5 text-[hsl(var(--color-info))] flex-shrink-0" />
                    <a href={l} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-[12px] text-[hsl(var(--color-info))] truncate hover:underline">{l}</a>
                    <button type="button" onClick={() => setLinks(links.filter(x => x !== l))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-[16px] leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={addLink}
                placeholder="https://... (Enter to add)"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addLink()} disabled={!linkInput.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              <span className="flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> Attachments</span>
            </Label>
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-[hsl(var(--color-info))] hover:bg-[hsl(var(--color-info))]/5 transition-colors"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-[13px] text-muted-foreground">
                Drop files here or <span className="text-[hsl(var(--color-info))] font-medium">click to browse</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Max 10 MB per file</p>
            </div>
            <input ref={fileInputRef} type="file" multiple onChange={e => handleFileSelect(e.target.files)} className="hidden" />
            {pendingFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg group">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-[12px] text-foreground truncate">{f.name}</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatFileSize(f.size)}</span>
                    <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-[16px] leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/50 flex items-center gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={submitting}
            disabled={!title || !projectId}
          >
            Create Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
