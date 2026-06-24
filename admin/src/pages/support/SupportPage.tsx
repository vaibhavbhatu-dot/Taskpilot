import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, LifeBuoy, Paperclip, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { supportApi } from '@/api';
import { formatDate, cn } from '@/lib/utils';
import type { SupportTicket } from '@/types';

const STATUS_BADGE: Record<string, any> = {
  OPEN: 'info', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'secondary',
};

const PRIORITY_BADGE: Record<string, any> = {
  LOW: 'secondary', MEDIUM: 'default', HIGH: 'warning', CRITICAL: 'error',
};

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif)$/i;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function AttachmentDisplay({ url }: { url: string }) {
  const filename = url.split('/').pop() ?? 'attachment';
  if (IMAGE_EXTS.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={url} alt={filename} className="max-w-[200px] rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline">
      <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
      {filename}
    </a>
  );
}

export default function SupportPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [replyText, setReplyText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter],
    queryFn: () => supportApi.list({ limit: 50, status: statusFilter || undefined }).then(r => r.data),
  });

  const { data: ticketDetail } = useQuery({
    queryKey: ['support-ticket', selectedId],
    queryFn: () => selectedId ? supportApi.get(selectedId).then(r => r.data) : null,
    enabled: !!selectedId,
  });

  const replyMutation = useMutation({
    mutationFn: ({ content, attachmentUrl }: { content: string; attachmentUrl?: string }) =>
      supportApi.reply(selectedId!, content, attachmentUrl),
    onSuccess: () => {
      setReplyText('');
      setAttachment(null);
      setAttachmentPreview(null);
      qc.invalidateQueries({ queryKey: ['support-ticket', selectedId] });
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => supportApi.updateStatus(selectedId!, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      qc.invalidateQueries({ queryKey: ['support-ticket', selectedId] });
      toast.success('Status updated');
    },
  });

  useEffect(() => {
    if (data?.data?.length && !selectedId) {
      setSelectedId(data.data[0].id);
    }
  }, [data]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [ticketDetail?.messages?.length]);

  // Revoke object URL on unmount / attachment change
  useEffect(() => {
    return () => { if (attachmentPreview) URL.revokeObjectURL(attachmentPreview); };
  }, [attachmentPreview]);

  const tickets: SupportTicket[] = data?.data ?? [];
  const ticket = ticketDetail;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    if (IMAGE_EXTS.test(file.name)) {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview(null);
    }
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';
  }

  function removeAttachment() {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview(null);
  }

  async function handleSend() {
    const text = replyText.trim();
    if (!text) return;

    let attachmentUrl: string | undefined;

    if (attachment) {
      try {
        const res = await supportApi.upload(attachment);
        attachmentUrl = res.data.url;
      } catch {
        toast.error('Failed to upload attachment');
        return;
      }
    }

    replyMutation.mutate({ content: text, attachmentUrl });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Support Tickets" subtitle="Manage all customer support requests" />

      <div className="flex h-[calc(100vh-200px)] border border-border rounded-xl overflow-hidden bg-card">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
          {/* Filter bar */}
          <div className="p-3 border-b border-border">
            <div className="flex gap-1">
              {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn('flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors',
                    statusFilter === s ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent')}>
                  {s === '' ? 'All' : s === 'IN_PROGRESS' ? 'Active' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 border-b border-border space-y-2">
                  <Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-24" />
                </div>
              ))
              : tickets.map(t => (
                <div key={t.id} onClick={() => setSelectedId(t.id)}
                  className={cn('p-3 cursor-pointer border-b border-border transition-colors border-l-2',
                    selectedId === t.id ? 'bg-accent border-l-primary' : 'border-l-transparent hover:bg-muted/50')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{t.ticketNumber}</span>
                    <Badge variant={STATUS_BADGE[t.status]}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{t.user.fullName}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(t.updatedAt, 'relative')}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!ticket ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <LifeBuoy className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-muted-foreground">Select a ticket</p>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="px-5 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-primary">{ticket.ticketNumber}</span>
                      <Badge variant={PRIORITY_BADGE[ticket.priority]}>{ticket.priority}</Badge>
                      <Badge variant={STATUS_BADGE[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                    </div>
                    <h2 className="text-base font-semibold text-foreground truncate">{ticket.subject}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.user.fullName} · {ticket.organization.name} · {formatDate(ticket.createdAt, 'relative')}
                    </p>
                  </div>
                  <select
                    value={ticket.status}
                    onChange={(e) => statusMutation.mutate(e.target.value)}
                    className="h-8 px-2 text-xs border border-input rounded-lg bg-card text-foreground focus:outline-none"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Original description */}
                <div className="flex justify-end">
                  <div className="max-w-[75%]">
                    <p className="text-xs text-muted-foreground text-right mb-1">
                      {ticket.user.fullName} · {formatDate(ticket.createdAt, 'relative')}
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
                      {ticket.attachmentUrl && <AttachmentDisplay url={ticket.attachmentUrl} />}
                    </div>
                  </div>
                </div>

                {(ticket.messages ?? []).map(msg => (
                  msg.isAdminReply ? (
                    <div key={msg.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-[10px] font-bold">TP</span>
                      </div>
                      <div className="max-w-[75%]">
                        <p className="text-xs text-muted-foreground mb-1">Support · {formatDate(msg.createdAt, 'relative')}</p>
                        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachmentUrl && <AttachmentDisplay url={msg.attachmentUrl} />}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[75%]">
                        <p className="text-xs text-muted-foreground text-right mb-1">
                          {msg.author?.fullName ?? 'User'} · {formatDate(msg.createdAt, 'relative')}
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl rounded-tr-sm px-4 py-3">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachmentUrl && <AttachmentDisplay url={msg.attachmentUrl} />}
                        </div>
                      </div>
                    </div>
                  )
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              {ticket.status !== 'CLOSED' ? (
                <div className="px-5 py-4 border-t border-border flex-shrink-0">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
                      className="flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach file"
                      className={cn(
                        'h-9 w-9 flex items-center justify-center rounded-lg border border-input transition-colors flex-shrink-0',
                        attachment ? 'bg-primary/10 border-primary text-primary' : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <Button
                      size="sm"
                      loading={replyMutation.isPending}
                      disabled={!replyText.trim()}
                      onClick={handleSend}
                      rightIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Send
                    </Button>
                  </div>

                  {/* Attachment preview */}
                  {attachment && (
                    <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 bg-muted rounded-lg">
                      {attachmentPreview ? (
                        <img src={attachmentPreview} alt="" className="h-8 w-8 object-cover rounded flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="flex-1 text-xs text-foreground truncate">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatBytes(attachment.size)}</span>
                      <button onClick={removeAttachment} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">⌘+Enter to send</p>
                </div>
              ) : (
                <div className="px-5 py-3 border-t border-border text-center flex-shrink-0">
                  <p className="text-sm text-muted-foreground">This ticket is closed</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
