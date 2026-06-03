import { Plus } from 'lucide-react';
import { Button, Badge } from '@/design-system';
import { Container, Stack, Grid, Divider, PageHeader } from '@/components/layout';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function LayoutPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Layout</h1>
        <p className="text-lg text-muted-foreground">
          Five composable primitives — <strong>Container</strong>, <strong>Stack</strong>,{' '}
          <strong>Grid</strong>, <strong>Divider</strong>, and <strong>PageHeader</strong> —
          that handle spacing, rhythm, and structure so page components stay focused on
          their content.
        </p>
      </div>

      <section>
        <h2 id="container" className="text-xl font-semibold text-foreground mb-1">Container</h2>
        <p className="text-muted-foreground mb-4">
          Centers and constrains horizontal content width. Use <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">size</code> to
          pick a max-width breakpoint. Defaults to <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">md</code>.
        </p>
        <DemoBlock
          title="size variants"
          code={`<Container size="sm">sm — max-w-screen-sm (640px)</Container>
<Container size="md">md — max-w-screen-md (768px)</Container>
<Container size="lg">lg — max-w-screen-lg (1024px)</Container>
<Container size="xl">xl — max-w-screen-xl (1280px)</Container>
<Container size="full">full — no max-width</Container>`}
        >
          <div className="space-y-2 text-sm">
            {(['sm','md','lg','xl','full'] as const).map(s => (
              <Container key={s} size={s}>
                <div className="bg-primary/10 border border-primary/20 rounded px-3 py-2 text-foreground font-mono text-[13px]">
                  size="{s}"
                </div>
              </Container>
            ))}
          </div>
        </DemoBlock>

        <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
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
                ['size', '"sm" | "md" | "lg" | "xl" | "full"', '"md"', 'Max-width breakpoint'],
                ['className', 'string', '—', 'Passthrough className'],
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

      <section>
        <h2 id="stack" className="text-xl font-semibold text-foreground mb-1">Stack</h2>
        <p className="text-muted-foreground mb-4">
          One-dimensional flex layout with a consistent gap. Vertical by default;
          pass <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">direction="horizontal"</code> for a row.
        </p>

        <h3 id="stack-vertical" className="text-base font-semibold text-foreground mt-4 mb-3">Vertical</h3>
        <DemoBlock
          title="direction=vertical (default), gap variants"
          code={`<Stack gap="sm"><Badge>Item 1</Badge><Badge>Item 2</Badge></Stack>
<Stack gap="md"><Badge>Item 1</Badge><Badge>Item 2</Badge></Stack>
<Stack gap="lg"><Badge>Item 1</Badge><Badge>Item 2</Badge></Stack>`}
        >
          <div className="flex gap-10 flex-wrap">
            {(['sm','md','lg'] as const).map(g => (
              <div key={g}>
                <p className="text-[11px] font-mono text-muted-foreground mb-2">gap="{g}"</p>
                <Stack gap={g}>
                  <Badge variant="default">Item one</Badge>
                  <Badge variant="secondary">Item two</Badge>
                  <Badge variant="info">Item three</Badge>
                </Stack>
              </div>
            ))}
          </div>
        </DemoBlock>

        <h3 id="stack-horizontal" className="text-base font-semibold text-foreground mt-6 mb-3">Horizontal</h3>
        <DemoBlock
          title="direction=horizontal with wrap"
          code={`<Stack direction="horizontal" gap="md" align="center" wrap>
  <Badge variant="success">Alpha</Badge>
  <Badge variant="warning">Beta</Badge>
  <Badge variant="error">Gamma</Badge>
</Stack>`}
        >
          <Stack direction="horizontal" gap="md" align="center" wrap>
            <Badge variant="success">Alpha</Badge>
            <Badge variant="warning">Beta</Badge>
            <Badge variant="error">Gamma</Badge>
            <Badge variant="outline">Delta</Badge>
            <Badge variant="info">Epsilon</Badge>
          </Stack>
        </DemoBlock>

        <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
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
                ['direction', '"vertical" | "horizontal"', '"vertical"', 'Flex direction'],
                ['gap',       '"none" | "xs" | "sm" | "md" | "lg" | "xl"', '"md"', 'Gap between children'],
                ['align',     '"start" | "center" | "end" | "stretch"', '"stretch"', 'align-items'],
                ['justify',   '"start" | "center" | "end" | "between"', '"start"', 'justify-content'],
                ['wrap',      'boolean', 'false', 'flex-wrap on horizontal stacks'],
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

      <section>
        <h2 id="grid" className="text-xl font-semibold text-foreground mb-1">Grid</h2>
        <p className="text-muted-foreground mb-4">
          Responsive CSS grid. Specify base, <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">smCols</code>,
          and <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">lgCols</code> independently.
        </p>
        <DemoBlock
          title="cols=1 sm=2 lg=3"
          code={`<Grid cols={1} smCols={2} lgCols={3} gap="md">
  <Card>Sprint Planning</Card>
  <Card>Active Sprint</Card>
  <Card>Backlog</Card>
  <Card>Board</Card>
  <Card>Reports</Card>
  <Card>Members</Card>
</Grid>`}
        >
          <Grid cols={1} smCols={2} lgCols={3} gap="md">
            {['Sprint Planning','Active Sprint','Backlog','Board','Reports','Members'].map(label => (
              <div key={label} className="rounded-lg p-4 flex items-center justify-center text-sm font-medium bg-muted text-muted-foreground min-h-[72px]">
                {label}
              </div>
            ))}
          </Grid>
        </DemoBlock>

        <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
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
                ['cols',   '1 | 2 | 3 | 4 | 6 | 12', '1', 'Base column count'],
                ['smCols', '1 | 2 | 3 | 4 | 6 | 12', '—', 'Columns at sm breakpoint'],
                ['lgCols', '1 | 2 | 3 | 4 | 6 | 12', '—', 'Columns at lg breakpoint'],
                ['gap',    '"none" | "xs" | "sm" | "md" | "lg" | "xl"', '"md"', 'Gap between cells'],
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

      <section>
        <h2 id="divider" className="text-xl font-semibold text-foreground mb-1">Divider</h2>
        <p className="text-muted-foreground mb-4">
          Horizontal or vertical separator. Optional centred label for "OR"-style splits.
        </p>
        <DemoBlock
          title="horizontal — plain and labelled"
          code={`<Divider />
<Divider label="OR" />`}
        >
          <Stack gap="lg" className="max-w-md">
            <Divider />
            <Divider label="OR" />
          </Stack>
        </DemoBlock>

        <DemoBlock
          title="vertical — inline in flex row"
          code={`<div className="flex items-center gap-4 h-8">
  <Badge>Section A</Badge>
  <Divider orientation="vertical" />
  <Badge>Section B</Badge>
  <Divider orientation="vertical" />
  <Badge>Section C</Badge>
</div>`}
        >
          <div className="flex items-center gap-4 h-8">
            <Badge variant="default">Section A</Badge>
            <Divider orientation="vertical" />
            <Badge variant="secondary">Section B</Badge>
            <Divider orientation="vertical" />
            <Badge variant="info">Section C</Badge>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="page-header" className="text-xl font-semibold text-foreground mb-1">PageHeader</h2>
        <p className="text-muted-foreground mb-4">
          Standard page-level header with optional breadcrumb trail, subtitle, and action slot.
          Used at the top of every main content area.
        </p>
        <DemoBlock
          title="With breadcrumbs, subtitle, and actions"
          code={`<PageHeader
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
/>`}
        >
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
        </DemoBlock>

        <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Prop','Type','Required','Description'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['title',       'string',              'Yes', 'Page title text'],
                ['subtitle',    'string',              'No',  'Secondary description line'],
                ['breadcrumbs', 'Array<{ label, href? }>', 'No', 'Navigation trail above title'],
                ['actions',     'ReactNode',           'No',  'Right-side action buttons'],
                ['className',   'string',              'No',  'Passthrough className'],
              ].map(([p,t,r,d]) => (
                <tr key={p} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-foreground">{p}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{t}</td>
                  <td className="px-4 py-2.5 text-center text-[12px] text-muted-foreground">{r}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
