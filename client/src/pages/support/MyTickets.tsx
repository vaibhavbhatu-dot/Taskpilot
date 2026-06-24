import { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Send, LifeBuoy, Paperclip, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Textarea, formatDate, cn } from '@/design-system';
import { supportApi } from '../../api';
import { SubmitTicketModal } from '../../components/support/SubmitTicketModal';

// ── Types ────────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface SupportMessage {
  id: string;
  content: string;
  isAdminReply: boolean;
  attachmentUrl: string | null;
  createdAt: string;
}

interface TicketDetail extends SupportTicket {
  description: string;
  attachmentUrl: string | null;
  expectedResolutionDate: string | null;
  resolvedAt: string | null;
  messages: SupportMessage[];
}

// ── Badge helpers ────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { variant: any; label: string }> = {
    OPEN:        { variant: 'info',      label: 'Open' },
    IN_PROGRESS: { variant: 'warning',   label: 'In Progress' },
    RESOLVED:    { variant: 'success',   label: 'Resolved' },
    CLOSED:      { variant: 'secondary', label: 'Closed' },
  };
  const cfg = map[status] ?? { variant: 'secondary', label: status };
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}

function categoryBadge(category: string) {
  const map: Record<string, { variant: any; label: string }> = {
    BUG:     { variant: 'error',     label: 'Bug' },
    FEATURE: { variant: 'info',      label: 'Feature' },
    ACCOUNT: { variant: 'warning',   label: 'Account' },
    BILLING: { variant: 'secondary', label: 'Billing' },
    OTHER:   { variant: 'secondary', label: 'Other' },
  };
  const cfg = map[category] ?? { variant: 'secondary', label: category };
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif)$/i;

function AttachmentDisplay({ url }: { url: string }) {
  const filename = url.split('/').pop() ?? 'attachment';
  if (IMAGE_EXTS.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={url} alt={filename} className="max-w-[200px] rounded-lg border border-[#E2E8F0] cursor-pointer hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#2563EB] hover:underline">
      <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
      {filename}
    </a>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const FILTER_LABELS: Record<string, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export function MyTicketsPage() {
  const [tickets, setTickets]               = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [ticket, setTicket]                 = useState<TicketDetail | null>(null);
  const [messages, setMessages]             = useState<SupportMessage[]>([]);
  const [filter, setFilter]                 = useState('OPEN');
  const [replyText, setReplyText]           = useState('');
  const [isReplying, setIsReplying]         = useState(false);
  const [showForm, setShowForm]             = useState(false);
  const [attachment, setAttachment]         = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const messagesEndRef                      = useRef<HTMLDivElement>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const filteredTickets = tickets.filter((t) => t.status === filter);

  async function loadTickets() {
    try {
      const { data } = await supportApi.getMyTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    }
  }

  useEffect(() => { loadTickets(); }, []);

  // Auto-select first ticket once list loads
  useEffect(() => {
    if (tickets.length > 0 && !selectedId) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets]);

  // Load detail when selection changes
  useEffect(() => {
    if (!selectedId) return;
    setTicket(null);
    setMessages([]);
    supportApi.getTicket(selectedId)
      .then((res) => {
        const d = res.data as TicketDetail;
        setTicket(d);
        setMessages(d.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => toast.error('Failed to load ticket'));
  }, [selectedId]);

  // Revoke preview object URL when attachment changes
  useEffect(() => {
    return () => { if (attachmentPreview) URL.revokeObjectURL(attachmentPreview); };
  }, [attachmentPreview]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    setAttachmentPreview(IMAGE_EXTS.test(file.name) ? URL.createObjectURL(file) : null);
    e.target.value = '';
  }

  function removeAttachment() {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview(null);
  }

  async function handleReply() {
    if (!selectedId || !replyText.trim()) return;
    const text = replyText.trim();
    setIsReplying(true);

    let attachmentUrl: string | undefined;

    if (attachment) {
      try {
        const res = await supportApi.uploadAttachment(attachment);
        attachmentUrl = res.data.url;
      } catch {
        toast.error('Failed to upload attachment');
        setIsReplying(false);
        return;
      }
    }

    // Optimistic insert
    const optimistic: SupportMessage = {
      id: `_tmp_${Date.now()}`,
      content: text,
      isAdminReply: false,
      attachmentUrl: attachmentUrl ?? null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyText('');
    setAttachment(null);
    setAttachmentPreview(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await supportApi.replyToTicket(selectedId, { content: text, attachmentUrl });
      const { data } = await supportApi.getTicket(selectedId);
      const d = data as TicketDetail;
      setMessages(d.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      toast.error('Failed to send reply');
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReplyText(text);
    } finally {
      setIsReplying(false);
    }
  }

  function handleModalClose() {
    setShowForm(false);
    loadTickets();
  }

  return (
    <div className="-mx-8 -my-7 flex h-[calc(100vh-64px)] overflow-hidden bg-[#F8FAFC]">

      {/* ── LEFT PANEL — ticket list ── */}
      <div className="w-[360px] flex-shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
          <h1 className="text-base font-semibold text-[#0F172A]">Support</h1>
          <Button
            variant="default"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowForm(true)}
          >
            New ticket
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-[#E2E8F0]">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 py-2 text-xs font-medium border-b-2 transition-colors',
                filter === f
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]',
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Ticket rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={cn(
                'px-4 py-3 cursor-pointer border-b border-[#F1F5F9] transition-colors border-l-2',
                selectedId === t.id
                  ? 'bg-[#EFF6FF] border-l-[#2563EB]'
                  : 'hover:bg-[#F8FAFC] border-l-transparent',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-[#2563EB]">
                  {t.ticketNumber}
                </span>
                {statusBadge(t.status)}
              </div>
              <p className={cn(
                'text-sm truncate mb-1',
                (t._count?.messages ?? 0) === 0
                  ? 'font-semibold text-[#0F172A]'
                  : 'font-normal text-[#0F172A]',
              )}>
                {t.subject}
              </p>
              <div className="flex items-center justify-between">
                {categoryBadge(t.category)}
                <span className="text-xs text-[#94A3B8]">
                  {formatDate(t.updatedAt, 'relative')}
                </span>
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <MessageSquare className="w-8 h-8 text-[#E2E8F0]" />
              <p className="text-sm text-[#94A3B8]">No tickets</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — detail / thread ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {!selectedId || !ticket ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center">
              <LifeBuoy className="w-8 h-8 text-[#CBD5E1]" />
            </div>
            <p className="text-base font-medium text-[#64748B]">Select a ticket to view</p>
            <p className="text-sm text-[#94A3B8]">Or create a new support request</p>
          </div>
        ) : (
          <>
            {/* Ticket header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex-shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-sm font-bold text-[#2563EB]">
                  {ticket.ticketNumber}
                </span>
                {categoryBadge(ticket.category)}
                {statusBadge(ticket.status)}
              </div>
              <h2 className="text-lg font-semibold text-[#0F172A] truncate">
                {ticket.subject}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Opened {formatDate(ticket.createdAt, 'relative')}
                {ticket.expectedResolutionDate && (
                  <span className="ml-3 text-[#F59E0B]">
                    Expected by {formatDate(ticket.expectedResolutionDate, 'short')}
                  </span>
                )}
              </p>
            </div>

            {/* Thread — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Original description as first user bubble */}
              <div className="flex justify-end">
                <div className="max-w-[75%]">
                  <p className="text-xs text-[#94A3B8] text-right mb-1">
                    You · {formatDate(ticket.createdAt, 'relative')}
                  </p>
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm text-[#0F172A] whitespace-pre-wrap">
                      {ticket.description}
                    </p>
                    {ticket.attachmentUrl && <AttachmentDisplay url={ticket.attachmentUrl} />}
                  </div>
                </div>
              </div>

              {/* Reply messages */}
              {messages.map((msg) =>
                msg.isAdminReply ? (
                  <div key={msg.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">TP</span>
                    </div>
                    <div className="max-w-[75%]">
                      <p className="text-xs text-[#64748B] mb-1">
                        TaskPilot Support · {formatDate(msg.createdAt, 'relative')}
                      </p>
                      <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{msg.content}</p>
                        {msg.attachmentUrl && <AttachmentDisplay url={msg.attachmentUrl} />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[75%]">
                      <p className="text-xs text-[#94A3B8] text-right mb-1">
                        You · {formatDate(msg.createdAt, 'relative')}
                      </p>
                      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{msg.content}</p>
                        {msg.attachmentUrl && <AttachmentDisplay url={msg.attachmentUrl} />}
                      </div>
                    </div>
                  </div>
                )
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply input — pinned to bottom */}
            {ticket.status === 'CLOSED' ? (
              <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center flex-shrink-0">
                <p className="text-sm text-[#94A3B8]">This ticket is closed</p>
              </div>
            ) : (
              <div className="px-6 py-4 border-t border-[#E2E8F0] bg-white flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply();
                    }}
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
                      'h-9 w-9 flex items-center justify-center rounded-lg border transition-colors flex-shrink-0',
                      attachment
                        ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                        : 'border-[#E2E8F0] text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]',
                    )}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <Button
                    variant="default"
                    size="sm"
                    loading={isReplying}
                    disabled={!replyText.trim()}
                    onClick={handleReply}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </div>

                {/* Attachment pill */}
                {attachment && (
                  <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 bg-[#F1F5F9] rounded-lg">
                    {attachmentPreview ? (
                      <img src={attachmentPreview} alt="" className="h-8 w-8 object-cover rounded flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                    )}
                    <span className="flex-1 text-xs text-[#0F172A] truncate">{attachment.name}</span>
                    <span className="text-xs text-[#94A3B8] flex-shrink-0">{formatBytes(attachment.size)}</span>
                    <button
                      onClick={removeAttachment}
                      className="text-[#94A3B8] hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className="text-xs text-[#94A3B8] mt-1.5">Cmd+Enter to send</p>
              </div>
            )}
          </>
        )}
      </div>

      <SubmitTicketModal open={showForm} onClose={handleModalClose} />
    </div>
  );
}
