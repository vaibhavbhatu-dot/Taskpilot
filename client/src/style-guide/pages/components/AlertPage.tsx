import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function AlertPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Alert</h1>
        <p className="text-lg text-muted-foreground">
          Inline status messages that communicate important contextual information.
          Alerts auto-assign icons based on their variant and never interrupt the user's flow.
        </p>
      </div>

      <section>
        <h2 id="variants" className="text-xl font-semibold text-foreground mb-4">Variants</h2>
        <DemoBlock
          title="success · warning · info · error"
          code={`<Alert variant="success">
  <AlertTitle>Changes saved</AlertTitle>
  <AlertDescription>Your profile has been updated successfully.</AlertDescription>
</Alert>
<Alert variant="warning">
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>This sprint ends in 2 days.</AlertDescription>
</Alert>
<Alert variant="info">
  <AlertTitle>New feature</AlertTitle>
  <AlertDescription>Sprint reports now support CSV export.</AlertDescription>
</Alert>
<Alert variant="error">
  <AlertTitle>Action failed</AlertTitle>
  <AlertDescription>Could not save changes. Please try again.</AlertDescription>
</Alert>`}
        >
          <div className="flex flex-col gap-3 max-w-2xl">
            <Alert variant="success">
              <AlertTitle>Changes saved</AlertTitle>
              <AlertDescription>Your profile has been updated successfully.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>This sprint ends in 2 days. Make sure tickets are updated.</AlertDescription>
            </Alert>
            <Alert variant="info">
              <AlertTitle>New feature available</AlertTitle>
              <AlertDescription>Sprint reports now support CSV export.</AlertDescription>
            </Alert>
            <Alert variant="error">
              <AlertTitle>Action failed</AlertTitle>
              <AlertDescription>Could not save changes. Please try again.</AlertDescription>
            </Alert>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="without-title" className="text-xl font-semibold text-foreground mb-4">Without title</h2>
        <p className="text-muted-foreground mb-4">
          <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">AlertTitle</code> is optional.
          For brief one-liner messages, use only <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">AlertDescription</code>.
        </p>
        <DemoBlock
          title="Description only"
          code={`<Alert variant="info">
  <AlertDescription>Your session will expire in 10 minutes.</AlertDescription>
</Alert>
<Alert variant="warning">
  <AlertDescription>Read-only mode — contact an admin to make changes.</AlertDescription>
</Alert>`}
        >
          <div className="flex flex-col gap-3 max-w-xl">
            <Alert variant="info">
              <AlertDescription>Your session will expire in 10 minutes.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertDescription>Read-only mode — contact an admin to make changes.</AlertDescription>
            </Alert>
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="when-to-use" className="text-xl font-semibold text-foreground mb-4">When to use</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use alerts for <strong className="text-foreground">inline feedback</strong> that relates to content on the current page.</span></li>
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">error</strong> variant for form submission failures, API errors, or validation blockers.</span></li>
          <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><span>Use <strong className="text-foreground">info</strong> or <strong className="text-foreground">warning</strong> for contextual guidance, not for notifications.</span></li>
        </ul>
      </section>

      <section>
        <h2 id="when-not-to-use" className="text-xl font-semibold text-foreground mb-4">When not to use</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-destructive font-bold mt-0.5">✗</span><span>Don't use Alert for transient feedback — use <strong className="text-foreground">Toast</strong> instead.</span></li>
          <li className="flex gap-2"><span className="text-destructive font-bold mt-0.5">✗</span><span>Don't overload a page with multiple alerts — they lose impact.</span></li>
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
                ['variant', '"success" | "warning" | "info" | "error"', '—', 'Sets icon, background, and border color'],
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
