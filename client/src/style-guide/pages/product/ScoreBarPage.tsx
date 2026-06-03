import { ScoreBar } from '@/components/ui/score-bar';
import { JobMatchBadge } from '@/components/ui/job-match-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Stack, Grid } from '@/design-system';
import { BarChart2, Target, Briefcase, User } from 'lucide-react';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function ScoreBarPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">ScoreBar &amp; StatCard</h1>
        <p className="text-lg text-muted-foreground">
          Visualisation components for match scores, match grades, and dashboard
          KPI metrics. Color-codes automatically based on value ranges.
        </p>
      </div>

      <section>
        <h2 id="score-bar" className="text-xl font-semibold text-foreground mb-4">ScoreBar</h2>
        <p className="text-muted-foreground mb-4">
          A labeled progress bar with automatic color thresholds:
          red (0–49) → amber (50–69) → green (70+).
        </p>

        <h3 id="score-examples" className="text-base font-semibold text-foreground mt-4 mb-3">Score examples</h3>
        <DemoBlock
          title="Color thresholds"
          code={`<ScoreBar score={25} label="Score 25 (poor)"      size="md" />
<ScoreBar score={55} label="Score 55 (fair)"      size="md" />
<ScoreBar score={72} label="Score 72 (good)"      size="md" />
<ScoreBar score={91} label="Score 91 (excellent)" size="md" />`}
        >
          <Stack gap="md" className="max-w-sm">
            <ScoreBar score={25} label="Score 25 — poor"      size="md" />
            <ScoreBar score={55} label="Score 55 — fair"      size="md" />
            <ScoreBar score={72} label="Score 72 — good"      size="md" />
            <ScoreBar score={91} label="Score 91 — excellent" size="md" />
          </Stack>
        </DemoBlock>

        <h3 id="score-sizes" className="text-base font-semibold text-foreground mt-6 mb-3">Sizes</h3>
        <DemoBlock
          title="sm · md · lg"
          code={`<ScoreBar score={78} label="sm" size="sm" />
<ScoreBar score={78} label="md" size="md" />
<ScoreBar score={78} label="lg" size="lg" />`}
        >
          <Stack gap="sm" className="max-w-sm">
            <ScoreBar score={78} label="sm" size="sm" />
            <ScoreBar score={78} label="md" size="md" />
            <ScoreBar score={78} label="lg" size="lg" />
          </Stack>
        </DemoBlock>
      </section>

      <section>
        <h2 id="job-match-badge" className="text-xl font-semibold text-foreground mb-4">JobMatchBadge</h2>
        <p className="text-muted-foreground mb-4">
          A compact badge showing a match tier: Poor / Fair / Good / Excellent.
          Tier boundaries match ScoreBar's color thresholds.
        </p>
        <DemoBlock
          title="All tiers with score"
          code={`<JobMatchBadge score={30} showScore />
<JobMatchBadge score={50} showScore />
<JobMatchBadge score={70} showScore />
<JobMatchBadge score={90} showScore />`}
        >
          <Stack direction="horizontal" gap="sm" wrap>
            <JobMatchBadge score={30} showScore />
            <JobMatchBadge score={50} showScore />
            <JobMatchBadge score={70} showScore />
            <JobMatchBadge score={90} showScore />
          </Stack>
        </DemoBlock>
      </section>

      <section>
        <h2 id="stat-card" className="text-xl font-semibold text-foreground mb-4">StatCard</h2>
        <p className="text-muted-foreground mb-4">
          Dashboard KPI tile. Shows a metric value, optional change delta with period,
          and an optional icon. Change value is automatically colored green (positive)
          or red (negative).
        </p>
        <DemoBlock
          title="Positive · positive · negative · no change · loading"
          code={`<StatCard
  label="Resumes Created"
  value={12}
  change={{ value: 3, period: 'this month' }}
  icon={<BarChart2 className="w-4 h-4" />}
/>
<StatCard
  label="Avg Match Score"
  value="74%"
  change={{ value: 8, period: 'this week' }}
  icon={<Target className="w-4 h-4" />}
/>
<StatCard
  label="Jobs Applied"
  value={5}
  change={{ value: -2, period: 'this week' }}
  icon={<Briefcase className="w-4 h-4" />}
/>
<StatCard label="Profile Strength" value="82%" icon={<User className="w-4 h-4" />} />
<StatCard label="" value="" loading />`}
        >
          <div className="space-y-4">
            <Grid cols={1} smCols={2} lgCols={4} gap="md">
              <StatCard label="Resumes Created" value={12} change={{ value: 3, period: 'this month' }} icon={<BarChart2 className="w-4 h-4" />} />
              <StatCard label="Avg Match Score" value="74%" change={{ value: 8, period: 'this week' }} icon={<Target className="w-4 h-4" />} />
              <StatCard label="Jobs Applied" value={5} change={{ value: -2, period: 'this week' }} icon={<Briefcase className="w-4 h-4" />} />
              <StatCard label="Profile Strength" value="82%" icon={<User className="w-4 h-4" />} />
            </Grid>
            <Grid cols={1} smCols={2} lgCols={4} gap="md">
              <StatCard label="" value="" loading />
              <StatCard label="" value="" loading />
            </Grid>
          </div>
        </DemoBlock>
      </section>
    </div>
  );
}
