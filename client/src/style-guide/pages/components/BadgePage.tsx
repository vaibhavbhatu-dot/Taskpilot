import { CheckCircle2, Zap, Plus } from 'lucide-react';
import { Badge } from '@/design-system';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function BadgePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Badge</h1>
        <p className="text-lg text-muted-foreground">
          Small labels for status indicators, counts, tags, and categories.
          All variants use soft muted fills so badges remain readable without competing
          with surrounding content. 7 semantic variants + 6 ticket-status variants, 3 sizes,
          and optional dot support.
        </p>
      </div>

      <section>
        <h2 id="variants" className="text-xl font-semibold text-foreground mb-4">Semantic variants</h2>
        <p className="text-muted-foreground mb-4">
          Soft fills — 10% opacity background, token-colored text, and a 25% border.
        </p>
        <DemoBlock
          title="All 7 semantic variants"
          code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>`}
        >
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="ticket-status" className="text-xl font-semibold text-foreground mb-4">Ticket-status variants</h2>
        <p className="text-muted-foreground mb-4">
          Purpose-built for TaskPilot's ticket pipeline. Each maps to a specific workflow stage.
        </p>
        <DemoBlock
          title="Ticket-status variants"
          code={`<Badge variant="backlog">Backlog</Badge>
<Badge variant="requirements">Requirements</Badge>
<Badge variant="design">Design</Badge>
<Badge variant="in-development">On Development</Badge>
<Badge variant="qa">QA</Badge>
<Badge variant="live">Live</Badge>`}
        >
          <div className="flex flex-wrap gap-3">
            <Badge variant="backlog">Backlog</Badge>
            <Badge variant="requirements">Requirements</Badge>
            <Badge variant="design">Design</Badge>
            <Badge variant="in-development">On Development</Badge>
            <Badge variant="qa">QA</Badge>
            <Badge variant="live">Live</Badge>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="sizes" className="text-xl font-semibold text-foreground mb-4">Sizes</h2>
        <DemoBlock
          title="sm · md · lg"
          code={`<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="dot" className="text-xl font-semibold text-foreground mb-4">With dot indicator</h2>
        <p className="text-muted-foreground mb-4">
          The <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">dot</code> prop
          prepends a colored circle — ideal for status fields like ticket or sprint states.
        </p>
        <DemoBlock
          title="dot prop"
          code={`<Badge variant="success" dot>Active</Badge>
<Badge variant="warning" dot>Pending</Badge>
<Badge variant="error" dot>Failed</Badge>
<Badge variant="secondary" dot>Draft</Badge>
<Badge variant="info" dot>In Review</Badge>`}
        >
          <div className="flex flex-wrap gap-3">
            <Badge variant="success" dot>Active</Badge>
            <Badge variant="warning" dot>Pending</Badge>
            <Badge variant="error" dot>Failed</Badge>
            <Badge variant="secondary" dot>Draft</Badge>
            <Badge variant="info" dot>In Review</Badge>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="with-icon" className="text-xl font-semibold text-foreground mb-4">With icon</h2>
        <DemoBlock
          title="Icon inside badge"
          code={`<Badge variant="success" size="md">
  <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
</Badge>
<Badge variant="warning" size="md">
  <Zap className="w-3 h-3 mr-1" /> High Priority
</Badge>
<Badge variant="outline" size="lg">
  <Plus className="w-3.5 h-3.5 mr-1" /> Add label
</Badge>`}
        >
          <div className="flex flex-wrap gap-3">
            <Badge variant="success" size="md">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
            </Badge>
            <Badge variant="warning" size="md">
              <Zap className="w-3 h-3 mr-1" /> High Priority
            </Badge>
            <Badge variant="outline" size="lg">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add label
            </Badge>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="usage-map" className="text-xl font-semibold text-foreground mb-4">Semantic usage map</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Variant','Use case examples'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['default',          'Generic tags, unimportant counts'],
                ['secondary',        'Type tags (Task, Bug), neutral labels'],
                ['outline',          'LOW priority, optional fields, inactive'],
                ['success',          'Active sprints, completed actions'],
                ['warning',          'HIGH priority, UAT, attention needed'],
                ['error',            'CRITICAL priority, blocked, bugs'],
                ['info',             'HTML phase, general informational'],
                ['backlog',          'BACKLOG status'],
                ['requirements',     'REQUIREMENTS status'],
                ['design',           'DESIGN / QA status'],
                ['in-development',   'ON_DEVELOPMENT status'],
                ['qa',               'QA status'],
                ['live',             'LIVE status'],
              ].map(([v, u]) => (
                <tr key={v} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Badge variant={v as any} size="sm">{v}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 id="props" className="text-xl font-semibold text-foreground mb-4">Props</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Prop','Type','Default','Description'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['variant', '"default" | "secondary" | "outline" | "success" | "warning" | "error" | "info" | "design" | "backlog" | "in-development" | "qa" | "live" | "requirements"', '"default"', 'Color scheme'],
                ['size',    '"sm" | "md" | "lg"', '"md"', 'Padding and font size'],
                ['dot',     'boolean', 'false', 'Prepends a colored status dot'],
              ].map(([p,t,d,desc]) => (
                <tr key={p} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-foreground">{p}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{t}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-muted-foreground">{d}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
