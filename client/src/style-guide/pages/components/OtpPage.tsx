import { OtpInput } from '@/design-system';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function OtpPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">OTP Input</h1>
        <p className="text-lg text-muted-foreground">
          6-digit verification input used for email OTP and 2FA flows.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Default (empty)</h2>
        <DemoBlock
          title="6-box empty"
          code={`<OtpInput length={6} value="" onChange={() => {}} />`}
        >
          <OtpInput length={6} value="" onChange={() => {}} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Filled</h2>
        <DemoBlock
          title="All boxes filled"
          code={`<OtpInput length={6} value="123456" onChange={() => {}} />`}
        >
          <OtpInput length={6} value="123456" onChange={() => {}} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Error state</h2>
        <p className="text-muted-foreground mb-4">Wrong code — shown after failed verification.</p>
        <DemoBlock
          title="Error"
          code={`<OtpInput length={6} value="999999" error onChange={() => {}} />`}
        >
          <OtpInput length={6} value="999999" error onChange={() => {}} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Disabled</h2>
        <DemoBlock
          title="Disabled"
          code={`<OtpInput length={6} value="123456" disabled onChange={() => {}} />`}
        >
          <OtpInput length={6} value="123456" disabled onChange={() => {}} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">4-digit variant</h2>
        <p className="text-muted-foreground mb-4">For shorter PIN codes.</p>
        <DemoBlock
          title="length={4}"
          code={`<OtpInput length={4} value="" onChange={() => {}} />`}
        >
          <OtpInput length={4} value="" onChange={() => {}} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Props</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Prop', 'Type', 'Default', 'Description'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['length',    'number',   '6',     'Number of input boxes'],
                ['value',     'string',   '—',     'Current OTP value'],
                ['onChange',  'function', '—',     'Called with the full string on every change'],
                ['error',     'boolean',  'false', 'Red error state'],
                ['disabled',  'boolean',  'false', 'Disabled state'],
                ['autoFocus', 'boolean',  'false', 'Focus the first box on mount'],
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
    </div>
  );
}
