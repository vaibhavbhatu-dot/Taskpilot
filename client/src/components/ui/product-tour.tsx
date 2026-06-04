import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, cn } from '@/design-system';

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface ProductTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const TOOLTIP_W = 288;
const TOOLTIP_H = 230;
const GAP = 16;

function calcPosition(rect: DOMRect, position: TourStep['position']) {
  let top = 0;
  let left = 0;

  switch (position) {
    case 'right':
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.right + GAP;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.left - TOOLTIP_W - GAP;
      break;
    case 'bottom':
      top = rect.bottom + GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
    case 'top':
      top = rect.top - TOOLTIP_H - GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      break;
  }

  // Clamp to viewport
  top = Math.max(8, Math.min(top, window.innerHeight - TOOLTIP_H - 8));
  left = Math.max(8, Math.min(left, window.innerWidth - TOOLTIP_W - 8));

  return { top, left };
}

function highlightElement(el: HTMLElement) {
  el.style.position = 'relative';
  el.style.zIndex = '9100';
  el.style.borderRadius = '8px';
  el.style.boxShadow = '0 0 0 4px #2563EB, 0 0 0 9999px rgba(0,0,0,0.55)';
  el.style.transition = 'box-shadow 0.2s ease';
}

function clearHighlight(el: HTMLElement) {
  el.style.position = '';
  el.style.zIndex = '';
  el.style.borderRadius = '';
  el.style.boxShadow = '';
  el.style.transition = '';
}

export function ProductTour({ steps, isActive, onComplete, onSkip }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const prevEl = useRef<HTMLElement | null>(null);

  const step = steps[currentStep];

  const applyStep = useCallback((index: number) => {
    // Remove previous highlight
    if (prevEl.current) {
      clearHighlight(prevEl.current);
      prevEl.current = null;
    }

    const s = steps[index];
    const el = document.querySelector<HTMLElement>(s.target);
    if (!el) return;

    highlightElement(el);
    prevEl.current = el;

    const rect = el.getBoundingClientRect();
    setTooltipPos(calcPosition(rect, s.position));
    setVisible(true);
  }, [steps]);

  // Apply highlight whenever step or active state changes
  useEffect(() => {
    if (!isActive) {
      if (prevEl.current) { clearHighlight(prevEl.current); prevEl.current = null; }
      setVisible(false);
      return;
    }
    // Small delay so DOM is settled
    const t = setTimeout(() => applyStep(currentStep), 80);
    return () => clearTimeout(t);
  }, [isActive, currentStep, applyStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevEl.current) { clearHighlight(prevEl.current); prevEl.current = null; }
    };
  }, []);

  function nextStep() {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function completeTour() {
    if (prevEl.current) { clearHighlight(prevEl.current); prevEl.current = null; }
    localStorage.setItem('tour_completed', 'true');
    onComplete();
  }

  function skipTour() {
    if (prevEl.current) { clearHighlight(prevEl.current); prevEl.current = null; }
    localStorage.setItem('tour_completed', 'true');
    onSkip();
  }

  if (!isActive || !visible) return null;

  return (
    <>
      {/* Invisible click-blocker backdrop (the visual overlay is the box-shadow on target) */}
      <div className="fixed inset-0 z-[9000]" onClick={skipTour} />

      {/* Tooltip card */}
      <div
        className="fixed z-[9200] bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-5"
        style={{ width: TOOLTIP_W, top: tooltipPos.top, left: tooltipPos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#94A3B8]">
            {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={skipTour}
            className="text-xs text-[#94A3B8] hover:text-[#64748B] transition-colors"
          >
            Skip tour
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i === currentStep ? 'w-4 bg-[#2563EB]' : 'w-1.5 bg-[#E2E8F0]'
              )}
            />
          ))}
        </div>

        <h3 className="text-sm font-semibold text-[#0F172A] mb-1.5">{step.title}</h3>
        <p className="text-sm text-[#64748B] leading-relaxed mb-4">{step.description}</p>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={prevStep}>
              Back
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={currentStep === steps.length - 1 ? completeTour : nextStep}
          >
            {currentStep === steps.length - 1 ? 'Got it!' : 'Next →'}
          </Button>
        </div>
      </div>
    </>
  );
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Your command center',
    description: 'See everything happening across your team at a glance — stats, recent activity, and sprint progress.',
    position: 'right',
  },
  {
    target: '[data-tour="tickets"]',
    title: 'All your work lives here',
    description: 'Every task, bug, and feature is a ticket. Create your first one with the + button in the top right.',
    position: 'right',
  },
  {
    target: '[data-tour="board"]',
    title: 'Drag to update status',
    description: 'Move tickets across columns to track progress. Your team sees changes instantly.',
    position: 'right',
  },
  {
    target: '[data-tour="sprints"]',
    title: 'Plan in sprints',
    description: 'Group work into 2-week sprints. Your first sprint is already set up with sample tickets.',
    position: 'right',
  },
  {
    target: '[data-tour="invite"]',
    title: 'Better with your team',
    description: 'Invite teammates from the Members page. They\'ll get an email with a setup link.',
    position: 'right',
  },
];
