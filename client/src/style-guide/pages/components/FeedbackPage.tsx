import { Spinner } from '@/components/ui/spinner';
import { SkeletonCard, SkeletonText, SkeletonAvatar } from '@/components/ui/Skeleton';
import { Button } from '@/design-system';
import { useToast } from '@/design-system/hooks/useToast';
import { EmptyState } from '@/components/ui/EmptyState';
import { AISuggestionChip } from '@/components/ui/ai-suggestion-chip';
import { FileSearch } from 'lucide-react';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function FeedbackPage() {
  const toast = useToast();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Feedback</h1>
        <p className="text-lg text-muted-foreground">
          Spinners, Skeletons, Toast notifications, EmptyState, and AISuggestionChip.
          These components manage the full loading → empty → error → success lifecycle.
        </p>
      </div>

      <section>
        <h2 id="spinner" className="text-xl font-semibold text-foreground mb-4">Spinner</h2>
        <DemoBlock
          title="All sizes and colors"
          code={`<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />
<Spinner size="md" color="primary" />
<Spinner size="md" color="muted" />`}
        >
          <div className="flex flex-wrap items-end gap-8">
            {(['sm','md','lg','xl'] as const).map(s => (
              <div key={s} className="flex flex-col items-center gap-2">
                <Spinner size={s} />
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" color="primary" />
              <span className="text-xs text-muted-foreground">primary</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" color="muted" />
              <span className="text-xs text-muted-foreground">muted</span>
            </div>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="skeleton" className="text-xl font-semibold text-foreground mb-4">Skeleton</h2>
        <p className="text-muted-foreground mb-4">
          Placeholder shapes used while data is loading. Prefer Skeleton over spinners
          when the content layout is predictable.
        </p>
        <DemoBlock
          title="SkeletonCard · SkeletonText · SkeletonAvatar"
          code={`<SkeletonCard />
<SkeletonText />
<SkeletonAvatar size="sm" />
<SkeletonAvatar size="md" />
<SkeletonAvatar size="lg" />`}
        >
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">SkeletonCard</span>
              <SkeletonCard />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">SkeletonText</span>
              <SkeletonText />
            </div>
            <div className="space-y-3">
              <span className="text-xs text-muted-foreground">SkeletonAvatar</span>
              <div className="flex items-end gap-3">
                <SkeletonAvatar size="sm" />
                <SkeletonAvatar size="md" />
                <SkeletonAvatar size="lg" />
              </div>
            </div>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="toast" className="text-xl font-semibold text-foreground mb-4">Toast</h2>
        <p className="text-muted-foreground mb-4">
          Transient feedback that auto-dismisses. Use{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">useToast()</code> hook
          to fire toasts from anywhere in the tree.
        </p>
        <DemoBlock
          title="Live toast triggers — click to fire"
          code={`const toast = useToast();

toast.success("Changes saved", "Your profile was updated.");
toast.error("Action failed", "Could not connect to server.");
toast.warning("Heads up", "This sprint ends in 2 days.");
toast.info("New feature", "Sprint reports now support CSV export.");`}
        >
          <div className="flex flex-wrap gap-3">
            <Button variant="success" size="sm"
              onClick={() => toast.success('Changes saved', 'Your profile was updated successfully.')}>
              Success toast
            </Button>
            <Button variant="destructive" size="sm"
              onClick={() => toast.error('Action failed', 'Could not connect to server.')}>
              Error toast
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => toast.warning('Heads up', 'This sprint ends in 2 days.')}>
              Warning toast
            </Button>
            <Button variant="secondary" size="sm"
              onClick={() => toast.info('New feature', 'Sprint reports now support CSV export.')}>
              Info toast
            </Button>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="empty-state" className="text-xl font-semibold text-foreground mb-4">EmptyState</h2>
        <p className="text-muted-foreground mb-4">
          Used when a list or data section has no content to show. Always provide
          a primary action to help users resolve the empty state.
        </p>
        <DemoBlock
          title="With icon, description, and actions"
          code={`<EmptyState
  icon={<FileSearch className="w-12 h-12" />}
  title="No results found"
  description="Try adjusting your search or filters."
  action={{ label: 'Clear filters', onClick: () => {} }}
  secondaryAction={{ label: 'Create ticket', onClick: () => {} }}
/>`}
        >
          <div className="border border-dashed border-border rounded-xl">
            <EmptyState
              icon={<FileSearch className="w-12 h-12" />}
              title="No results found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={{ label: 'Clear filters', onClick: () => {} }}
              secondaryAction={{ label: 'Create ticket', onClick: () => {} }}
            />
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="ai-chip" className="text-xl font-semibold text-foreground mb-4">AISuggestionChip</h2>
        <p className="text-muted-foreground mb-4">
          Inline suggestions generated by AI. Has default, inline, and loading variants with
          accept/dismiss callbacks.
        </p>
        <DemoBlock
          title="Default, loading, and inline variants"
          code={`<AISuggestionChip
  suggestion="Consider adding 'TypeScript' to your skills section"
  onAccept={() => {}} onDismiss={() => {}}
/>
<AISuggestionChip suggestion="Loading AI suggestion…" loading />
<AISuggestionChip variant="inline"
  suggestion="Tailor your summary for this role"
  onAccept={() => {}} onDismiss={() => {}}
/>`}
        >
          <div className="space-y-4">
            <AISuggestionChip
              suggestion="Consider adding 'TypeScript' to your skills section"
              onAccept={() => {}} onDismiss={() => {}}
            />
            <AISuggestionChip suggestion="Loading AI suggestion…" loading />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Inline →</span>
              <AISuggestionChip
                variant="inline"
                suggestion="Tailor your summary for this role"
                onAccept={() => {}} onDismiss={() => {}}
              />
            </div>
          </div>
        </DemoBlock>
      </section>
    </div>
  );
}
