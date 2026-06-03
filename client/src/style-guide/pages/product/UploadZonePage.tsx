import { UploadZone } from '@/components/ui/upload-zone';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function UploadZonePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Upload Zone</h1>
        <p className="text-lg text-muted-foreground">
          A drag-and-drop file input with click-to-browse fallback. Shows active drag
          state, selected file name, and handles PDF/DOCX files for resume uploads.
        </p>
      </div>

      <section>
        <h2 id="default" className="text-xl font-semibold text-foreground mb-4">Default</h2>
        <p className="text-muted-foreground mb-4">
          Try dragging a file onto the zone or clicking to browse. The component handles
          the drag-enter/leave visual state internally.
        </p>
        <DemoBlock
          title="Interactive upload zone"
          code={`<UploadZone
  onFileSelect={(file) => console.log('selected:', file.name)}
/>`}
        >
          <div className="max-w-md">
            <UploadZone
              onFileSelect={(file) => console.log('File selected:', file.name)}
            />
          </div>
        </DemoBlock>
      </section>

      <section>
        <h2 id="behavior" className="text-xl font-semibold text-foreground mb-4">Behavior</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Accepts <code className="font-mono bg-muted px-1 rounded text-xs">.pdf</code> and <code className="font-mono bg-muted px-1 rounded text-xs">.docx</code> files by default.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Drag-over state changes the border to primary and adds a subtle fill.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>After a file is selected, the zone shows the filename and a remove button.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Fires <code className="font-mono bg-muted px-1 rounded text-xs">onFileSelect(File)</code> callback with the chosen file.</span></li>
        </ul>
      </section>

      <section>
        <h2 id="props" className="text-xl font-semibold text-foreground mb-4">Props</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Prop','Type','Required','Description'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['onFileSelect','(file: File) => void', 'Yes', 'Called when a file is chosen'],
                ['accept',      'string',               'No',  'File type filter (e.g. ".pdf,.docx")'],
                ['disabled',    'boolean',              'No',  'Disables the input'],
              ].map(([p,t,r,d]) => (
                <tr key={p} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-foreground">{p}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{t}</td>
                  <td className="px-4 py-2.5 text-center text-[12px] text-muted-foreground">{r}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 id="accessibility" className="text-xl font-semibold text-foreground mb-4">Accessibility</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>Keyboard-accessible: press Enter or Space on the zone to open the file picker.</span></li>
          <li className="flex gap-2"><span className="text-primary font-bold">→</span><span>The underlying <code className="font-mono bg-muted px-1 rounded text-xs">&lt;input type="file"&gt;</code> is focusable and labelled via <code className="font-mono bg-muted px-1 rounded text-xs">aria-label</code>.</span></li>
        </ul>
      </section>
    </div>
  );
}
