import { Search, Eye } from 'lucide-react';
import { Input, Textarea, Label, FormField } from '@/design-system';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function InputPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Input</h1>
        <p className="text-lg text-muted-foreground">
          Text inputs, textareas, labels, and the FormField wrapper. All form primitives
          share a consistent visual language — border, focus ring, error ring, and slot support.
        </p>
      </div>

      <section>
        <h2 id="input-variants" className="text-xl font-semibold text-foreground mb-1">Input variants</h2>
        <div className="space-y-4 mt-4">
          <DemoBlock
            title="Default, Error, Success"
            code={`<Input variant="default" placeholder="Default input" />
<Input variant="error" placeholder="Error input" defaultValue="bad value" />
<Input variant="success" placeholder="Success" defaultValue="valid@email.com" />`}
          >
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Default</span>
                <Input variant="default" placeholder="Default input" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Error</span>
                <Input variant="error" placeholder="Error" defaultValue="bad value" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Success</span>
                <Input variant="success" defaultValue="valid@email.com" />
              </div>
            </div>
          </DemoBlock>
        </div>
      </section>

      <section>
        <h2 id="slots" className="text-xl font-semibold text-foreground mb-1">Slots</h2>
        <p className="text-muted-foreground mb-4">
          Use <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">leftSlot</code> and{' '}
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">rightSlot</code> to inject
          icons or interactive elements without disrupting focus styles.
        </p>
        <DemoBlock
          title="Left and right slots"
          code={`<Input placeholder="Search…" leftSlot={<Search className="w-4 h-4" />} />
<Input
  type="password"
  placeholder="Password"
  rightSlot={<Eye className="w-4 h-4 cursor-pointer" />}
/>`}
        >
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Left slot</span>
              <Input placeholder="Search…" leftSlot={<Search className="w-4 h-4" />} />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Right slot</span>
              <Input type="password" placeholder="Password" defaultValue="secret" rightSlot={<Eye className="w-4 h-4 cursor-pointer" />} />
            </div>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="textarea" className="text-xl font-semibold text-foreground mb-1">Textarea</h2>
        <DemoBlock
          title="Default and Error variants"
          code={`<Textarea placeholder="Write a description…" rows={3} />
<Textarea variant="error" placeholder="Required" rows={3} />`}
        >
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Default</span>
              <Textarea placeholder="Write a description…" rows={3} />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Error</span>
              <Textarea variant="error" placeholder="Required" rows={3} />
            </div>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="label" className="text-xl font-semibold text-foreground mb-1">Label</h2>
        <DemoBlock
          title="With required asterisk and hint"
          code={`<Label required>Email address</Label>
<Label hint="We'll never share your email.">Email address</Label>
<Label required hint="Must be a valid work address.">Work email</Label>`}
        >
          <div className="flex flex-col gap-4 max-w-xs">
            <Label required>Email address</Label>
            <Label hint="We'll never share your email.">Email address</Label>
            <Label required hint="Must be a valid work address.">Work email</Label>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="form-field" className="text-xl font-semibold text-foreground mb-1">FormField</h2>
        <p className="text-muted-foreground mb-4">
          Composes Label + Input (or any children) + error/hint text into a single accessible unit.
          Always use FormField instead of wiring Label, Input, and error separately.
        </p>
        <DemoBlock
          title="FormField compositions"
          code={`<FormField label="Username" hint="Only letters and numbers." required>
  <Input placeholder="jane_doe" />
</FormField>

<FormField label="Email" required error="Please enter a valid email address.">
  <Input variant="error" defaultValue="not-an-email" />
</FormField>

<FormField label="Bio" hint="Max 160 characters.">
  <Textarea placeholder="Tell us about yourself…" rows={3} />
</FormField>`}
        >
          <div className="grid sm:grid-cols-2 gap-6 max-w-xl">
            <FormField label="Username" hint="Only letters and numbers." required>
              <Input placeholder="jane_doe" />
            </FormField>
            <FormField label="Email" required error="Please enter a valid email address.">
              <Input variant="error" defaultValue="not-an-email" />
            </FormField>
            <FormField label="Bio" hint="Max 160 characters.">
              <Textarea placeholder="Tell us about yourself…" rows={3} />
            </FormField>
            <FormField label="Website" error="URL must start with https://">
              <Input variant="error" defaultValue="http://example" />
            </FormField>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="props" className="text-xl font-semibold text-foreground mb-4">Props</h2>

        <h3 id="input-props" className="text-base font-semibold text-foreground mb-3">Input</h3>
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
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
                ['variant',   '"default" | "error" | "success"', '"default"', 'Border color and ring color'],
                ['leftSlot',  'ReactNode', '—', 'Icon or element on the left'],
                ['rightSlot', 'ReactNode', '—', 'Icon or element on the right'],
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

        <h3 id="formfield-props" className="text-base font-semibold text-foreground mb-3">FormField</h3>
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
                ['label',    'string',    '—',     'Label text'],
                ['required', 'boolean',   'false',  'Adds asterisk to label'],
                ['hint',     'string',    '—',     'Help text below input'],
                ['error',    'string',    '—',     'Error text (red), replaces hint'],
                ['children', 'ReactNode', '—',     'The input/textarea/select'],
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
        <h2 id="accessibility" className="text-xl font-semibold text-foreground mb-4">Accessibility</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>FormField generates a unique <code className="font-mono bg-muted px-1 rounded text-xs">id</code> and wires <code className="font-mono bg-muted px-1 rounded text-xs">htmlFor</code> automatically.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Error messages are associated via <code className="font-mono bg-muted px-1 rounded text-xs">aria-describedby</code>.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Slot icons are hidden from screen readers with <code className="font-mono bg-muted px-1 rounded text-xs">aria-hidden</code>.</span></li>
        </ul>
      </section>
    </div>
  );
}
