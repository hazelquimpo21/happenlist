/**
 * STEP PROGRESS INDICATOR
 * ========================
 * Shows progress through the multi-step submission form.
 *
 * Displays:
 *   - Current step with highlight
 *   - Completed steps with checkmarks
 *   - Upcoming steps (dimmed)
 *
 * @module components/submit/step-progress
 */

'use client';

import { Check } from 'lucide-react';
import { FORM_STEPS } from '@/types/submission';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface StepProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StepProgress({
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: StepProgressProps) {
  return (
    <nav aria-label="Progress" className={cn('py-4', className)}>
      {/* ========== Mobile: Compact View ========== */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-medium text-ink">
            Step {currentStep} of {FORM_STEPS.length}
          </span>
          <span className="text-sm text-zinc">
            {FORM_STEPS[currentStep - 1]?.name || 'Unknown'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 mx-4">
          <div className="h-2 bg-cloud rounded-full overflow-hidden">
            <div
              className="h-full bg-blue transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(currentStep / FORM_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========== Desktop: Full View ========== */}
      <ol className="hidden md:flex items-center space-x-2 lg:space-x-4">
        {FORM_STEPS.map((step, index) => {
          const stepNumber = step.id;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = currentStep === stepNumber;
          const isClickable = isCompleted || isCurrent || completedSteps.includes(stepNumber - 1);

          return (
            <li key={step.id} className="flex items-center">
              {/* Connector line (not for first step) */}
              {index > 0 && (
                <div
                  className={cn(
                    'hidden lg:block w-8 h-0.5 mr-2',
                    isCompleted || isCurrent ? 'bg-blue' : 'bg-cloud'
                  )}
                />
              )}

              {/* Step indicator */}
              <button
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center space-x-2 group',
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                )}
              >
                {/* Circle/Check */}
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                    isCompleted
                      ? 'bg-emerald text-white'
                      : isCurrent
                        ? 'bg-blue text-white ring-2 ring-blue ring-offset-2'
                        : 'bg-cloud text-zinc'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </span>

                {/* Label (hidden on smaller screens) */}
                <span
                  className={cn(
                    'hidden lg:block text-sm font-medium transition-colors',
                    isCurrent
                      ? 'text-ink'
                      : isCompleted
                        ? 'text-emerald'
                        : 'text-zinc'
                  )}
                >
                  {step.name}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// STEP HEADER (for form sections)
// ============================================================================

interface StepHeaderProps {
  step: number;
  title: string;
  description?: string;
  className?: string;
}

export function StepHeader({ step, title, description, className }: StepHeaderProps) {
  const stepConfig = FORM_STEPS.find((s) => s.id === step);

  return (
    <div className={cn('mb-6', className)}>
      {/* Step number badge */}
      <div className="inline-flex items-center px-2 py-1 mb-2 text-xs font-medium bg-blue/10 text-blue rounded">
        Step {step} of {FORM_STEPS.length}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-body font-semibold text-ink">
        {title}
      </h2>

      {/* Description */}
      <p className="mt-1 text-zinc">
        {description || stepConfig?.description}
      </p>
    </div>
  );
}
