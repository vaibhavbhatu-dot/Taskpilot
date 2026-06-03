import { ResumeCard } from '@/components/ui/resume-card';
import { Grid } from '@/design-system';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function ResumeCardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">ResumeCard</h1>
        <p className="text-lg text-muted-foreground">
          A domain-specific card for resume management. Shows title, last-modified date,
          match score, status badge, and job target with a contextual action menu.
        </p>
      </div>

      <section>
        <h2 id="status-variants" className="text-xl font-semibold text-foreground mb-4">Status variants</h2>
        <p className="text-muted-foreground mb-4">
          Three statuses drive different visual treatments — tailored (with score),
          draft (amber), and applied (neutral).
        </p>
        <DemoBlock
          title="tailored · draft · applied"
          code={`<ResumeCard
  id="1" title="Software Engineer Resume"
  lastModified={new Date()} matchScore={85} status="tailored"
  jobTitle="Senior Frontend Engineer"
  onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}}
/>
<ResumeCard
  id="2" title="Product Manager Resume"
  lastModified={new Date()} matchScore={52} status="draft"
  onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}}
/>
<ResumeCard
  id="3" title="Data Analyst Resume"
  lastModified={new Date()} status="applied"
  jobTitle="Data Analyst @ Google"
  onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}}
/>`}
        >
          <Grid cols={1} smCols={2} lgCols={3} gap="md">
            <ResumeCard
              id="1" title="Software Engineer Resume"
              lastModified={new Date(Date.now() - 1000 * 60 * 45)}
              matchScore={85} status="tailored"
              jobTitle="Senior Frontend Engineer"
              onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}}
            />
            <ResumeCard
              id="2" title="Product Manager Resume"
              lastModified={new Date(Date.now() - 1000 * 60 * 60 * 3)}
              matchScore={52} status="draft"
              onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}}
            />
            <ResumeCard
              id="3" title="Data Analyst Resume"
              lastModified={new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)}
              status="applied" jobTitle="Data Analyst @ Google"
              onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}}
            />
          </Grid>
        </DemoBlock>
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
                ['id',          'string',                          'Yes', 'Unique identifier'],
                ['title',       'string',                          'Yes', 'Resume name'],
                ['lastModified','Date',                            'Yes', 'Last edited timestamp'],
                ['status',      '"tailored" | "draft" | "applied"','Yes', 'Drives badge and color'],
                ['matchScore',  'number',                          'No',  'Score 0–100, shows ScoreBar'],
                ['jobTitle',    'string',                          'No',  'Target job title'],
                ['onEdit',      '() => void',                     'Yes', 'Edit action'],
                ['onDuplicate', '() => void',                     'Yes', 'Duplicate action'],
                ['onDelete',    '() => void',                     'Yes', 'Delete action'],
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
    </div>
  );
}
