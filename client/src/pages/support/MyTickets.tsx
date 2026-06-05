import { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Send, LifeBuoy } from 'lucide-react';
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

const FILTER_LABELS: Record<string, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export function MyTicketsPage() {
  const [tickets, setTickets]       = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ticket, setTicket]         = useState<TicketDetail | null>(null);
  const [messages, setMessages]     = useState<SupportMessage[]>([]);
  const [filter, setFilter]         = useState('OPEN');
  const [replyText, setReplyText]   = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const messagesEndRef              = useRef<HTMLDivElement>(null);

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

  async function handleReply() {
    if (!selectedId || !replyText.trim()) return;
    const text = replyText.trim();
    setIsReplying(true);
    // Optimistic insert
    const optimistic: SupportMessage = {
      id: `_tmp_${Date.now()}`,
      content: text,
      isAdminReply: false,
      attachmentUrl: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyText('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      await supportApi.replyToTicket(selectedId, { content: text });
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
                <div className="flex gap-3 items-end">
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
