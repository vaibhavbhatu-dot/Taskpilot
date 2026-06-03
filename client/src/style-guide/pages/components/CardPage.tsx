import { Button, Badge } from '@/design-system';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function CardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Card</h1>
        <p className="text-lg text-muted-foreground">
          A flexible container for grouping related content. Cards have four visual variants
          and optional sub-components for structured layouts.
        </p>
      </div>

      <section>
        <h2 id="variants" className="text-xl font-semibold text-foreground mb-4">Variants</h2>
        <DemoBlock
          title="default · elevated · outlined · ghost"
          code={`<Card variant="default">…</Card>
<Card variant="elevated">…</Card>
<Card variant="outlined">…</Card>
<Card variant="ghost">…</Card>`}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['default','elevated','outlined','ghost'] as const).map(v => (
              <Card key={v} variant={v}>
                <CardHeader>
                  <CardTitle>{v.charAt(0).toUpperCase() + v.slice(1)}</CardTitle>
                  <CardDescription>A {v} card with sub-components.</CardDescription>
                  <CardAction><Badge variant="secondary" size="sm">{v}</Badge></CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Body content goes here.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">View</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="hoverable" className="text-xl font-semibold text-foreground mb-4">Hoverable</h2>
        <p className="text-muted-foreground mb-4">
          Add <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">hoverable</code> for
          a subtle shadow lift on hover — useful for clickable cards.
        </p>
        <DemoBlock
          title="hoverable prop"
          code={`<Card hoverable>…</Card>
<Card hoverable variant="outlined">…</Card>`}
        >
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <Card hoverable>
              <CardHeader>
                <CardTitle>Hoverable card</CardTitle>
                <CardDescription>Shadow lifts on hover.</CardDescription>
              </CardHeader>
              <CardFooter><Button size="sm">Open</Button></CardFooter>
            </Card>
            <Card hoverable variant="outlined">
              <CardHeader>
                <CardTitle>Hoverable outlined</CardTitle>
                <CardDescription>Outlined with hover state.</CardDescription>
              </CardHeader>
              <CardFooter><Button size="sm" variant="outline">Open</Button></CardFooter>
            </Card>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="with-actions" className="text-xl font-semibold text-foreground mb-4">With actions</h2>
        <p className="text-muted-foreground mb-4">
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">CardAction</code> slots
          into the header's right side for badges, icon buttons, or menus.
        </p>
        <DemoBlock
          title="CardAction in header"
          code={`<Card>
  <CardHeader>
    <CardTitle>Sprint 14</CardTitle>
    <CardDescription>Ends Jun 14 · 12 tickets</CardDescription>
    <CardAction>
      <Badge variant="warning" dot>Active</Badge>
    </CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>`}
        >
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Sprint 14</CardTitle>
              <CardDescription>Ends Jun 14 · 12 tickets</CardDescription>
              <CardAction><Badge variant="warning" dot>Active</Badge></CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                3 in review · 5 in development · 2 in QA
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" variant="outline">View board</Button>
              <Button size="sm">Complete sprint</Button>
            </CardFooter>
          </Card>
        </DemoBlock>
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
                ['variant',  '"default" | "elevated" | "outlined" | "ghost"', '"default"', 'Visual style'],
                ['hoverable','boolean', 'false', 'Adds shadow lift on hover'],
                ['className','string',  '—',    'Passthrough className'],
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
