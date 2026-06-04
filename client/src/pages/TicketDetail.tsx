import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Tag as TagIcon, Clock, Users, Paperclip, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';
import { ticketsApi, commentsApi, usersApi, teamsApi } from '../api';
import { useAuthStore } from '../stores';
import type { Ticket, Comment, TicketHistory, TicketPriority, User, Team } from '../types';
import { TICKET_STATUSES, getStatusLabel } from '../constants/ticketStatus';
import { PRIORITY_BADGE_VARIANT } from '../constants/ticketStyles';
import { isOverdue } from '@/lib/utils';
import { Badge, Button, Spinner, EmptyState, getInitials, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system';
import { MentionTextarea } from '../components/ui/mention-textarea';

const STATUS_OPTIONS = TICKET_STATUSES;
const PRIORITY_OPTIONS: TicketPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function renderCommentWithMentions(content: string) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-[#2563EB] font-medium hover:underline cursor-pointer">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [newComment, setNewComment] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  // sprints not needed for display atm
  
  const [loading, setLoading] = useState(true);
  // saving state removed as optimistic update is fast

  // Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isDescChanged, setIsDescChanged] = useState(false);

  // Assignee multi-select
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeContainerRef = useRef<HTMLDivElement>(null);

  // Links management
  const [linkInput, setLinkInput] = useState('');

  // Attachment upload
  const attachFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Comment attachments
  const commentFileRef = useRef<HTMLInputElement>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [commentPreviews, setCommentPreviews] = useState<string[]>([]);

  const formatFileSize = (bytes?: number) =>
    !bytes ? '' : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  useEffect(() => {
    if (id) {
      loadTicket();
      loadExtras();
    }
  }, [id]);

  async function loadTicket() {
    try {
      const [ticketRes, commentsRes, historyRes] = await Promise.all([
        ticketsApi.get(id!),
        commentsApi.list(id!),
        ticketsApi.getHistory(id!),
      ]);
      setTicket(ticketRes.data);
      setEditTitle(ticketRes.data.title);
      setEditDesc(ticketRes.data.description || '');
      setComments(commentsRes.data);
      setHistory(historyRes.data);
    } catch {
      // leave ticket as null; render error state below
    } finally {
      setLoading(false);
    }
  }

  async function loadExtras() {
    try {
      const [uRes, tRes] = await Promise.all([
        usersApi.list().catch(() => ({ data: [] })),
        teamsApi.list().catch(() => ({ data: [] }))
      ]);
      setUsers(uRes.data);
      setTeams(tRes.data);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!showAssigneeDropdown) return;
    function handleOutside(e: MouseEvent) {
      if (assigneeContainerRef.current && !assigneeContainerRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
        setAssigneeSearch('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showAssigneeDropdown]);

  async function handleFieldChange(field: string, value: any) {
    if (!ticket) return;
    const previousTicket = { ...ticket };
    try {
      const payload: any = { [field]: value };
      if (field === 'assignedToId' && !value) payload.assignedToId = null;
      if (field === 'teamId' && !value) payload.teamId = null;
      if (field === 'dueDate' && !value) payload.dueDate = null;

      const { data } = await ticketsApi.update(ticket.id, payload);
      setTicket((prev: any) => ({ ...prev, ...data }));

      toast.success('Change saved');

      const histRes = await ticketsApi.getHistory(ticket.id);
      setHistory(histRes.data);
    } catch {
      setTicket(previousTicket);
      if (field === 'title') setEditTitle(previousTicket.title);
      toast.error('Failed to update ticket', { description: 'Please try again.' });
    }
  }

  async function saveTitle() {
    if (!editTitle.trim() || editTitle === ticket?.title) {
      setIsEditingTitle(false);
      setEditTitle(ticket?.title || '');
      return;
    }
    await handleFieldChange('title', editTitle.trim());
    setIsEditingTitle(false);
  }

  async function saveDescription() {
    await handleFieldChange('description', editDesc.trim());
    setIsDescChanged(false);
  }

  async function toggleAssignee(userId: string) {
    if (!ticket) return;
    const current = ticket.assignees?.map(a => a.userId) || [];
    const next = current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];
    const { data } = await ticketsApi.update(ticket.id, { assigneeIds: next } as any);
    setTicket((prev: any) => ({ ...prev, ...data }));
  }

  async function addLink() {
    if (!ticket || !linkInput.trim()) return;
    const url = linkInput.trim().startsWith('http') ? linkInput.trim() : `https://${linkInput.trim()}`;
    const newLinks = [...(ticket.links || []), url];
    await handleFieldChange('links', newLinks);
    setLinkInput('');
  }

  async function removeLink(url: string) {
    if (!ticket) return;
    await handleFieldChange('links', (ticket.links || []).filter(l => l !== url));
  }

  async function handleAttachmentUpload(files: FileList | null) {
    if (!files || !ticket) return;
    setUploading(true);
    try {
      await Promise.allSettled(Array.from(files).map(f => ticketsApi.uploadAttachment(ticket.id, f)));
      const res = await ticketsApi.get(ticket.id);
      setTicket(res.data);
    } finally { setUploading(false); }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!ticket) return;
    await ticketsApi.deleteAttachment(ticket.id, attachmentId);
    setTicket((prev: any) => prev ? { ...prev, attachments: prev.attachments?.filter((a: any) => a.id !== attachmentId) } : prev);
  }

  async function handleAddComment() {
    if ((!newComment.trim() && commentFiles.length === 0) || !ticket) return;
    try {
      // Always create a comment (use empty placeholder if text is blank but files exist)
      const commentContent = newComment.trim() || '📎 Attached files';
      // TODO: Backend notification support needed for mentions
      const { data: newCommentData } = await commentsApi.create(ticket.id, {
        content: commentContent,
        mentionedUserIds: mentionedUserIds.filter((id) => id !== 'ALL'),
        notifyAllAssignees: mentionedUserIds.includes('ALL'),
      });

      // Upload files scoped to this comment
      if (commentFiles.length > 0) {
        await Promise.allSettled(
          commentFiles.map(f => ticketsApi.uploadAttachment(ticket.id, f, newCommentData.id))
        );
      }

      setNewComment('');
      setMentionedUserIds([]);
      commentPreviews.forEach(url => URL.revokeObjectURL(url));
      setCommentFiles([]);
      setCommentPreviews([]);
      const res = await commentsApi.list(ticket.id);
      setComments(res.data);
    } catch {
      toast.error('Failed to add comment. Please try again.');
    }
  }

  function handleCommentFileSelect(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    setCommentFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existing.has(f.name))];
    });
    setCommentPreviews(prev => [
      ...prev,
      ...arr.map(f => (f.type.startsWith('image/') ? URL.createObjectURL(f) : '')),
    ]);
  }

  function removeCommentFile(i: number) {
    if (commentPreviews[i]) URL.revokeObjectURL(commentPreviews[i]);
    setCommentFiles(prev => prev.filter((_, j) => j !== i));
    setCommentPreviews(prev => prev.filter((_, j) => j !== i));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          icon={<Trash2 className="w-12 h-12" />}
          title="Ticket not found"
          description="This ticket may have been deleted or you don't have access."
          action={{ label: 'Back to Tickets', onClick: () => navigate('/tickets') }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative">

      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/tickets')} className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Tickets
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-primary font-mono text-[13px]">{ticket.ticketNumber}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main Content (65%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" size="sm">{ticket.type}</Badge>
              <Badge variant={PRIORITY_BADGE_VARIANT[ticket.priority] ?? 'secondary'} size="sm">{ticket.priority}</Badge>
            </div>
            
            {/* Editable Title */}
            {isEditingTitle ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                className="w-full text-[22px] font-semibold text-foreground outline-none border-b border-primary bg-transparent py-1 mb-2"
              />
            ) : (
              <h1 
                onClick={() => setIsEditingTitle(true)}
                className="text-[22px] font-semibold text-foreground mb-3 cursor-text hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 transition-colors"
              >
                {ticket.title}
              </h1>
            )}

            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span>Created by</span>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-[9px] text-primary">{getInitials(ticket.createdBy?.fullName || 'U')}</span>
                </div>
                {ticket.createdBy?.fullName}
              </div>
              <span>on {new Date(ticket.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Assigned to</span>
              {(() => {
                const assignees = ticket.assignees && ticket.assignees.length > 0
                  ? ticket.assignees
                  : ticket.assignedTo ? [{ userId: ticket.assignedTo.id, user: ticket.assignedTo }] : [];
                if (assignees.length === 0) return <span>Unassigned</span>;
                return (
                  <div className="flex items-center gap-1">
                    {assignees.slice(0, 3).map((a, i) => (
                      <div key={a.userId} className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center border border-white" style={{ marginLeft: i > 0 ? '-4px' : 0 }} title={a.user.fullName}>
                        <span className="text-[9px] text-primary">{getInitials(a.user.fullName)}</span>
                      </div>
                    ))}
                    <span className="ml-1 font-medium text-foreground">
                      {assignees.length === 1 ? assignees[0].user.fullName : `${assignees.length} assignees`}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-[15px] font-semibold text-foreground mb-3">Description</h3>
            <textarea
              value={editDesc}
              onChange={(e) => {
                setEditDesc(e.target.value);
                setIsDescChanged(e.target.value !== (ticket.description || ''));
              }}
              placeholder="Add a detailed description..."
              className="w-full min-h-[120px] text-[14px] text-foreground outline-none resize-y placeholder:text-muted-foreground"
            />
            {isDescChanged && (
              <div className="flex justify-end mt-3 animate-fade-in">
                <Button size="sm" onClick={saveDescription}>
                  Save Description
                </Button>
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div>
            <h3 className="text-[16px] font-semibold text-foreground mb-4">Activity</h3>
            
            <div className="flex gap-6 border-b border-border mb-5">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${
                  activeTab === 'comments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${
                  activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                History ({history.length})
              </button>
            </div>

            {activeTab === 'comments' ? (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[11px] font-semibold text-primary">{getInitials(user?.fullName || 'U')}</span>
                  </div>
                  <div className="flex-1 border border-border rounded-xl overflow-hidden bg-card focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-shadow">
                    {/* Text area with @mention support */}
                    <MentionTextarea
                      value={newComment}
                      onChange={setNewComment}
                      onMentionsChange={setMentionedUserIds}
                      members={users}
                      placeholder="Add a comment... use @ to mention someone"
                      disabled={false}
                      onKeyDown={e => e.key === 'Enter' && e.metaKey && handleAddComment()}
                      className="w-full px-4 pt-3 pb-2 text-[14px] text-foreground outline-none resize-none placeholder:text-muted-foreground min-h-[80px] bg-transparent"
                    />

                    {/* File previews */}
                    {commentFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 pb-2">
                        {commentFiles.map((f, i) => (
                          <div key={i} className="relative group">
                            {commentPreviews[i] ? (
                              /* Image preview */
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted/50">
                                <img src={commentPreviews[i]} alt={f.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              /* Non-image file */
                              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg max-w-[180px]">
                                <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-[12px] text-foreground truncate">{f.name}</span>
                                <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatFileSize(f.size)}</span>
                              </div>
                            )}
                            {/* Remove button */}
                            <button
                              onClick={() => removeCommentFile(i)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >×</button>
                            {/* Filename tooltip on image */}
                            {commentPreviews[i] && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 text-center truncate max-w-[64px]">{f.name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-muted bg-muted/50">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => commentFileRef.current?.click()}
                          className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Attach file"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Attach
                          {commentFiles.length > 0 && (
                            <span className="ml-0.5 w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                              {commentFiles.length}
                            </span>
                          )}
                        </button>
                        <input ref={commentFileRef} type="file" multiple className="hidden"
                          onChange={e => handleCommentFileSelect(e.target.files)} />
                        <span className="text-[11px] text-muted-foreground ml-1">⌘+Enter to post</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() && commentFiles.length === 0}
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-semibold text-muted-foreground">{getInitials(comment.author?.fullName || 'U')}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-medium text-foreground">{comment.author?.fullName}</span>
                          <span className="text-[12px] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {comment.content !== '📎 Attached files' && (
                          <p className="text-[14px] text-foreground whitespace-pre-wrap">
                            {renderCommentWithMentions(comment.content)}
                          </p>
                        )}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {comment.attachments.map(a => {
                              const isImage = a.mimeType?.startsWith('image/');
                              return isImage ? (
                                <a key={a.id} href={`http://localhost:5000${a.url}`} target="_blank" rel="noopener noreferrer"
                                  className="block w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted/50 hover:opacity-90 transition-opacity flex-shrink-0">
                                  <img src={`http://localhost:5000${a.url}`} alt={a.originalName} className="w-full h-full object-cover" />
                                </a>
                              ) : (
                                <a key={a.id} href={`http://localhost:5000${a.url}`} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-colors max-w-[220px]">
                                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-[12px] text-foreground truncate">{a.originalName}</span>
                                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatFileSize(a.size)}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {history.map((entry) => (
                  <div key={entry.id} className="relative flex items-start justify-between gap-4 py-3">
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center shadow-sm z-10">
                       <span className="w-2 h-2 rounded-full bg-[hsl(var(--color-info))]" />
                    </div>
                    <div className="pl-10 w-full flex items-center justify-between">
                      <div className="text-[13px]">
                        <span className="font-medium text-foreground">{entry.changedBy?.fullName}</span>
                        <span className="text-muted-foreground"> changed {entry.fieldChanged} </span>
                        {entry.oldValue && <span className="text-muted-foreground line-through">{entry.oldValue.replace(/_/g, ' ')}</span>}
                        {entry.oldValue && entry.newValue && <span className="text-muted-foreground mx-1">→</span>}
                        {entry.newValue && <span className="font-medium text-foreground">{entry.newValue.replace(/_/g, ' ')}</span>}
                      </div>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                        {new Date(entry.changedAt).toLocaleDateString()} {new Date(entry.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (35%) */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            
            {/* Status */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Status</label>
              <Select value={ticket.status} onValueChange={(val) => handleFieldChange('status', val)}>
                <SelectTrigger className="w-full h-9 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Priority</label>
              <Select value={ticket.priority} onValueChange={(val) => handleFieldChange('priority', val)}>
                <SelectTrigger className="w-full h-9 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Assignees — multi */}
            <div ref={assigneeContainerRef} className="relative">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Assignees
              </label>
              {(ticket.assignees || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(ticket.assignees || []).map(a => (
                    <span key={a.userId} className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/15 text-primary text-[12px] font-medium rounded-full">
                      <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold">{getInitials(a.user.fullName)}</span>
                      {a.user.fullName.split(' ')[0]}
                      <button onClick={() => toggleAssignee(a.userId)} aria-label={`Remove ${a.user.fullName}`} className="hover:text-red-500 leading-none text-[14px]">×</button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setShowAssigneeDropdown(v => !v)}
                className="input text-[13px] h-9 text-left flex items-center justify-between w-full">
                <span className="text-muted-foreground">Add assignee...</span>
                <Users className="w-4 h-4 text-muted-foreground" />
              </button>
              {showAssigneeDropdown && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <input autoFocus value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)}
                      placeholder="Search..." className="w-full h-7 px-2 text-[12px] border border-border rounded outline-none" />
                  </div>
                  <div className="max-h-[180px] overflow-y-auto">
                    {users.filter(u => u.fullName.toLowerCase().includes(assigneeSearch.toLowerCase())).map(u => {
                      const isSelected = ticket.assignees?.some(a => a.userId === u.id);
                      return (
                        <button key={u.id} type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { toggleAssignee(u.id); setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-primary">{getInitials(u.fullName)}</span>
                          </div>
                          <span className="flex-1 text-[13px] text-left truncate">{u.fullName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-1.5 border-t border-border">
                    <button type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                      className="w-full text-[11px] text-muted-foreground py-1">Done</button>
                  </div>
                </div>
              )}
            </div>

            {/* Team */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Team</label>
              <Select
                value={ticket.teamId || '_none'}
                onValueChange={(val) => handleFieldChange('teamId', val === '_none' ? '' : val)}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No team</SelectItem>
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sprint */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Sprint</label>
              <Select disabled value={ticket.sprintTickets?.[0]?.sprintId || '_none'} onValueChange={() => {}}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No sprint</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">Managed via sprint board</p>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  className={`input text-[13px] h-9 ${ticket.dueDate && isOverdue(ticket.dueDate, ticket.status) ? 'text-red-600 font-medium' : ''}`}
                />
                {ticket.dueDate && isOverdue(ticket.dueDate, ticket.status) && (
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    OVERDUE
                  </span>
                )}
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {ticket.labels?.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-[12px] font-medium rounded border border-border">
                    <TagIcon className="w-3 h-3 text-muted-foreground" /> {l}
                  </span>
                ))}
                {(!ticket.labels || ticket.labels.length === 0) && <span className="text-[13px] text-muted-foreground">No labels</span>}
              </div>
            </div>

            {/* Links — sidebar compact */}
            <div className="border-t border-border pt-4">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3" /> Links
              </label>
              {(ticket.links || []).length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  {(ticket.links || []).map(l => (
                    <div key={l} className="flex items-center gap-1.5 group">
                      <ExternalLink className="w-3 h-3 text-primary flex-shrink-0" />
                      <a href={l} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-[12px] text-primary truncate hover:underline min-w-0"
                        title={l}>{l.replace(/^https?:\/\//, '')}</a>
                      <button onClick={() => removeLink(l)} aria-label="Delete link" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLink()}
                  placeholder="Add a link..." className="flex-1 h-8 px-2 text-[12px] border border-border rounded-md outline-none focus:border-ring bg-card min-w-0" />
                <button onClick={addLink} disabled={!linkInput.trim()}
                  className="h-8 px-2 text-[11px] font-medium text-muted-foreground bg-muted rounded-md hover:bg-muted disabled:opacity-40 flex-shrink-0">Add</button>
              </div>
            </div>

            {/* Attachments — sidebar compact */}
            <div className="border-t border-border pt-4">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Paperclip className="w-3 h-3" /> Attachments {uploading && <span className="text-[10px] font-normal animate-pulse text-muted-foreground">uploading…</span>}</span>
                <button onClick={() => attachFileRef.current?.click()}
                  className="text-[10px] font-medium text-primary hover:underline">+ Add</button>
              </label>
              <input ref={attachFileRef} type="file" multiple className="hidden" onChange={e => handleAttachmentUpload(e.target.files)} />
              {(ticket.attachments || []).length > 0 ? (
                <div className="flex flex-col gap-1">
                  {(ticket.attachments || []).map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 group py-1">
                      <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <a href={`http://localhost:5000${a.url}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-[12px] text-foreground truncate hover:text-primary min-w-0" title={a.originalName}>{a.originalName}</a>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatFileSize(a.size)}</span>
                      <button onClick={() => deleteAttachment(a.id)} aria-label={`Delete ${a.originalName}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">No attachments</p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" /> Created {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Updated {new Date(ticket.updatedAt).toLocaleDateString()}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
