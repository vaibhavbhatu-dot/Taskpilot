import { Stepper } from '@/design-system';
import { DemoBlock } from '../../components/ui/DemoBlock';

const SIGNUP_STEPS = [
  { label: 'Sign up' },
  { label: 'Verify email' },
  { label: 'Your profile' },
  { label: 'Workspace' },
];

const DESCRIBED_STEPS = [
  { label: 'Account',   description: 'Email + password'  },
  { label: 'Verify',    description: 'Check your email'  },
  { label: 'Profile',   description: 'Tell us about you' },
  { label: 'Workspace', description: 'Set up your team'  },
];

export function StepperPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Stepper</h1>
        <p className="text-lg text-muted-foreground">
          Progress indicator for multi-step flows like onboarding and setup wizards.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Horizontal — step 1 of 4</h2>
        <DemoBlock
          title="currentStep={0}"
          code={`<Stepper
  currentStep={0}
  steps={[
    { label: 'Sign up' },
    { label: 'Verify email' },
    { label: 'Your profile' },
    { label: 'Workspace' },
  ]}
/>`}
        >
          <Stepper currentStep={0} steps={SIGNUP_STEPS} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Horizontal — step 2 of 4 (one completed)</h2>
        <DemoBlock
          title="currentStep={1}"
          code={`<Stepper
  currentStep={1}
  steps={[
    { label: 'Sign up' },
    { label: 'Verify email' },
    { label: 'Your profile' },
    { label: 'Workspace' },
  ]}
/>`}
        >
          <Stepper currentStep={1} steps={SIGNUP_STEPS} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">Horizontal — step 3 of 4 (two completed)</h2>
        <DemoBlock
          title="currentStep={2}"
          code={`<Stepper
  currentStep={2}
  steps={[
    { label: 'Sign up' },
    { label: 'Verify email' },
    { label: 'Your profile' },
    { label: 'Workspace' },
  ]}
/>`}
        >
          <Stepper currentStep={2} steps={SIGNUP_STEPS} />
        </DemoBlock>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">With descriptions</h2>
        <DemoBlock
          title="description prop on each step"
          code={`<Stepper
  currentStep={1}
  steps={[
    { label: 'Account',   description: 'Email + password'  },
    { label: 'Verify',    description: 'Check your email'  },
    { label: 'Profile',   description: 'Tell us about you' },
    { label: 'Workspace', description: 'Set up your team'  },
  ]}
/>`}
        >
          <Stepper currentStep={1} steps={DESCRIBED_STEPS} />
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
                ['steps',       '{ label: string; description?: string }[]', '—',            'Array of step definitions'],
                ['currentStep', 'number',                                     '—',            '0-indexed active step'],
                ['orientation', '"horizontal" | "vertical"',                  '"horizontal"', 'Layout direction'],
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
