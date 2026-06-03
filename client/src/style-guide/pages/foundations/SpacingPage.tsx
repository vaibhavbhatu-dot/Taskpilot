const SCALE = [
  { token: '0',    px: '0px',   rem: '0'     },
  { token: '0.5',  px: '2px',   rem: '0.125' },
  { token: '1',    px: '4px',   rem: '0.25'  },
  { token: '1.5',  px: '6px',   rem: '0.375' },
  { token: '2',    px: '8px',   rem: '0.5'   },
  { token: '3',    px: '12px',  rem: '0.75'  },
  { token: '4',    px: '16px',  rem: '1'     },
  { token: '5',    px: '20px',  rem: '1.25'  },
  { token: '6',    px: '24px',  rem: '1.5'   },
  { token: '8',    px: '32px',  rem: '2'     },
  { token: '10',   px: '40px',  rem: '2.5'   },
  { token: '12',   px: '48px',  rem: '3'     },
  { token: '16',   px: '64px',  rem: '4'     },
  { token: '20',   px: '80px',  rem: '5'     },
  { token: '24',   px: '96px',  rem: '6'     },
];

export function SpacingPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Spacing</h1>
        <p className="text-lg text-muted-foreground">
          A 4 px base grid. All spacing tokens are multiples of 4 px, giving a
          predictable, harmonious rhythm throughout the UI.
        </p>
      </div>

      <section>
        <h2 id="scale" className="text-xl font-semibold text-foreground mb-1">Spacing scale</h2>
        <p className="text-muted-foreground mb-6">
          Used as <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">p-*</code>,{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">m-*</code>,{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">gap-*</code>, and{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">space-*</code> utilities.
        </p>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground w-20">Token</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground w-16">px</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground w-16">rem</th>
                <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SCALE.map(({ token, px, rem }) => (
                <tr key={token} className="hover:bg-muted/30">
                  <td className="px-5 py-2.5 font-mono text-foreground">{token}</td>
                  <td className="px-5 py-2.5 font-mono text-muted-foreground">{px}</td>
                  <td className="px-5 py-2.5 font-mono text-muted-foreground">{rem}</td>
                  <td className="px-5 py-2.5">
                    <div
                      className="h-4 bg-primary/60 rounded-sm"
                      style={{ width: px === '0px' ? '2px' : px }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 id="padding" className="text-xl font-semibold text-foreground mb-1">Padding patterns</h2>
        <p className="text-muted-foreground mb-6">Common padding combinations used across components.</p>
        <div className="space-y-3">
          {[
            { label: 'Button sm',    cls: 'px-3 py-1.5', desc: 'h-8 controls' },
            { label: 'Button md',    cls: 'px-4 py-2',   desc: 'h-10 controls' },
            { label: 'Button lg',    cls: 'px-6 py-2.5', desc: 'h-11 controls' },
            { label: 'Card body',    cls: 'p-5',          desc: 'standard card padding' },
            { label: 'Card sm',      cls: 'p-4',          desc: 'compact card' },
            { label: 'Table cell',   cls: 'px-5 py-3',   desc: 'data table rows' },
            { label: 'Page content', cls: 'px-8 py-7',   desc: 'main content area' },
            { label: 'Sidebar',      cls: 'px-2 py-3',   desc: 'navigation padding' },
          ].map(({ label, cls, desc }) => (
            <div key={label} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
              <div className="w-36 flex-shrink-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-[12px] text-muted-foreground">{desc}</p>
              </div>
              <code className="font-mono text-[13px] text-primary bg-primary/10 px-2 py-1 rounded">{cls}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 id="gaps" className="text-xl font-semibold text-foreground mb-1">Gap conventions</h2>
        <p className="text-muted-foreground mb-6">Consistent gap values for flex and grid layouts.</p>
        <div className="space-y-4">
          {[
            { gap: 'gap-1',   px: '4px',  use: 'Icon + text, tight inline elements' },
            { gap: 'gap-2',   px: '8px',  use: 'Chip groups, badge rows' },
            { gap: 'gap-3',   px: '12px', use: 'Button groups, form field hints' },
            { gap: 'gap-4',   px: '16px', use: 'Card grids (dense), form rows' },
            { gap: 'gap-5',   px: '20px', use: 'Standard card grids' },
            { gap: 'gap-6',   px: '24px', use: 'Section spacing, sidebar groups' },
            { gap: 'gap-8',   px: '32px', use: 'Major layout zones' },
          ].map(({ gap, px, use }) => (
            <div key={gap} className="flex items-start gap-4 px-4 py-3 rounded-lg border border-border bg-card">
              <code className="font-mono text-[13px] text-primary bg-primary/10 px-2 py-1 rounded w-20 text-center flex-shrink-0">{gap}</code>
              <span className="font-mono text-[13px] text-muted-foreground w-14 flex-shrink-0">{px}</span>
              <span className="text-sm text-muted-foreground">{use}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
