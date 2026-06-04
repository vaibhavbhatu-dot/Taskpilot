import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
}

export function Stepper({ steps, currentStep, orientation = 'horizontal' }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col gap-0">
        {steps.map((step, index) => {
          const completed = index < currentStep;
          const active = index === currentStep;

          return (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
                    completed && 'bg-[#2563EB] text-white',
                    active && 'bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20',
                    !completed && !active && 'bg-white border-2 border-[#E2E8F0] text-[#94A3B8]'
                  )}
                >
                  {completed ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn('w-px flex-1 my-1', completed ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]')} style={{ minHeight: 24 }} />
                )}
              </div>
              <div className="pb-6">
                <p className={cn('text-sm font-medium', active ? 'text-[#0F172A]' : 'text-[#94A3B8]')}>{step.label}</p>
                {step.description && (
                  <p className="text-xs text-[#94A3B8] mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-start w-full">
      {steps.map((step, index) => {
        const completed = index < currentStep;
        const active = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className={cn('flex items-start', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
                  completed && 'bg-[#2563EB] text-white',
                  active && 'bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20',
                  !completed && !active && 'bg-white border-2 border-[#E2E8F0] text-[#94A3B8]'
                )}
              >
                {completed ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <p className={cn('text-xs font-medium mt-1.5 text-center whitespace-nowrap', active ? 'text-[#0F172A]' : 'text-[#94A3B8]')}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-[11px] text-[#94A3B8] mt-0.5 text-center whitespace-nowrap">{step.description}</p>
              )}
            </div>
            {!isLast && (
              <div
                className={cn('h-px flex-1 mx-2 mt-4', completed ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
