import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function SelectPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Select</h1>
        <p className="text-lg text-muted-foreground">
          Select replaces native browser dropdowns with a consistent, styled component across all
          platforms. Built on Radix UI for full keyboard navigation, screen reader support, and
          portal rendering.
        </p>
      </div>

      {/* ── Basic ──────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Basic select</h2>
        <p className="text-muted-foreground mb-4">
          A simple single-value picker. Provide a <code className="font-mono bg-muted px-1 rounded text-xs">defaultValue</code> or
          wire <code className="font-mono bg-muted px-1 rounded text-xs">value</code> +{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">onValueChange</code> for controlled usage.
        </p>
        <DemoBlock
          title="Priority picker"
          code={`<Select defaultValue="medium">
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select priority" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="low">Low</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="high">High</SelectItem>
    <SelectItem value="critical">Critical</SelectItem>
  </SelectContent>
</Select>`}
        >
          <Select defaultValue="medium">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </DemoBlock>
      </section>

      {/* ── Placeholder ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">With placeholder</h2>
        <p className="text-muted-foreground mb-4">
          When no <code className="font-mono bg-muted px-1 rounded text-xs">defaultValue</code> or{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">value</code> is set, the{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">placeholder</code> prop of{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">SelectValue</code> renders in muted text.
        </p>
        <DemoBlock
          title="Unselected / placeholder"
          code={`<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select a team..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="frontend">Frontend Team</SelectItem>
    <SelectItem value="backend">Backend Team</SelectItem>
    <SelectItem value="design">Design Team</SelectItem>
    <SelectItem value="qa">QA Team</SelectItem>
  </SelectContent>
</Select>`}
        >
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a team..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frontend">Frontend Team</SelectItem>
              <SelectItem value="backend">Backend Team</SelectItem>
              <SelectItem value="design">Design Team</SelectItem>
              <SelectItem value="qa">QA Team</SelectItem>
            </SelectContent>
          </Select>
        </DemoBlock>
      </section>

      {/* ── Groups ─────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Grouped options</h2>
        <p className="text-muted-foreground mb-4">
          Use <code className="font-mono bg-muted px-1 rounded text-xs">SelectLabel</code> and{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">SelectSeparator</code> to organise
          long option lists into labelled groups.
        </p>
        <DemoBlock
          title="Members grouped by team"
          code={`<Select>
  <SelectTrigger className="w-[220px]">
    <SelectValue placeholder="Assign to member..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Frontend Team</SelectLabel>
      <SelectItem value="arjun">Arjun Patel</SelectItem>
      <SelectItem value="vikram">Vikram Sharma</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Backend Team</SelectLabel>
      <SelectItem value="nisha">Nisha Patel</SelectItem>
      <SelectItem value="deepak">Deepak Kumar</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`}
        >
          <Select>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Assign to member..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Frontend Team</SelectLabel>
                <SelectItem value="arjun">Arjun Patel</SelectItem>
                <SelectItem value="vikram">Vikram Sharma</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Backend Team</SelectLabel>
                <SelectItem value="nisha">Nisha Patel</SelectItem>
                <SelectItem value="deepak">Deepak Kumar</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </DemoBlock>
      </section>

      {/* ── Widths ─────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Widths</h2>
        <p className="text-muted-foreground mb-4">
          The trigger has no fixed width by default. Pass a width class on{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">SelectTrigger</code> to control it.
          Use <code className="font-mono bg-muted px-1 rounded text-xs">w-full</code> inside form layouts.
        </p>
        <DemoBlock
          title="Short / default / full-width"
          code={`<Select defaultValue="med">
  <SelectTrigger className="w-[120px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>…</SelectContent>
</Select>

<Select defaultValue="med">
  <SelectTrigger className="w-[180px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>…</SelectContent>
</Select>

<Select defaultValue="med">
  <SelectTrigger className="w-full">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>…</SelectContent>
</Select>`}
        >
          <div className="flex flex-col gap-3 max-w-sm">
            {(['w-[120px]', 'w-[180px]', 'w-full'] as const).map((w) => (
              <div key={w} className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground w-[90px] flex-shrink-0">{w}</span>
                <Select defaultValue="med">
                  <SelectTrigger className={w}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="med">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </DemoBlock>
      </section>

      {/* ── Disabled ───────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">Disabled state</h2>
        <p className="text-muted-foreground mb-4">
          Pass <code className="font-mono bg-muted px-1 rounded text-xs">disabled</code> to{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">Select</code> (or{' '}
          <code className="font-mono bg-muted px-1 rounded text-xs">SelectTrigger</code>) to mark the
          field as read-only. The trigger renders at reduced opacity and blocks pointer events.
        </p>
        <DemoBlock
          title="Disabled / read-only field"
          code={`<Select disabled>
  <SelectTrigger className="w-[220px]">
    <SelectValue placeholder="Managed via sprint board" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sprint-1">Sprint 1</SelectItem>
  </SelectContent>
</Select>
<p className="text-xs text-muted-foreground mt-1">
  Some fields are read-only
</p>`}
        >
          <div>
            <Select disabled>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Managed via sprint board" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sprint-1">Sprint 1</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Some fields are read-only</p>
          </div>
        </DemoBlock>
      </section>

      {/* ── TaskPilot use case ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-1">TaskPilot sidebar — Status &amp; Priority</h2>
        <p className="text-muted-foreground mb-4">
          The ticket detail sidebar uses labelled selects for Status and Priority. This is the
          target pattern once existing <code className="font-mono bg-muted px-1 rounded text-xs">&lt;select&gt;</code> elements are migrated.
        </p>
        <DemoBlock
          title="Status + Priority selectors"
          code={`<div className="space-y-3 w-[200px]">
  <div>
    <label className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8] mb-1.5 block">
      STATUS
    </label>
    <Select defaultValue="in_progress">
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="backlog">Backlog</SelectItem>
        <SelectItem value="requirements">Requirements</SelectItem>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="html">HTML</SelectItem>
        <SelectItem value="in_progress">On Development</SelectItem>
        <SelectItem value="qa">QA</SelectItem>
        <SelectItem value="bugs">Bugs</SelectItem>
        <SelectItem value="uat">UAT</SelectItem>
        <SelectItem value="live">Live</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div>
    <label className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8] mb-1.5 block">
      PRIORITY
    </label>
    <Select defaultValue="high">
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="critical">Critical</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>`}
        >
          <div className="space-y-3 w-[200px]">
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8] mb-1.5 block">
                STATUS
              </label>
              <Select defaultValue="in_progress">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="requirements">Requirements</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="in_progress">On Development</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="bugs">Bugs</SelectItem>
                  <SelectItem value="uat">UAT</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8] mb-1.5 block">
                PRIORITY
              </label>
              <Select defaultValue="high">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DemoBlock>
      </section>

      {/* ── When to use ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">When to use</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-3">✅ Use Select when…</p>
            <ul className="space-y-2 text-[14px] text-muted-foreground">
              <li>→ There are 4 or more options</li>
              <li>→ Options are dynamic or come from an API</li>
              <li>→ Space is limited (vs. radio buttons)</li>
              <li>→ The field is inside a compact sidebar or form</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-3">❌ Do not use Select when…</p>
            <ul className="space-y-2 text-[14px] text-muted-foreground">
              <li>→ 2–3 options — use Toggle buttons instead</li>
              <li>→ Yes / No — use a Checkbox or Switch</li>
              <li>→ Multiple selections — use a multi-select or checkboxes</li>
              <li>→ Inline text — use a segmented control</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Props ──────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Props</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Prop', 'Type', 'Default', 'Description'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['value',          'string',                  '—',     'Controlled selected value'],
                ['defaultValue',   'string',                  '—',     'Uncontrolled initial value'],
                ['onValueChange',  '(value: string) => void', '—',     'Fired when the selection changes'],
                ['disabled',       'boolean',                 'false', 'Prevents interaction, renders at reduced opacity'],
                ['placeholder',    'string (on SelectValue)', '—',     'Text shown when no value is selected'],
              ].map(([p, t, d, desc]) => (
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

      {/* ── Accessibility ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Accessibility</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary font-bold">→</span>
            <span>Full keyboard support: <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">Space</kbd> / <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">Enter</kbd> open, arrow keys navigate, <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">Escape</kbd> closes.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">→</span>
            <span>Radix UI uses <code className="font-mono bg-muted px-1 rounded text-xs">role="listbox"</code> and <code className="font-mono bg-muted px-1 rounded text-xs">aria-selected</code> automatically.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">→</span>
            <span>Always pair with a visible <code className="font-mono bg-muted px-1 rounded text-xs">&lt;label&gt;</code> or <code className="font-mono bg-muted px-1 rounded text-xs">aria-label</code> on the trigger.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">→</span>
            <span>The dropdown renders via a portal — it will never be clipped by <code className="font-mono bg-muted px-1 rounded text-xs">overflow-hidden</code> parents.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
