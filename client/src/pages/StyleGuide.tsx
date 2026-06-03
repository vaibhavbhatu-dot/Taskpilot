import { useEffect, useState } from 'react';
import { Moon, Sun, Plus, Search, Eye, Zap, CheckCircle2, Trash2, Settings } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { SkeletonCard, SkeletonText, SkeletonAvatar } from '@/components/ui/Skeleton';
import { useToast } from '@/design-system/hooks/useToast';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Drawer } from '@/components/ui/drawer';
import { useModal } from '@/design-system/hooks/useModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';
import { Container, Stack, Grid, Divider, PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScoreBar } from '@/components/ui/score-bar';
import { JobMatchBadge } from '@/components/ui/job-match-badge';
import { ResumeCard } from '@/components/ui/resume-card';
import { UploadZone } from '@/components/ui/upload-zone';
import { AISuggestionChip } from '@/components/ui/ai-suggestion-chip';
import { StatCard } from '@/components/ui/stat-card';
import { FileSearch, BarChart2, Target, Briefcase, User } from 'lucide-react';

// ─── token manifest ───────────────────────────────────────────────────────────
const COLOR_TOKENS: { variable: string; label: string }[] = [
  { variable: '--background',     label: 'background'    },
  { variable: '--foreground',     label: 'foreground'    },
  { variable: '--primary',        label: 'primary'       },
  { variable: '--secondary',      label: 'secondary'     },
  { variable: '--muted',          label: 'muted'         },
  { variable: '--destructive',    label: 'destructive'   },
  { variable: '--color-success',  label: 'success'       },
  { variable: '--color-warning',  label: 'warning'       },
  { variable: '--color-info',     label: 'info'          },
  { variable: '--border',         label: 'border'        },
];

// ─── dark-mode helper ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'sg-dark-mode';

function readDark(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'dark';
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
}

// ─── component ───────────────────────────────────────────────────────────────
export function StyleGuidePage() {
  const [dark, setDark] = useState<boolean>(readDark);
  const toast = useToast();
  const infoModal    = useModal();
  const confirmModal = useModal();
  const drawer       = useModal();

  // Sync class + storage whenever dark changes
  useEffect(() => {
    applyDark(dark);
  }, [dark]);

  // Restore on unmount so the rest of the app stays unaffected
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  function toggleDark() {
    setDark(prev => !prev);
  }

  return (
    <div
      className="min-h-screen p-8 transition-colors duration-200"
      style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
    >
      <div className="max-w-5xl mx-auto space-y-12">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight">
              Design System
            </h1>
            <p
              className="mt-1 text-[15px]"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Component library and token reference
            </p>
          </div>

          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              border:           '1px solid hsl(var(--border))',
              backgroundColor:  'hsl(var(--card))',
              color:            'hsl(var(--foreground))',
            }}
          >
            {dark
              ? <><Sun  className="w-4 h-4" /> Light</>
              : <><Moon className="w-4 h-4" /> Dark</>
            }
          </button>
        </div>

        {/* ── Tokens section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Tokens</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            CSS custom properties defined in <code className="font-mono">src/index.css</code>.
            Toggle dark mode to see values switch.
          </p>

          {/* Color swatches */}
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border:          '1px solid hsl(var(--border))',
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-5"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Colors
            </p>

            <div className="flex flex-wrap gap-6">
              {COLOR_TOKENS.map(({ variable, label }) => (
                <div key={variable} className="flex flex-col items-center gap-2">
                  {/* 60 × 60 swatch */}
                  <div
                    className="rounded-lg"
                    style={{
                      width:           60,
                      height:          60,
                      backgroundColor: `hsl(var(${variable}))`,
                      border:          '1px solid hsl(var(--border))',
                      flexShrink:      0,
                    }}
                  />
                  {/* Variable name */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className="text-[11px] font-mono font-medium text-center leading-tight max-w-[80px] break-all"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {variable}
                    </span>
                    <span
                      className="text-[10px] font-mono text-center"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Buttons section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Buttons</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            All variants, sizes, and extra props from <code className="font-mono">src/components/ui/button.tsx</code>.
          </p>

          <div
            className="rounded-xl p-6 space-y-8"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >

            {/* Variants */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Variants (default size)
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="success">Success</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Sizes (default variant)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small (sm)</Button>
                <Button size="md">Medium (md)</Button>
                <Button size="lg">Large (lg)</Button>
                <Button size="icon" aria-label="icon button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Loading */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Loading state
              </p>
              <div className="flex flex-wrap gap-3">
                <Button loading>Saving…</Button>
                <Button loading variant="secondary">Processing…</Button>
              </div>
            </div>

            {/* Icons */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                With leftIcon
              </p>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<Plus className="w-4 h-4" />}>New Ticket</Button>
                <Button leftIcon={<Plus className="w-4 h-4" />} variant="outline">New Ticket</Button>
              </div>
            </div>

            {/* Disabled */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Disabled
              </p>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Default disabled</Button>
                <Button disabled variant="secondary">Secondary disabled</Button>
                <Button disabled variant="outline">Outline disabled</Button>
              </div>
            </div>

          </div>
        </section>

        {/* ── Cards section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Cards</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            All four variants with sub-components, plus hoverable state.
          </p>

          <div className="space-y-8">

            {/* All 4 variants */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Variants
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(
                  [
                    { variant: 'default',  label: 'Default'  },
                    { variant: 'elevated', label: 'Elevated' },
                    { variant: 'outlined', label: 'Outlined' },
                    { variant: 'ghost',    label: 'Ghost'    },
                  ] as const
                ).map(({ variant, label }) => (
                  <Card key={variant} variant={variant}>
                    <CardHeader>
                      <CardTitle>{label}</CardTitle>
                      <CardDescription>
                        A {label.toLowerCase()} card with title, badge, and footer.
                      </CardDescription>
                      <CardAction>
                        <Badge variant="secondary" size="sm">{label}</Badge>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm flex items-center gap-2 flex-wrap">
                        Card body content goes here.
                        <Badge variant="success" size="sm">Done</Badge>
                      </span>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm" variant="outline">View</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>

            {/* Hoverable */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Hoverable (hover:shadow-md transition)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <Card hoverable>
                  <CardHeader>
                    <CardTitle>Hoverable card</CardTitle>
                    <CardDescription>Hover over me to see the shadow lift.</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button size="sm">Open</Button>
                  </CardFooter>
                </Card>
                <Card hoverable variant="outlined">
                  <CardHeader>
                    <CardTitle>Hoverable outlined</CardTitle>
                    <CardDescription>Outlined variant with hover state.</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button size="sm" variant="outline">Open</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>

          </div>
        </section>

        {/* ── Badges section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Badges</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            All 7 variants, 3 sizes, dot indicator, and icon badge.
          </p>

          <div
            className="rounded-xl p-6 space-y-8"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >

            {/* All variants */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Variants (md size)
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Sizes (default variant)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>

            {/* Dot */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                With dot indicator
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" dot>Active</Badge>
                <Badge variant="warning" dot>Pending</Badge>
                <Badge variant="error" dot>Failed</Badge>
                <Badge variant="secondary" dot>Draft</Badge>
                <Badge variant="info" dot>In Review</Badge>
              </div>
            </div>

            {/* With icon */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                With icon
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
                <Badge variant="warning" size="md">
                  <Zap className="w-3 h-3 mr-1" />
                  High Priority
                </Badge>
                <Badge variant="outline" size="lg">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add label
                </Badge>
              </div>
            </div>

          </div>
        </section>

        {/* ── Modals & Drawers section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Modals &amp; Drawers</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Modal, ConfirmModal, and Drawer — all controlled via useModal.
          </p>

          <div
            className="rounded-xl p-6 space-y-8"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >

            {/* Triggers */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Click to open
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={infoModal.open} leftIcon={<Settings className="w-4 h-4" />}>
                  Open Modal
                </Button>
                <Button variant="destructive" onClick={confirmModal.open} leftIcon={<Trash2 className="w-4 h-4" />}>
                  Delete (Confirm)
                </Button>
                <Button variant="outline" onClick={drawer.open}>
                  Open Drawer →
                </Button>
              </div>
            </div>

          </div>

          {/* ── Default Modal ── */}
          <Modal
            {...infoModal.props}
            title="Edit project settings"
            description="Update your project name, description, and visibility preferences."
            size="md"
            footer={
              <>
                <Button variant="outline" size="sm" onClick={infoModal.close}>Cancel</Button>
                <Button size="sm" onClick={infoModal.close}>Save changes</Button>
              </>
            }
          >
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Project name</label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue="TaskPilot"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue="Project management and sprint tracking."
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>Active</Badge>
                <span className="text-xs text-muted-foreground">Sprint 4 in progress</span>
              </div>
            </div>
          </Modal>

          {/* ── Destructive ConfirmModal ── */}
          <ConfirmModal
            {...confirmModal.props}
            title="Delete this ticket?"
            description="This action cannot be undone. The ticket and all its comments will be permanently removed."
            confirmLabel="Delete ticket"
            variant="destructive"
            onConfirm={confirmModal.close}
          />

          {/* ── Right Drawer ── */}
          <Drawer
            {...drawer.props}
            title="Ticket details"
            description="Review and edit the selected ticket."
            side="right"
            size="md"
          >
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">TP-142 — Fix auth redirect</span>
                <Badge variant="warning" dot>In Progress</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                After a token refresh the user is sometimes redirected to /login
                instead of their original destination. Investigate the redirect logic.
              </p>
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" onClick={drawer.close}>Close</Button>
                <Button size="sm" variant="outline">Edit ticket</Button>
              </div>
            </div>
          </Drawer>

        </section>

        {/* ── Feedback section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Feedback</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Alerts, Spinners, Skeletons, and live Toasts.
          </p>

          <div
            className="rounded-xl p-6 space-y-8"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >

            {/* Alerts */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Alert variants (auto-icon)
              </p>
              <div className="flex flex-col gap-3 max-w-2xl">
                <Alert variant="success">
                  <AlertTitle>Changes saved</AlertTitle>
                  <AlertDescription>Your profile has been updated successfully.</AlertDescription>
                </Alert>
                <Alert variant="warning">
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>This sprint ends in 2 days. Make sure tickets are updated.</AlertDescription>
                </Alert>
                <Alert variant="info">
                  <AlertTitle>New feature available</AlertTitle>
                  <AlertDescription>Sprint reports now support CSV export.</AlertDescription>
                </Alert>
                <Alert variant="error">
                  <AlertTitle>Action failed</AlertTitle>
                  <AlertDescription>Could not save changes. Please try again.</AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Spinners */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Spinner sizes
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-xs text-muted-foreground">sm</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="md" />
                  <span className="text-xs text-muted-foreground">md</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="lg" />
                  <span className="text-xs text-muted-foreground">lg</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="xl" />
                  <span className="text-xs text-muted-foreground">xl</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="md" color="primary" />
                  <span className="text-xs text-muted-foreground">primary</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="md" color="muted" />
                  <span className="text-xs text-muted-foreground">muted</span>
                </div>
              </div>
            </div>

            {/* Skeletons */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Skeleton compositions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground mb-1">SkeletonCard</span>
                  <SkeletonCard />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground mb-1">SkeletonText</span>
                  <SkeletonText />
                </div>
                <div className="flex flex-col gap-4">
                  <span className="text-xs text-muted-foreground">SkeletonAvatar (sm / md / lg)</span>
                  <div className="flex items-end gap-3">
                    <SkeletonAvatar size="sm" />
                    <SkeletonAvatar size="md" />
                    <SkeletonAvatar size="lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Toast triggers */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Toast (live — click to fire)
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => toast.success("Changes saved", "Your profile was updated successfully.")}
                >
                  Success toast
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => toast.error("Action failed", "Could not connect to server.")}
                >
                  Error toast
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.warning("Heads up", "This sprint ends in 2 days.")}
                >
                  Warning toast
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.info("New feature", "Sprint reports now support CSV export.")}
                >
                  Info toast
                </Button>
              </div>
            </div>

          </div>
        </section>

        {/* ── Form Elements section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Form Elements</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Input, Textarea, Label, and FormField components with variants and slots.
          </p>

          <div
            className="rounded-xl p-6 space-y-8"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >

            {/* Input variants */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Input variants
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Default</span>
                  <Input variant="default" placeholder="Default input" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Error</span>
                  <Input variant="error" placeholder="Error input" defaultValue="bad value" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Success</span>
                  <Input variant="success" placeholder="Success input" defaultValue="valid@email.com" />
                </div>
              </div>
            </div>

            {/* Input with slots */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Input with slots
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Left slot (Search icon)</span>
                  <Input
                    placeholder="Search…"
                    leftSlot={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Right slot (Eye icon)</span>
                  <Input
                    type="password"
                    placeholder="Password"
                    defaultValue="secret"
                    rightSlot={<Eye className="w-4 h-4 cursor-pointer" />}
                  />
                </div>
              </div>
            </div>

            {/* Textarea variants */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Textarea variants
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Default</span>
                  <Textarea placeholder="Write a description…" rows={3} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Error</span>
                  <Textarea variant="error" placeholder="Required" rows={3} />
                </div>
              </div>
            </div>

            {/* Label with required + hint */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Label with required asterisk and hint
              </p>
              <div className="flex flex-col gap-4 max-w-xs">
                <Label required>Email address</Label>
                <Label hint="We'll never share your email.">Email address</Label>
                <Label required hint="Must be a valid work address.">Work email</Label>
              </div>
            </div>

            {/* FormField composition */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                FormField composition (label + input + error)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
                <FormField
                  label="Username"
                  hint="Only letters, numbers and underscores."
                  required
                >
                  <Input placeholder="jane_doe" />
                </FormField>

                <FormField
                  label="Email"
                  required
                  error="Please enter a valid email address."
                >
                  <Input variant="error" defaultValue="not-an-email" />
                </FormField>

                <FormField
                  label="Bio"
                  hint="Max 160 characters."
                >
                  <Textarea placeholder="Tell us about yourself…" rows={3} />
                </FormField>

                <FormField
                  label="Website"
                  error="URL must start with https://"
                >
                  <Input variant="error" defaultValue="http://example" />
                </FormField>
              </div>
            </div>

          </div>
        </section>

        {/* ── Product Components section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Product Components</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            EmptyState, ScoreBar, and JobMatchBadge — domain-specific building blocks.
          </p>

          <div
            className="rounded-xl p-6 space-y-10"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >

            {/* EmptyState */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                EmptyState (md size with icon, description, and action)
              </p>
              <div
                className="rounded-lg"
                style={{ border: '1px dashed hsl(var(--border))' }}
              >
                <EmptyState
                  icon={<FileSearch className="w-12 h-12" />}
                  title="No results found"
                  description="Try adjusting your search or filters to find what you're looking for."
                  action={{ label: 'Clear filters', onClick: () => {} }}
                  secondaryAction={{ label: 'Create ticket', onClick: () => {} }}
                />
              </div>
            </div>

            {/* ScoreBar */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                ScoreBar — 4 scores demonstrating color transitions
              </p>
              <Stack gap="md" className="max-w-sm">
                <ScoreBar score={25} label="Score 25 (poor)"      size="md" />
                <ScoreBar score={55} label="Score 55 (fair)"      size="md" />
                <ScoreBar score={72} label="Score 72 (good)"      size="md" />
                <ScoreBar score={91} label="Score 91 (excellent)" size="md" />
              </Stack>
            </div>

            {/* ScoreBar sizes */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                ScoreBar sizes (score 78)
              </p>
              <Stack gap="sm" className="max-w-sm">
                <ScoreBar score={78} label="sm" size="sm" />
                <ScoreBar score={78} label="md" size="md" />
                <ScoreBar score={78} label="lg" size="lg" />
              </Stack>
            </div>

            {/* JobMatchBadge */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                JobMatchBadge — all four tiers with score
              </p>
              <Stack direction="horizontal" gap="sm" wrap>
                <JobMatchBadge score={30} showScore />
                <JobMatchBadge score={50} showScore />
                <JobMatchBadge score={70} showScore />
                <JobMatchBadge score={90} showScore />
              </Stack>
            </div>

            {/* AISuggestionChip */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                AISuggestionChip — default, inline, loading, with actions
              </p>
              <Stack gap="md">
                <div className="flex flex-wrap gap-3 items-center">
                  <AISuggestionChip
                    suggestion="Consider adding 'TypeScript' to your skills section"
                    onAccept={() => console.log('accepted')}
                    onDismiss={() => console.log('dismissed')}
                  />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <AISuggestionChip
                    suggestion="Loading AI suggestion…"
                    loading
                  />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-sm text-muted-foreground">Inline variant →</span>
                  <AISuggestionChip
                    variant="inline"
                    suggestion="Tailor your summary for this role"
                    onAccept={() => console.log('accepted')}
                    onDismiss={() => console.log('dismissed')}
                  />
                </div>
              </Stack>
            </div>

            {/* StatCard */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                StatCard — dashboard metrics (positive, negative, no change, loading)
              </p>
              <Grid cols={1} smCols={2} lgCols={4} gap="md">
                <StatCard
                  label="Resumes Created"
                  value={12}
                  change={{ value: 3, period: 'this month' }}
                  icon={<BarChart2 className="w-4 h-4" />}
                />
                <StatCard
                  label="Avg Match Score"
                  value="74%"
                  change={{ value: 8, period: 'this week' }}
                  icon={<Target className="w-4 h-4" />}
                />
                <StatCard
                  label="Jobs Applied"
                  value={5}
                  change={{ value: -2, period: 'this week' }}
                  icon={<Briefcase className="w-4 h-4" />}
                />
                <StatCard
                  label="Profile Strength"
                  value="82%"
                  icon={<User className="w-4 h-4" />}
                />
              </Grid>
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Loading state
                </p>
                <Grid cols={1} smCols={2} lgCols={4} gap="md">
                  <StatCard label="" value="" loading />
                  <StatCard label="" value="" loading />
                </Grid>
              </div>
            </div>

            {/* ResumeCard */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                ResumeCard — 3 examples (tailored, draft, applied)
              </p>
              <Grid cols={1} smCols={2} lgCols={3} gap="md">
                <ResumeCard
                  id="1"
                  title="Software Engineer Resume"
                  lastModified={new Date(Date.now() - 1000 * 60 * 45)}
                  matchScore={85}
                  status="tailored"
                  jobTitle="Senior Frontend Engineer"
                  onEdit={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                />
                <ResumeCard
                  id="2"
                  title="Product Manager Resume"
                  lastModified={new Date(Date.now() - 1000 * 60 * 60 * 3)}
                  matchScore={52}
                  status="draft"
                  onEdit={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                />
                <ResumeCard
                  id="3"
                  title="Data Analyst Resume"
                  lastModified={new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)}
                  status="applied"
                  jobTitle="Data Analyst @ Google"
                  onEdit={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                />
              </Grid>
            </div>

            {/* UploadZone */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                UploadZone — interactive (try dragging a file or clicking)
              </p>
              <div className="max-w-md">
                <UploadZone
                  onFileSelect={(file) => {
                    console.log('File selected:', file.name);
                  }}
                />
              </div>
            </div>

          </div>
        </section>

        {/* ── Layout section ── */}
        <section>
          <h2 className="text-[20px] font-semibold mb-1">Layout</h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Container, Stack, Grid, Divider, and PageHeader layout primitives.
          </p>

          <div
            className="rounded-xl p-6 space-y-10"
            style={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >

            {/* Stack — vertical */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Stack vertical (gap md)
              </p>
              <Stack gap="md" className="max-w-xs">
                <Badge variant="default">Item one</Badge>
                <Badge variant="secondary">Item two</Badge>
                <Badge variant="info">Item three</Badge>
              </Stack>
            </div>

            {/* Stack — horizontal */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Stack horizontal (gap lg, align center)
              </p>
              <Stack direction="horizontal" gap="lg" align="center" wrap>
                <Badge variant="success">Alpha</Badge>
                <Badge variant="warning">Beta</Badge>
                <Badge variant="error">Gamma</Badge>
                <Badge variant="outline">Delta</Badge>
                <Badge variant="info">Epsilon</Badge>
              </Stack>
            </div>

            {/* Grid */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Grid cols=1 sm=2 lg=3 (6 placeholder cards)
              </p>
              <Grid cols={1} smCols={2} lgCols={3} gap="md">
                {['Sprint Planning', 'Active Sprint', 'Backlog', 'Board', 'Reports', 'Members'].map((label) => (
                  <div
                    key={label}
                    className="rounded-lg p-4 flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      minHeight: 72,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </Grid>
            </div>

            {/* Dividers */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Divider — plain and with label
              </p>
              <Stack gap="lg" className="max-w-md">
                <Divider />
                <Divider label="OR" />
              </Stack>
            </div>

            {/* Vertical Divider */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                Divider — vertical (inline in flex row)
              </p>
              <div className="flex items-center gap-4 h-8">
                <Badge variant="default">Section A</Badge>
                <Divider orientation="vertical" />
                <Badge variant="secondary">Section B</Badge>
                <Divider orientation="vertical" />
                <Badge variant="info">Section C</Badge>
              </div>
            </div>

            {/* PageHeader */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                PageHeader with breadcrumbs, subtitle, and action
              </p>
              <Container size="full" className="px-0">
                <PageHeader
                  breadcrumbs={[
                    { label: 'Projects', href: '#' },
                    { label: 'TaskPilot', href: '#' },
                    { label: 'Sprint 4' },
                  ]}
                  title="Active Sprint — Sprint 4"
                  subtitle="12 tickets · 3 in review · ends Jun 14 2026"
                  actions={
                    <Stack direction="horizontal" gap="sm">
                      <Button size="sm" variant="outline">Export</Button>
                      <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>Add ticket</Button>
                    </Stack>
                  }
                />
              </Container>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
