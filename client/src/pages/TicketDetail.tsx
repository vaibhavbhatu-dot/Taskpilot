import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Tag as TagIcon, Clock, Users, Paperclip, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';
import { ticketsApi, commentsApi, usersApi, teamsApi } from '../api';
import { useAuthStore } from '../stores';
import type { Ticket, Comment, TicketHistory, TicketPriority, User, Team } from '../types';
import { TICKET_STATUSES, getStatusLabel } from '../constants/ticketStatus';

const STATUS_OPTIONS = TICKET_STATUSES;
const PRIORITY_OPTIONS: TicketPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];


const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const isOverdue = (d: string, status: string) =>
  new Date(d) < new Date() && status !== 'DEPLOYED';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [newComment, setNewComment] = useState('');
  
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  // sprints not needed for display atm
  
  const [loading, setLoading] = useState(true);
  // saving state removed as optimistic update is fast
  const [toast, setToast] = useState('');

  // Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isDescChanged, setIsDescChanged] = useState(false);

  // Assignee multi-select
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

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
    } catch (error) {
      console.error('Failed to load ticket:', error);
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

  async function handleFieldChange(field: string, value: any) {
    if (!ticket) return;
    // removed setSaving
    try {
      const payload: any = { [field]: value };
      
      // Handle special cases
      if (field === 'assignedToId' && !value) payload.assignedToId = null;
      if (field === 'teamId' && !value) payload.teamId = null;
      if (field === 'dueDate' && !value) payload.dueDate = null;

      const { data } = await ticketsApi.update(ticket.id, payload);
      setTicket((prev: any) => ({ ...prev, ...data }));
      
      setToast('Change saved');
      setTimeout(() => setToast(''), 3000);
      
      const histRes = await ticketsApi.getHistory(ticket.id);
      setHistory(histRes.data);
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      // no-op
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
      const { data: newCommentData } = await commentsApi.create(ticket.id, { content: commentContent });

      // Upload files scoped to this comment
      if (commentFiles.length > 0) {
        await Promise.allSettled(
          commentFiles.map(f => ticketsApi.uploadAttachment(ticket.id, f, newCommentData.id))
        );
      }

      setNewComment('');
      commentPreviews.forEach(url => URL.revokeObjectURL(url));
      setCommentFiles([]);
      setCommentPreviews([]);
      const res = await commentsApi.list(ticket.id);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to add comment:', error);
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-[#64748B]">Ticket not found</p>
        <button onClick={() => navigate('/tickets')} className="btn-primary mt-4">Back to Tickets</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#10B981] text-white px-4 py-3 rounded-xl text-[14px] font-medium shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/tickets')} className="text-[#64748B] hover:text-[#0F172A] text-sm font-medium flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Tickets
        </button>
        <span className="text-[#CBD5E1]">/</span>
        <span className="text-[#2563EB] font-mono text-[13px]">{ticket.ticketNumber}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main Content (65%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B]">{ticket.type}</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                ticket.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>{ticket.priority}</span>
            </div>
            
            {/* Editable Title */}
            {isEditingTitle ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                className="w-full text-[22px] font-semibold text-[#0F172A] outline-none border-b border-[#2563EB] bg-transparent py-1 mb-2"
              />
            ) : (
              <h1 
                onClick={() => setIsEditingTitle(true)}
                className="text-[22px] font-semibold text-[#0F172A] mb-3 cursor-text hover:bg-[#F8FAFC] rounded px-1 -mx-1 py-0.5 transition-colors"
              >
                {ticket.title}
              </h1>
            )}

            <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
              <span>Created by</span>
              <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                <div className="w-5 h-5 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <span className="text-[9px] text-[#2563EB]">{getInitials(ticket.createdBy?.fullName || 'U')}</span>
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
                      <div key={a.userId} className="w-5 h-5 rounded-full bg-[#DBEAFE] flex items-center justify-center border border-white" style={{ marginLeft: i > 0 ? '-4px' : 0 }} title={a.user.fullName}>
                        <span className="text-[9px] text-[#2563EB]">{getInitials(a.user.fullName)}</span>
                      </div>
                    ))}
                    <span className="ml-1 font-medium text-[#0F172A]">
                      {assignees.length === 1 ? assignees[0].user.fullName : `${assignees.length} assignees`}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h3 className="text-[15px] font-semibold text-[#0F172A] mb-3">Description</h3>
            <textarea
              value={editDesc}
              onChange={(e) => {
                setEditDesc(e.target.value);
                setIsDescChanged(e.target.value !== (ticket.description || ''));
              }}
              placeholder="Add a detailed description..."
              className="w-full min-h-[120px] text-[14px] text-[#0F172A] outline-none resize-y placeholder:text-[#94A3B8]"
            />
            {isDescChanged && (
              <div className="flex justify-end mt-3 animate-fade-in">
                <button onClick={saveDescription} className="btn-primary btn-sm">
                  Save Description
                </button>
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div>
            <h3 className="text-[16px] font-semibold text-[#0F172A] mb-4">Activity</h3>
            
            <div className="flex gap-6 border-b border-[#E2E8F0] mb-5">
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${
                  activeTab === 'comments' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${
                  activeTab === 'history' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                History ({history.length})
              </button>
            </div>

            {activeTab === 'comments' ? (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[11px] font-semibold text-[#2563EB]">{getInitials(user?.fullName || 'U')}</span>
                  </div>
                  <div className="flex-1 border border-[#E2E8F0] rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-shadow">
                    {/* Text area */}
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      onKeyDown={e => e.key === 'Enter' && e.metaKey && handleAddComment()}
                      className="w-full px-4 pt-3 pb-2 text-[14px] text-[#0F172A] outline-none resize-none placeholder:text-[#94A3B8] min-h-[80px] bg-transparent"
                    />

                    {/* File previews */}
                    {commentFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-4 pb-2">
                        {commentFiles.map((f, i) => (
                          <div key={i} className="relative group">
                            {commentPreviews[i] ? (
                              /* Image preview */
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
                                <img src={commentPreviews[i]} alt={f.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              /* Non-image file */
                              <div className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg max-w-[180px]">
                                <Paperclip className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                                <span className="text-[12px] text-[#0F172A] truncate">{f.name}</span>
                                <span className="text-[11px] text-[#94A3B8] flex-shrink-0">{formatFileSize(f.size)}</span>
                              </div>
                            )}
                            {/* Remove button */}
                            <button
                              onClick={() => removeCommentFile(i)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >×</button>
                            {/* Filename tooltip on image */}
                            {commentPreviews[i] && (
                              <p className="text-[10px] text-[#94A3B8] mt-0.5 text-center truncate max-w-[64px]">{f.name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-[#F1F5F9] bg-[#F8FAFC]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => commentFileRef.current?.click()}
                          className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
                          title="Attach file"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Attach
                          {commentFiles.length > 0 && (
                            <span className="ml-0.5 w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] flex items-center justify-center">
                              {commentFiles.length}
                            </span>
                          )}
                        </button>
                        <input ref={commentFileRef} type="file" multiple className="hidden"
                          onChange={e => handleCommentFileSelect(e.target.files)} />
                        <span className="text-[11px] text-[#94A3B8] ml-1">⌘+Enter to post</span>
                      </div>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() && commentFiles.length === 0}
                        className="h-7 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-semibold text-[#64748B]">{getInitials(comment.author?.fullName || 'U')}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-medium text-[#0F172A]">{comment.author?.fullName}</span>
                          <span className="text-[12px] text-[#64748B]">
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {comment.content !== '📎 Attached files' && (
                          <p className="text-[14px] text-[#0F172A] whitespace-pre-wrap">{comment.content}</p>
                        )}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {comment.attachments.map(a => {
                              const isImage = a.mimeType?.startsWith('image/');
                              return isImage ? (
                                <a key={a.id} href={`http://localhost:5000${a.url}`} target="_blank" rel="noopener noreferrer"
                                  className="block w-24 h-24 rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] hover:opacity-90 transition-opacity flex-shrink-0">
                                  <img src={`http://localhost:5000${a.url}`} alt={a.originalName} className="w-full h-full object-cover" />
                                </a>
                              ) : (
                                <a key={a.id} href={`http://localhost:5000${a.url}`} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-colors max-w-[220px]">
                                  <Paperclip className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                                  <span className="text-[12px] text-[#0F172A] truncate">{a.originalName}</span>
                                  <span className="text-[11px] text-[#94A3B8] flex-shrink-0">{formatFileSize(a.size)}</span>
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
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-[#EFF6FF] border-2 border-white flex items-center justify-center shadow-sm z-10">
                       <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                    </div>
                    <div className="pl-10 w-full flex items-center justify-between">
                      <div className="text-[13px]">
                        <span className="font-medium text-[#0F172A]">{entry.changedBy?.fullName}</span>
                        <span className="text-[#64748B]"> changed {entry.fieldChanged} </span>
                        {entry.oldValue && <span className="text-[#94A3B8] line-through">{entry.oldValue.replace(/_/g, ' ')}</span>}
                        {entry.oldValue && entry.newValue && <span className="text-[#94A3B8] mx-1">→</span>}
                        {entry.newValue && <span className="font-medium text-[#0F172A]">{entry.newValue.replace(/_/g, ' ')}</span>}
                      </div>
                      <span className="text-[11px] text-[#94A3B8] flex-shrink-0 whitespace-nowrap">
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
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
            
            {/* Status */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Status</label>
              <select value={ticket.status} onChange={(e) => handleFieldChange('status', e.target.value)} className="input text-[13px] font-medium h-9">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Priority</label>
              <select value={ticket.priority} onChange={(e) => handleFieldChange('priority', e.target.value)} className="input text-[13px] font-medium h-9">
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Assignees — multi */}
            <div className="relative">
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Assignees
              </label>
              {(ticket.assignees || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(ticket.assignees || []).map(a => (
                    <span key={a.userId} className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#DBEAFE] text-[#1D4ED8] text-[12px] font-medium rounded-full">
                      <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[9px] font-bold">{getInitials(a.user.fullName)}</span>
                      {a.user.fullName.split(' ')[0]}
                      <button onClick={() => toggleAssignee(a.userId)} className="hover:text-red-500 leading-none text-[14px]">×</button>
                    </span>
                  ))}
                </div>
              )}
              <button onClick={() => setShowAssigneeDropdown(v => !v)}
                className="input text-[13px] h-9 text-left flex items-center justify-between w-full">
                <span className="text-[#94A3B8]">Add assignee...</span>
                <Users className="w-4 h-4 text-[#94A3B8]" />
              </button>
              {showAssigneeDropdown && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E2E8F0] rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-[#E2E8F0]">
                    <input autoFocus value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)}
                      placeholder="Search..." className="w-full h-7 px-2 text-[12px] border border-[#E2E8F0] rounded outline-none" />
                  </div>
                  <div className="max-h-[180px] overflow-y-auto">
                    {users.filter(u => u.fullName.toLowerCase().includes(assigneeSearch.toLowerCase())).map(u => {
                      const isSelected = ticket.assignees?.some(a => a.userId === u.id);
                      return (
                        <button key={u.id} type="button" onClick={() => { toggleAssignee(u.id); setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F8FAFC]">
                          <div className="w-6 h-6 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-[#2563EB]">{getInitials(u.fullName)}</span>
                          </div>
                          <span className="flex-1 text-[13px] text-left truncate">{u.fullName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-1.5 border-t border-[#E2E8F0]">
                    <button onClick={() => { setShowAssigneeDropdown(false); setAssigneeSearch(''); }}
                      className="w-full text-[11px] text-[#64748B] py-1">Done</button>
                  </div>
                </div>
              )}
            </div>

            {/* Team */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Team</label>
              <select value={ticket.teamId || ''} onChange={(e) => handleFieldChange('teamId', e.target.value)} className="input text-[13px] h-9">
                <option value="">No team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Sprint */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Sprint</label>
              {/* @ts-ignore - API doesn't return full sprint data on ticket right now so mapped by ID if not in list */}
              <select value={ticket.sprintTickets?.[0]?.sprintId || ''} onChange={(e) => {
                // Handling sprint change would require a separate API call to sprintsApi.addTickets
                // For UI representation, keeping it read-only or placeholder if not fully implemented in API
              }} className="input text-[13px] h-9" disabled>
                <option value="">No sprint</option>
              </select>
              <p className="text-[10px] text-[#94A3B8] mt-1">Managed via sprint board</p>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Due Date</label>
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
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {ticket.labels?.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F1F5F9] text-[#475569] text-[12px] font-medium rounded border border-[#E2E8F0]">
                    <TagIcon className="w-3 h-3 text-[#94A3B8]" /> {l}
                  </span>
                ))}
                {(!ticket.labels || ticket.labels.length === 0) && <span className="text-[13px] text-[#94A3B8]">No labels</span>}
              </div>
            </div>

            {/* Links — sidebar compact */}
            <div className="border-t border-[#E2E8F0] pt-4">
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3" /> Links
              </label>
              {(ticket.links || []).length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  {(ticket.links || []).map(l => (
                    <div key={l} className="flex items-center gap-1.5 group">
                      <ExternalLink className="w-3 h-3 text-[#2563EB] flex-shrink-0" />
                      <a href={l} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-[12px] text-[#2563EB] truncate hover:underline min-w-0"
                        title={l}>{l.replace(/^https?:\/\//, '')}</a>
                      <button onClick={() => removeLink(l)} className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-red-500 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLink()}
                  placeholder="Add a link..." className="flex-1 h-8 px-2 text-[12px] border border-[#E2E8F0] rounded-md outline-none focus:border-primary-500 bg-white min-w-0" />
                <button onClick={addLink} disabled={!linkInput.trim()}
                  className="h-8 px-2 text-[11px] font-medium text-[#475569] bg-[#F1F5F9] rounded-md hover:bg-[#E2E8F0] disabled:opacity-40 flex-shrink-0">Add</button>
              </div>
            </div>

            {/* Attachments — sidebar compact */}
            <div className="border-t border-[#E2E8F0] pt-4">
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Paperclip className="w-3 h-3" /> Attachments {uploading && <span className="text-[10px] font-normal animate-pulse text-[#64748B]">uploading…</span>}</span>
                <button onClick={() => attachFileRef.current?.click()}
                  className="text-[10px] font-medium text-[#2563EB] hover:underline">+ Add</button>
              </label>
              <input ref={attachFileRef} type="file" multiple className="hidden" onChange={e => handleAttachmentUpload(e.target.files)} />
              {(ticket.attachments || []).length > 0 ? (
                <div className="flex flex-col gap-1">
                  {(ticket.attachments || []).map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 group py-1">
                      <Paperclip className="w-3 h-3 text-[#64748B] flex-shrink-0" />
                      <a href={`http://localhost:5000${a.url}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-[12px] text-[#0F172A] truncate hover:text-[#2563EB] min-w-0" title={a.originalName}>{a.originalName}</a>
                      <span className="text-[10px] text-[#94A3B8] flex-shrink-0">{formatFileSize(a.size)}</span>
                      <button onClick={() => deleteAttachment(a.id)} className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-red-500 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#94A3B8]">No attachments</p>
              )}
            </div>

            <div className="border-t border-[#E2E8F0] pt-4">
              <p className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" /> Created {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Updated {new Date(ticket.updatedAt).toLocaleDateString()}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
