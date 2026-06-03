const SCALE = [
  { name: 'xs',   px: '12px', cls: 'text-xs',   weight: '400' },
  { name: 'sm',   px: '14px', cls: 'text-sm',   weight: '400' },
  { name: 'base', px: '16px', cls: 'text-base', weight: '400' },
  { name: 'lg',   px: '18px', cls: 'text-lg',   weight: '400' },
  { name: 'xl',   px: '20px', cls: 'text-xl',   weight: '600' },
  { name: '2xl',  px: '24px', cls: 'text-2xl',  weight: '600' },
  { name: '3xl',  px: '30px', cls: 'text-3xl',  weight: '700' },
  { name: '4xl',  px: '36px', cls: 'text-4xl',  weight: '700' },
] as const;

const WEIGHTS = [
  { name: 'Normal',   cls: 'font-normal',   value: '400' },
  { name: 'Medium',   cls: 'font-medium',   value: '500' },
  { name: 'Semibold', cls: 'font-semibold', value: '600' },
  { name: 'Bold',     cls: 'font-bold',     value: '700' },
] as const;

export function TypographyPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Typography</h1>
        <p className="text-lg text-muted-foreground">
          Inter for UI copy, JetBrains Mono for code. The scale is defined in{' '}
          <code className="font-mono text-base bg-muted px-1.5 py-0.5 rounded">tailwind.config.js</code>.
        </p>
      </div>

      <section>
        <h2 id="fonts" className="text-xl font-semibold text-foreground mb-1">Typefaces</h2>
        <p className="text-muted-foreground mb-6">Two families cover all use cases.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sans — Inter</p>
            <p className="text-2xl font-medium text-foreground">The quick brown fox</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">font-sans · UI copy, labels, body</p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Mono — JetBrains Mono</p>
            <p className="text-2xl font-mono font-medium text-foreground">const x = 42;</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">font-mono · Code, ticket IDs, tokens</p>
          </div>
        </div>
      </section>

      <section>
        <h2 id="scale" className="text-xl font-semibold text-foreground mb-1">Type scale</h2>
        <p className="text-muted-foreground mb-6">All sizes are defined as rem-based Tailwind classes.</p>
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {SCALE.map(({ name, px, cls }) => (
            <div key={name} className="flex items-baseline gap-4 px-5 py-4">
              <div className="w-20 flex-shrink-0 text-right">
                <span className="font-mono text-[12px] font-medium text-foreground">{name}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">{px}</span>
              </div>
              <p className={`${cls} text-foreground leading-tight flex-1`}>
                The quick brown fox jumps over the lazy dog
              </p>
              <span className="font-mono text-[11px] text-muted-foreground flex-shrink-0 hidden sm:block">.{cls}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 id="weights" className="text-xl font-semibold text-foreground mb-1">Font weights</h2>
        <p className="text-muted-foreground mb-6">Inter supports four weights used in the design system.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEIGHTS.map(({ name, cls, value }) => (
            <div key={name} className="p-5 rounded-xl border border-border bg-card">
              <p className={`text-lg ${cls} text-foreground mb-2`}>The quick fox</p>
              <p className="font-mono text-[11px] text-muted-foreground">{name} · {value}</p>
              <p className="font-mono text-[11px] text-muted-foreground">.{cls}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 id="prose" className="text-xl font-semibold text-foreground mb-1">Prose example</h2>
        <p className="text-muted-foreground mb-6">Typical usage in a page header + body combination.</p>
        <div className="p-6 rounded-xl border border-border bg-card space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Sprint 14 — Planning</h1>
          <p className="text-lg text-muted-foreground">12 tickets committed across 4 teams.</p>
          <p className="text-sm text-muted-foreground">
            Drag tickets from the backlog into this sprint. Use filters to narrow
            by priority, type, or assignee. Click <strong className="text-foreground">Start Sprint</strong> when ready.
          </p>
          <code className="block font-mono text-sm text-foreground bg-muted px-3 py-2 rounded-md">
            sprintsApi.start(sprintId)
          </code>
        </div>
      </section>

      <section>
        <h2 id="line-heights" className="text-xl font-semibold text-foreground mb-1">Line heights</h2>
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {[
            { name: 'none',    cls: 'leading-none',    value: '1'    },
            { name: 'tight',   cls: 'leading-tight',   value: '1.25' },
            { name: 'snug',    cls: 'leading-snug',    value: '1.375'},
            { name: 'normal',  cls: 'leading-normal',  value: '1.5'  },
            { name: 'relaxed', cls: 'leading-relaxed', value: '1.625'},
          ].map(({ name, cls, value }) => (
            <div key={name} className="flex items-start gap-4 px-5 py-4">
              <div className="w-24 flex-shrink-0">
                <p className="font-mono text-[12px] text-foreground">{name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{value}</p>
              </div>
              <p className={`text-sm text-foreground ${cls} flex-1`}>
                Tickets in the current sprint are tracked here.<br />
                Drag cards to update their status across columns.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
