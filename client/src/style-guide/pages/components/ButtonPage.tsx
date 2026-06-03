import { Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/design-system';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function ButtonPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Button</h1>
        <p className="text-lg text-muted-foreground">
          The primary interactive element. Buttons communicate actions and trigger
          events. Choose the variant that matches the action's importance and context.
        </p>
      </div>

      <section>
        <h2 id="examples" className="text-xl font-semibold text-foreground mb-1">Examples</h2>

        <div className="space-y-4 mt-4">
          <h3 id="variants" className="text-base font-semibold text-foreground">Variants</h3>
          <DemoBlock
            title="All variants"
            code={`<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="success">Success</Button>
<Button variant="link">Link</Button>`}
          >
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="success">Success</Button>
              <Button variant="link">Link</Button>
            </div>
          </DemoBlock>

          <h3 id="sizes" className="text-base font-semibold text-foreground mt-6">Sizes</h3>
          <DemoBlock
            title="All sizes"
            code={`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="icon" aria-label="add">
  <Plus className="w-4 h-4" />
</Button>`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (sm)</Button>
              <Button size="md">Medium (md)</Button>
              <Button size="lg">Large (lg)</Button>
              <Button size="icon" aria-label="add">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </DemoBlock>

          <h3 id="loading" className="text-base font-semibold text-foreground mt-6">Loading state</h3>
          <DemoBlock
            title="Loading"
            code={`<Button loading>Saving…</Button>
<Button loading variant="secondary">Processing…</Button>
<Button loading variant="outline">Uploading…</Button>`}
          >
            <div className="flex flex-wrap gap-3">
              <Button loading>Saving…</Button>
              <Button loading variant="secondary">Processing…</Button>
              <Button loading variant="outline">Uploading…</Button>
            </div>
          </DemoBlock>

          <h3 id="icons" className="text-base font-semibold text-foreground mt-6">With icons</h3>
          <DemoBlock
            title="leftIcon and rightIcon props"
            code={`<Button leftIcon={<Plus className="w-4 h-4" />}>New Ticket</Button>
<Button leftIcon={<Download className="w-4 h-4" />} variant="outline">Export</Button>
<Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />} size="sm">
  Delete
</Button>`}
          >
            <div className="flex flex-wrap gap-3">
              <Button leftIcon={<Plus className="w-4 h-4" />}>New Ticket</Button>
              <Button leftIcon={<Download className="w-4 h-4" />} variant="outline">Export</Button>
              <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />} size="sm">Delete</Button>
            </div>
          </DemoBlock>

          <h3 id="disabled" className="text-base font-semibold text-foreground mt-6">Disabled</h3>
          <DemoBlock
            title="Disabled state"
            code={`<Button disabled>Default disabled</Button>
<Button disabled variant="secondary">Secondary disabled</Button>
<Button disabled variant="outline">Outline disabled</Button>`}
          >
            <div className="flex flex-wrap gap-3">
              <Button disabled>Default disabled</Button>
              <Button disabled variant="secondary">Secondary disabled</Button>
              <Button disabled variant="outline">Outline disabled</Button>
            </div>
          </DemoBlock>
        </div>
      </section>

      <section>
        <h2 id="when-to-use" className="text-xl font-semibold text-foreground mb-4">When to use</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">default</strong> for the primary CTA on a page (one per section).</span></li>
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">outline</strong> for secondary actions alongside a default button.</span></li>
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">ghost</strong> for low-emphasis actions in toolbars or tables.</span></li>
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">destructive</strong> for irreversible delete or remove actions — pair with a ConfirmModal.</span></li>
        </ul>
      </section>

      <section>
        <h2 id="when-not-to-use" className="text-xl font-semibold text-foreground mb-4">When not to use</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-destructive font-bold mt-0.5">✗</span><span>Don't use multiple <strong className="text-foreground">default</strong> buttons on the same screen — it creates competing CTAs.</span></li>
          <li className="flex gap-2"><span className="text-destructive font-bold mt-0.5">✗</span><span>Don't use a Button for navigation — use a link or NavLink instead.</span></li>
          <li className="flex gap-2"><span className="text-destructive font-bold mt-0.5">✗</span><span>Don't use loading on a button that doesn't trigger an async operation.</span></li>
        </ul>
      </section>

      <section>
        <h2 id="props" className="text-xl font-semibold text-foreground mb-4">Props</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Prop', 'Type', 'Default', 'Description'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['variant', '"default" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "link"', '"default"', 'Visual style'],
                ['size',    '"sm" | "md" | "lg" | "icon"', '"md"', 'Height and padding'],
                ['loading', 'boolean', 'false', 'Shows spinner, disables button'],
                ['disabled','boolean', 'false', 'Disables interaction'],
                ['leftIcon','ReactNode', '—', 'Icon before label'],
                ['rightIcon','ReactNode','—', 'Icon after label'],
                ['fullWidth','boolean', 'false', 'Stretches to container width'],
                ['asChild', 'boolean', 'false', 'Renders as Radix Slot child'],
              ].map(([prop, type, def, desc]) => (
                <tr key={prop} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-foreground">{prop}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground max-w-[200px]">{type}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-muted-foreground">{def}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 id="accessibility" className="text-xl font-semibold text-foreground mb-4">Accessibility</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Icon-only buttons (<code className="font-mono bg-muted px-1 rounded text-xs">size="icon"</code>) must have an <code className="font-mono bg-muted px-1 rounded text-xs">aria-label</code>.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Loading state sets <code className="font-mono bg-muted px-1 rounded text-xs">disabled</code> automatically — no extra aria attributes needed.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Button inherits native <code className="font-mono bg-muted px-1 rounded text-xs">&lt;button&gt;</code> keyboard behaviour (Enter/Space activates).</span></li>
        </ul>
      </section>
    </div>
  );
}
