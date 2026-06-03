import { AISuggestionChip } from '@/components/ui/ai-suggestion-chip';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function AISuggestionPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">AI Suggestion Chip</h1>
        <p className="text-lg text-muted-foreground">
          Inline contextual suggestions surfaced by an AI model. The chip presents
          a suggestion string with accept and dismiss actions. Use it to guide users
          without interrupting their flow.
        </p>
      </div>

      <section>
        <h2 id="examples" className="text-xl font-semibold text-foreground mb-4">Examples</h2>

        <h3 id="default" className="text-base font-semibold text-foreground mb-3">Default</h3>
        <DemoBlock
          title="Default variant with accept / dismiss"
          code={`<AISuggestionChip
  suggestion="Consider adding 'TypeScript' to your skills section"
  onAccept={() => console.log('accepted')}
  onDismiss={() => console.log('dismissed')}
/>`}
        >
          <AISuggestionChip
            suggestion="Consider adding 'TypeScript' to your skills section"
            onAccept={() => {}}
            onDismiss={() => {}}
          />
        </DemoBlock>

        <h3 id="loading" className="text-base font-semibold text-foreground mt-6 mb-3">Loading state</h3>
        <DemoBlock
          title="loading prop — shows skeleton while generating"
          code={`<AISuggestionChip suggestion="Generating suggestion…" loading />`}
        >
          <AISuggestionChip suggestion="Generating suggestion…" loading />
        </DemoBlock>

        <h3 id="inline" className="text-base font-semibold text-foreground mt-6 mb-3">Inline variant</h3>
        <p className="text-muted-foreground mb-3">
          Use <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">variant="inline"</code> to
          embed the chip alongside other content in a text flow.
        </p>
        <DemoBlock
          title='variant="inline"'
          code={`<div className="flex items-center gap-3">
  <span className="text-sm text-muted-foreground">Inline suggestion →</span>
  <AISuggestionChip
    variant="inline"
    suggestion="Tailor your summary for this role"
    onAccept={() => {}}
    onDismiss={() => {}}
  />
</div>`}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Inline suggestion →</span>
            <AISuggestionChip
              variant="inline"
              suggestion="Tailor your summary for this role"
              onAccept={() => {}}
              onDismiss={() => {}}
            />
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="when-to-use" className="text-xl font-semibold text-foreground mb-4">When to use</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use to surface AI-generated content improvements in resume or ticket editors.</span></li>
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">loading</strong> while the AI model is still generating, then replace with the real suggestion.</span></li>
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">inline</strong> variant when the suggestion accompanies a specific field label or paragraph.</span></li>
        </ul>
      </section>

      <section>
        <h2 id="when-not-to-use" className="text-xl font-semibold text-foreground mb-4">When not to use</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-destructive font-bold mt-0.5">✗</span><span>Don't stack multiple chips — show one at a time to avoid overwhelming the user.</span></li>
          <li className="flex gap-2"><span className="text-destructive font-bold mt-0.5">✗</span><span>Don't use for system errors or validation messages — use <strong className="text-foreground">Alert</strong> instead.</span></li>
        </ul>
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
                ['suggestion',  'string',             '—',         'The suggestion text to display'],
                ['variant',     '"default" | "inline"','"default"', 'Layout style'],
                ['loading',     'boolean',            'false',      'Shows a loading skeleton animation'],
                ['onAccept',    '() => void',         '—',         'Called when user accepts the suggestion'],
                ['onDismiss',   '() => void',         '—',         'Called when user dismisses the chip'],
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
