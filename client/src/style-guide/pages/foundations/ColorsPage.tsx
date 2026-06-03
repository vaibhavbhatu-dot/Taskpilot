const COLOR_TOKENS = [
  { variable: '--background',            label: 'background',       group: 'Surface'  },
  { variable: '--foreground',            label: 'foreground',       group: 'Surface'  },
  { variable: '--card',                  label: 'card',             group: 'Surface'  },
  { variable: '--card-foreground',       label: 'card-foreground',  group: 'Surface'  },
  { variable: '--muted',                 label: 'muted',            group: 'Surface'  },
  { variable: '--muted-foreground',      label: 'muted-foreground', group: 'Surface'  },
  { variable: '--border',                label: 'border',           group: 'Surface'  },
  { variable: '--input',                 label: 'input',            group: 'Surface'  },
  { variable: '--primary',               label: 'primary',          group: 'Brand'    },
  { variable: '--primary-foreground',    label: 'primary-fg',       group: 'Brand'    },
  { variable: '--secondary',             label: 'secondary',        group: 'Brand'    },
  { variable: '--secondary-foreground',  label: 'secondary-fg',     group: 'Brand'    },
  { variable: '--accent',                label: 'accent',           group: 'Brand'    },
  { variable: '--ring',                  label: 'ring',             group: 'Brand'    },
  { variable: '--destructive',           label: 'destructive',      group: 'Semantic' },
  { variable: '--color-success',         label: 'success',          group: 'Semantic' },
  { variable: '--color-warning',         label: 'warning',          group: 'Semantic' },
  { variable: '--color-info',            label: 'info',             group: 'Semantic' },
];

const GROUPS = ['Surface', 'Brand', 'Semantic'] as const;

function Swatch({ variable, label }: { variable: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[72px]">
      <div
        className="w-14 h-14 rounded-lg border border-border flex-shrink-0 shadow-sm"
        style={{ backgroundColor: `hsl(var(${variable}))` }}
      />
      <div className="text-center space-y-0.5">
        <p className="text-[11px] font-mono font-medium text-foreground leading-tight break-all">
          {label}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground">{variable}</p>
      </div>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Colors</h1>
        <p className="text-lg text-muted-foreground">
          CSS custom properties defined in{' '}
          <code className="font-mono text-base bg-muted px-1.5 py-0.5 rounded">src/index.css</code>.
          All colors adapt automatically to light and dark mode — never hardcode hex values.
        </p>
      </div>

      <section>
        <h2 id="tokens" className="text-xl font-semibold text-foreground mb-1">Token system</h2>
        <p className="text-muted-foreground mb-6">
          Tokens are grouped by purpose. Toggle dark mode in the sidebar to see values switch.
        </p>
        <div className="space-y-8">
          {GROUPS.map(group => (
            <div key={group}>
              <h3 id={`group-${group.toLowerCase()}`} className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {group}
              </h3>
              <div className="flex flex-wrap gap-6 p-5 rounded-xl border border-border bg-card">
                {COLOR_TOKENS.filter(t => t.group === group).map(({ variable, label }) => (
                  <Swatch key={variable} variable={variable} label={label} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 id="usage" className="text-xl font-semibold text-foreground mb-1">Usage</h2>
        <p className="text-muted-foreground mb-4">
          Use Tailwind utility classes that reference these tokens. Never use raw hex values.
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tailwind class</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Use for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['bg-background', 'Page background'],
                ['bg-card', 'Card and panel surfaces'],
                ['bg-muted / bg-muted/50', 'Subtle fills, table row stripes'],
                ['text-foreground', 'Primary body text'],
                ['text-muted-foreground', 'Secondary / placeholder text'],
                ['border-border', 'All borders and dividers'],
                ['bg-primary / text-primary', 'Brand actions, links, active states'],
                ['text-destructive / bg-destructive', 'Errors, delete actions'],
                ['hsl(var(--color-success))', 'Success, live, completed'],
                ['hsl(var(--color-warning))', 'Warnings, in-progress'],
                ['hsl(var(--color-info))', 'Informational, links, info badges'],
              ].map(([cls, desc]) => (
                <tr key={cls} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-foreground">{cls}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 id="dark-mode" className="text-xl font-semibold text-foreground mb-1">Dark mode</h2>
        <p className="text-muted-foreground mb-4">
          Dark mode is activated by adding <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">class="dark"</code> to the{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">&lt;html&gt;</code> element.
          All token values automatically swap — no conditional class switching in components needed.
        </p>
        <div className="p-4 rounded-xl border border-border bg-muted/30">
          <pre className="font-mono text-sm text-foreground">{`:root {
  --primary: 0 0% 9%;        /* light */
}
.dark {
  --primary: 0 0% 98%;       /* dark */
}`}</pre>
        </div>
      </section>
    </div>
  );
}
