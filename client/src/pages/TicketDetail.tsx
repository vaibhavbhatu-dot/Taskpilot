import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Tag as TagIcon, Clock } from 'lucide-react';
import { ticketsApi, commentsApi, usersApi, teamsApi } from '../api';
import { useAuthStore } from '../stores';
import type { Ticket, Comment, TicketHistory, TicketStatus, TicketPriority, User, Team } from '../types';

const STATUS_OPTIONS: TicketStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
const PRIORITY_OPTIONS: TicketPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const isOverdue = (d: string, status: string) =>
  new Date(d) < new Date() && status !== 'DONE';

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

  async function handleAddComment() {
    if (!newComment.trim() || !ticket) return;
    try {
      await commentsApi.create(ticket.id, { content: newComment });
      setNewComment('');
      const res = await commentsApi.list(ticket.id);
      setComments(res.data);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
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
              <span className="text-[12px] font-mono text-[#2563EB] font-medium">{ticket.ticketNumber}</span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B]">
                {ticket.type}
              </span>
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
              {ticket.assignedTo ? (
                <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                  <div className="w-5 h-5 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                    <span className="text-[9px] text-[#2563EB]">{getInitials(ticket.assignedTo?.fullName || 'U')}</span>
                  </div>
                  {ticket.assignedTo?.fullName}
                </div>
              ) : <span>Unassigned</span>}
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
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-semibold text-[#2563EB]">{getInitials(user?.fullName || 'U')}</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="input min-h-[80px] resize-none pb-12"
                    />
                    <div className="flex justify-end -mt-10 mr-2 relative z-10">
                      <button onClick={handleAddComment} disabled={!newComment.trim()} className="btn-primary btn-sm">
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
                        <p className="text-[14px] text-[#0F172A] whitespace-pre-wrap">{comment.content}</p>
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
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Priority</label>
              <select value={ticket.priority} onChange={(e) => handleFieldChange('priority', e.target.value)} className="input text-[13px] font-medium h-9">
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Assignee</label>
              <select value={ticket.assignedToId || ''} onChange={(e) => handleFieldChange('assignedToId', e.target.value)} className="input text-[13px] h-9">
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
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

            {/* Story Points */}
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1 block">Story Points</label>
              <select value={ticket.storyPoints || ''} onChange={(e) => handleFieldChange('storyPoints', e.target.value ? Number(e.target.value) : null)} className="input text-[13px] h-9 w-24">
                <option value="">—</option>
                {FIBONACCI.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
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

            <div className="border-t border-[#E2E8F0] pt-4 mt-2">
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
