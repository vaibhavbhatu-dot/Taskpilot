import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, Users, Zap, Ticket, Search, MessageSquare,
  BarChart3, Columns3, Inbox, Keyboard, Download, ChevronDown,
} from 'lucide-react';
import { cn } from '@/design-system';
import { useAuthStore } from '../stores';

// ── Data ─────────────────────────────────────────────────────────────────────

interface Guide {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  steps: string[];
  tip?: string;
}

interface DocsCategory {
  label: string;
  guides: Guide[];
}

const DOCS_DATA: DocsCategory[] = [
  {
    label: 'Getting started',
    guides: [
      {
        id: 'gs1',
        icon: Rocket,
        title: 'Setting up your workspace',
        description: 'Configure your organisation, branding, and default settings.',
        steps: [
          'Complete the onboarding wizard after signup — choose your team type and work style.',
          'Go to Settings (Admin only) to update your organisation name.',
          'Configure default ticket priorities to match your workflow.',
          'Set your timezone so sprint dates and notifications are accurate.',
        ],
        tip: 'Your workspace was auto-configured during onboarding. Most settings are already ready to go.',
      },
      {
        id: 'gs2',
        icon: Users,
        title: 'Inviting your team',
        description: 'Add members and assign roles so everyone has the right access.',
        steps: [
          'Go to Members in the left sidebar.',
          "Click 'Invite Member' in the top right.",
          'Enter their work email and select their role: Admin, Manager, or Member.',
          "They'll receive an email with a setup link to create their account.",
          'Once they complete setup they appear in your Members list.',
        ],
        tip: 'Invited users must use the same email address you invited. The link expires after 7 days.',
      },
      {
        id: 'gs3',
        icon: Zap,
        title: 'Creating your first project and sprint',
        description: 'Organise work into projects and plan your first sprint.',
        steps: [
          "Go to Projects → click 'Create Project' → enter a name and key (e.g. APP).",
          "Go to Sprint Planning → click 'New Sprint' → set a name, dates, and goal.",
          'Drag tickets from the Backlog on the left into the sprint panel on the right.',
          "Click 'Start Sprint' when ready — tickets move to Active Sprint.",
        ],
      },
    ],
  },
  {
    label: 'Ticket management',
    guides: [
      {
        id: 'tm1',
        icon: Ticket,
        title: 'Creating and managing tickets',
        description: 'The full lifecycle of a ticket from creation to live.',
        steps: [
          "Click '+ Create Ticket' in the top right of the Tickets page.",
          'Fill in title, type (Bug/Feature/Task/Improvement), and priority.',
          'Assign to a team member and set a due date if needed.',
          'Add labels to group related tickets together.',
          "Click 'Create Ticket' — it appears in your ticket list and backlog.",
        ],
        tip: 'Use bulk select (checkboxes on the left) to update multiple tickets at once.',
      },
      {
        id: 'tm2',
        icon: Search,
        title: 'Filtering and searching tickets',
        description: 'Find the exact tickets you need quickly.',
        steps: [
          'Use the search bar (⌘K) to find tickets by title, ticket number, or assignee.',
          'Use the Advanced Filters bar to filter by status, priority, type, assignee, or date.',
          'Combine multiple filters — e.g. Status: In Progress + Priority: High.',
          "Click 'Clear filters' to reset back to all tickets.",
        ],
      },
      {
        id: 'tm3',
        icon: MessageSquare,
        title: 'Comments and @mentions',
        description: 'Collaborate and notify teammates directly on tickets.',
        steps: [
          'Open any ticket and scroll to the Activity section.',
          'Type in the comment box and click Post (or ⌘+Enter).',
          'Type @ to mention a teammate — a dropdown appears with your team members.',
          'Select a name to insert @Name — they get notified by email.',
          'Use @all to notify every assignee on the ticket.',
        ],
      },
    ],
  },
  {
    label: 'Sprint management',
    guides: [
      {
        id: 'sm1',
        icon: Zap,
        title: 'Running your first sprint',
        description: 'How to scope, plan, and kick off a sprint with your team.',
        steps: [
          'Go to Sprint Planning — your backlog tickets are on the left.',
          'Drag tickets into the sprint panel on the right.',
          "Click 'Start Sprint' to begin — tickets move to Active Sprint.",
          'Track progress on the Active Sprint page — move tickets as work progresses.',
          "Click 'Complete Sprint' when done — incomplete tickets return to backlog.",
        ],
        tip: 'Aim to complete 70–80% of sprint tickets. Under-committing is better than over-committing.',
      },
      {
        id: 'sm2',
        icon: BarChart3,
        title: 'Sprint reports and metrics',
        description: 'Measure velocity and review completed work after a sprint.',
        steps: [
          'Go to Sprint Reports in the left sidebar.',
          'Select a sprint from the dropdown to view its report.',
          'Review completion rate, total vs completed tickets, and status breakdown.',
          'Use the Team Performance table to see individual contribution.',
          'Use this data to plan better in your next sprint.',
        ],
      },
    ],
  },
  {
    label: 'Board & backlog',
    guides: [
      {
        id: 'bb1',
        icon: Columns3,
        title: 'Using the Kanban board',
        description: 'Visualise work in progress and move tickets with drag and drop.',
        steps: [
          'Go to Kanban Board in the left sidebar.',
          'Each column represents a ticket status.',
          'Drag any ticket card from one column to another to update its status.',
          'Use the filter bar to filter by sprint, assignee, or type.',
          'Use Swimlane to group tickets by assignee or priority.',
        ],
      },
      {
        id: 'bb2',
        icon: Inbox,
        title: 'Managing your backlog',
        description: 'Keep your backlog groomed and ready for sprint planning.',
        steps: [
          'Go to Backlog in the left sidebar.',
          'All tickets not assigned to a sprint appear here.',
          'Sort and prioritise tickets by dragging or changing priority.',
          'Move tickets to a sprint by going to Sprint Planning.',
          'Regularly review and clean up your backlog — remove outdated tickets.',
        ],
      },
    ],
  },
  {
    label: 'Tips & shortcuts',
    guides: [
      {
        id: 'ts1',
        icon: Keyboard,
        title: 'Keyboard shortcuts',
        description: 'Navigate and act faster without touching the mouse.',
        steps: [
          '⌘K (or Ctrl+K on Windows) — open global search.',
          '⌘+Enter inside a comment box — post the comment.',
          'Drag & drop on the Kanban board to update ticket status.',
          'Click any ticket number (e.g. APP-12) to open the ticket detail.',
        ],
        tip: 'The search bar finds tickets, members, and projects all in one place.',
      },
      {
        id: 'ts2',
        icon: Download,
        title: 'Exporting data',
        description: 'Download tickets and sprint data for reporting.',
        steps: [
          "Go to Tickets page → click the 'Export' button in the top right.",
          'Choose CSV format — all visible tickets are exported.',
          'For sprint data, go to Sprint Reports → select a sprint → export.',
          'Use exports for reporting, sharing with stakeholders, or data backup.',
        ],
      },
    ],
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  function toggleGuide(id: string) {
    setOpenGuide((prev) => (prev === id ? null : id));
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
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Documentation</h1>
          <p className="text-sm text-[#64748B]">
            Step-by-step guides for everything in TaskPilot
          </p>
        </div>

        {/* Guide categories */}
        <div className="space-y-8">
          {DOCS_DATA.map((cat) => (
            <div key={cat.label}>
              <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                {cat.label}
              </h2>
              <div className="space-y-2">
                {cat.guides.map((guide) => (
                  <div
                    key={guide.id}
                    className="border border-[#E2E8F0] rounded-xl overflow-hidden transition-all"
                  >
                    {/* Clickable header */}
                    <div
                      onClick={() => toggleGuide(guide.id)}
                      className={cn(
                        'flex items-center gap-4 p-5 cursor-pointer transition-colors',
                        openGuide === guide.id
                          ? 'bg-[#EFF6FF] border-b border-[#BFDBFE]'
                          : 'bg-white hover:bg-[#F8FAFC]',
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        openGuide === guide.id
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#EFF6FF] text-[#2563EB]',
                      )}>
                        <guide.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-semibold mb-0.5',
                          openGuide === guide.id ? 'text-[#1D4ED8]' : 'text-[#0F172A]',
                        )}>
                          {guide.title}
                        </p>
                        <p className="text-xs text-[#64748B]">{guide.description}</p>
                      </div>
                      <ChevronDown className={cn(
                        'w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform duration-200',
                        openGuide === guide.id && 'rotate-180',
                      )} />
                    </div>

                    {/* Expandable content */}
                    {openGuide === guide.id && (
                      <div className="bg-white px-5 py-4 border-t border-[#EFF6FF]">
                        <ol className="space-y-3">
                          {guide.steps.map((step, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <p className="text-sm text-[#0F172A] leading-relaxed">{step}</p>
                            </li>
                          ))}
                        </ol>
                        {guide.tip && (
                          <div className="mt-4 flex gap-2 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
                            <span className="text-sm">💡</span>
                            <p className="text-xs text-[#92400E]">{guide.tip}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
