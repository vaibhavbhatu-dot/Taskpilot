import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, MessageSquare } from 'lucide-react';
import { Button, cn } from '@/design-system';
import { useAuthStore } from '../stores';

// ── Data ─────────────────────────────────────────────────────────────────────

interface FAQItem {
  id: string;
  q: string;
  a: string;
}

interface FAQCategory {
  label: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    label: 'Getting started',
    items: [
      {
        id: 'gs1',
        q: 'How do I create my first ticket?',
        a: 'Go to My Tickets in the sidebar, then click "New ticket" in the top right. Fill in the title, status, priority, and assign it to a team member. You can also create tickets directly from the Kanban Board or Backlog views.',
      },
      {
        id: 'gs2',
        q: 'What do the different ticket statuses mean?',
        a: 'Tickets flow through: Backlog → Requirements → Design → HTML → On Development → QA → Bugs → Enhancement → UAT → Live → Not Required. Each status represents a stage in the development lifecycle. You can move tickets forward or backward at any time.',
      },
      {
        id: 'gs3',
        q: 'How do I invite team members?',
        a: 'Admins can invite members from the Members page in the sidebar. Enter the email address and select a role (Admin, Manager, Project Manager, or Member). An invitation email will be sent with a link to set up their profile.',
      },
      {
        id: 'gs4',
        q: "What's the difference between a Project and a Sprint?",
        a: 'A Project is a long-running container that groups related work (e.g. "Website redesign"). A Sprint is a fixed time-box (typically 1–2 weeks) within which specific tickets are planned and completed. One project can have many sprints.',
      },
    ],
  },
  {
    label: 'Tickets',
    items: [
      {
        id: 't1',
        q: 'How do I assign a ticket to someone?',
        a: 'Open the ticket detail panel by clicking any ticket row. In the Assignee field, select a team member from the dropdown. They will receive a notification once assigned.',
      },
      {
        id: 't2',
        q: 'Can I attach files to a ticket?',
        a: 'Yes. When creating or editing a ticket, use the attachment field to upload images or documents. Files are stored and accessible to all team members who can view the ticket.',
      },
      {
        id: 't3',
        q: 'How do I change the priority of a ticket?',
        a: 'Click the priority badge on any ticket row or inside the ticket detail panel. Choose from Low, Medium, High, or Critical. Priority affects how tickets are sorted in the Backlog and Sprint Planning views.',
      },
      {
        id: 't4',
        q: 'What happens when a ticket reaches "Live" status?',
        a: 'Live is the final active status — it means the work is deployed and visible in production. The ticket stays in the system for reference. If issues arise afterwards, a new Bug or Enhancement ticket should be created.',
      },
    ],
  },
  {
    label: 'Sprints',
    items: [
      {
        id: 'sp1',
        q: 'How do I start a sprint?',
        a: 'Go to Sprint Planning and create a new sprint with a name and date range. Drag tickets from the backlog into the sprint. When ready, click "Start Sprint." The sprint becomes visible in Active Sprint for your team.',
      },
      {
        id: 'sp2',
        q: 'Can I move tickets between sprints?',
        a: 'Yes. In Sprint Planning, drag a ticket from one sprint column to another, or back to the backlog. If the sprint is already active, you can still add or remove tickets from the Active Sprint view.',
      },
      {
        id: 'sp3',
        q: 'What happens to unfinished tickets when a sprint ends?',
        a: "When you complete a sprint, unfinished tickets (anything not at Live or Not Required) are automatically moved back to the backlog. They'll appear at the top of the backlog so you can reprioritise them for the next sprint.",
      },
    ],
  },
  {
    label: 'Board',
    items: [
      {
        id: 'b1',
        q: 'How do I move a ticket on the board?',
        a: 'Drag and drop the ticket card from one column to another. The ticket status updates automatically. You can also click a ticket to open the detail panel and change the status from the dropdown.',
      },
      {
        id: 'b2',
        q: 'What are swimlanes?',
        a: 'Swimlanes divide each status column by a grouping (e.g. assignee or priority), so you can see at a glance who has what in each stage. Toggle swimlanes on/off using the View options menu in the top right of the Board.',
      },
    ],
  },
  {
    label: 'Teams & members',
    items: [
      {
        id: 'tm1',
        q: 'How do I create a team?',
        a: 'Go to Teams in the sidebar and click "New team." Give it a name, optionally a description, and then add members. Teams can be assigned to projects so tickets can be filtered and reported by team.',
      },
      {
        id: 'tm2',
        q: 'What are the different user roles?',
        a: 'There are four roles: Admin (full access including settings and member management), Manager (all project features, no admin sections), Project Manager (same as Manager), and Member (tickets, board, and sprints only). Roles are set per-workspace.',
      },
      {
        id: 'tm3',
        q: 'How do I remove a member from my workspace?',
        a: 'Admins can remove members from the Members page. Click the three-dot menu next to a member and select "Remove." Their tickets are not deleted but become unassigned. This action is reversible by re-inviting the member.',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'ac1',
        q: 'How do I change my password?',
        a: 'Go to My Profile (click your avatar in the top right → My Profile). Scroll to the Security section and click "Change password." Enter your current password and choose a new one.',
      },
      {
        id: 'ac2',
        q: 'How do I update my profile picture?',
        a: 'Go to My Profile and click the avatar image. Upload a new photo (JPG or PNG, max 5 MB). Changes are reflected immediately across the app for all team members.',
      },
      {
        id: 'ac3',
        q: 'How do I contact support?',
        a: 'Click the Support button in the top navigation bar, or go to /support/my-tickets directly. You can submit a ticket describing your issue. Our team responds within 24 hours. For urgent issues mark your ticket as Critical priority.',
      },
    ],
  },
];

// ── Accordion item ────────────────────────────────────────────────────────────

function AccordionItem({ item, isOpen, onToggle }: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#E2E8F0]">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-[#0F172A]">{item.q}</span>
        <ChevronDown className={cn(
          'w-4 h-4 text-[#94A3B8] transition-transform flex-shrink-0',
          isOpen && 'rotate-180',
        )} />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-[#64748B] leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_DATA;
    return FAQ_DATA.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top header */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 h-14 flex items-center justify-between">
        <span className="text-base font-semibold text-[#0F172A]">TaskPilot</span>
        {isAuthenticated && (
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-[#2563EB] hover:underline font-medium"
          >
            ← Back to app
          </button>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[#64748B]">Quick answers to common questions</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpenId(null); }}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>

        {/* Accordion categories */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-[#94A3B8]">No results for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((cat) => (
              <div key={cat.label}>
                <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-1">
                  {cat.label}
                </h2>
                <div className="bg-white border border-[#E2E8F0] rounded-xl px-5">
                  {cat.items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      item={item}
                      isOpen={openId === item.id}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center border-t border-[#E2E8F0] pt-10">
          <MessageSquare className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#0F172A] mb-1">Still need help?</p>
          <p className="text-sm text-[#64748B] mb-4">
            Our support team responds within 24 hours.
          </p>
          <Button onClick={() => navigate('/support/my-tickets')}>
            Submit a support ticket
          </Button>
        </div>
      </main>
    </div>
  );
}
