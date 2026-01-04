/**
 * FORM WRAPPER
 * =============
 * Main wrapper component for the multi-step submission form.
 *
 * Manages:
 *   - Form state (current step, draft data)
 *   - Navigation between steps
 *   - Auto-save functionality
 *   - Validation before advancing
 *
 * @module components/submit/form-wrapper
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Loader2, Send } from 'lucide-react';
import { StepProgress } from './step-progress';
import { Button } from '@/components/ui';
import type {
  EventDraft,
  EventDraftData,
  SeriesDraftData,
  EventStatus,
} from '@/types/submission';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  FORM_STEPS,
} from '@/types/submission';
import { AUTO_SAVE_DELAY } from '@/lib/constants/series-limits';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface FormWrapperProps {
  draft?: EventDraft;
  children: React.ReactNode;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  draftData: EventDraftData;
  setDraftData: (data: EventDraftData) => void;
  seriesDraftData: SeriesDraftData | null;
  setSeriesDraftData: (data: SeriesDraftData | null) => void;
  completedSteps: number[];
  setCompletedSteps: (steps: number[]) => void;
  onSave: () => Promise<void>;
  onSubmit: () => Promise<void>;
  isSaving: boolean;
  isSubmitting: boolean;
  lastSaved?: Date;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormWrapper({
  draft,
  children,
  currentStep,
  setCurrentStep,
  draftData,
  setDraftData,
  seriesDraftData,
  setSeriesDraftData,
  completedSteps,
  setCompletedSteps,
  onSave,
  onSubmit,
  isSaving,
  isSubmitting,
  lastSaved,
}: FormWrapperProps) {
  const router = useRouter();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ========== Validation ==========
  const validateCurrentStep = useCallback((): boolean => {
    let validation;

    switch (currentStep) {
      case 1:
        validation = validateStep1(draftData);
        break;
      case 2:
        validation = validateStep2(draftData);
        break;
      case 3:
        validation = validateStep3(draftData);
        break;
      case 4:
        validation = validateStep4(draftData);
        break;
      case 5:
        validation = validateStep5(draftData);
        break;
      case 6:
        // Image step is optional
        return true;
      case 7:
        // Review step - check all previous
        return true;
      default:
        return true;
    }

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return false;
    }

    setValidationErrors([]);
    return true;
  }, [currentStep, draftData]);

  // ========== Navigation ==========
  const goToStep = useCallback(
    (step: number) => {
      // Only allow going to completed steps or next step
      if (step < 1 || step > FORM_STEPS.length) return;

      if (step > currentStep && !validateCurrentStep()) {
        return;
      }

      // Mark current step as completed if moving forward
      if (step > currentStep && !completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }

      setCurrentStep(step);
      setValidationErrors([]);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentStep, completedSteps, validateCurrentStep, setCurrentStep, setCompletedSteps]
  );

  const goNext = useCallback(() => {
    if (currentStep < FORM_STEPS.length) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // ========== Auto-save ==========
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      onSave();
      setHasUnsavedChanges(false);
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [draftData, seriesDraftData, hasUnsavedChanges, onSave]);

  // Mark as having unsaved changes when data changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [draftData, seriesDraftData]);

  // ========== Render ==========
  return (
    <div className="min-h-screen bg-cream">
      {/* ========== Header ========== */}
      <div className="sticky top-0 z-10 bg-warm-white border-b border-sand shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <StepProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </div>
      </div>

      {/* ========== Form Content ========== */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-800 mb-2">
              Please fix the following issues:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Fields */}
        <div className="bg-warm-white rounded-xl p-6 shadow-sm border border-sand">
          {children}
        </div>

        {/* ========== Navigation Buttons ========== */}
        <div className="mt-6 flex items-center justify-between">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 1}
            className={cn(currentStep === 1 && 'invisible')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Save & Continue / Submit */}
          <div className="flex items-center space-x-3">
            {/* Save indicator */}
            {lastSaved && (
              <span className="text-sm text-stone">
                {isSaving ? (
                  <span className="flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  `Saved ${lastSaved.toLocaleTimeString()}`
                )}
              </span>
            )}

            {/* Manual Save */}
            <Button
              variant="outline"
              onClick={() => onSave()}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            {/* Continue / Submit */}
            {currentStep < FORM_STEPS.length ? (
              <Button onClick={goNext}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="bg-sage hover:bg-sage/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Help text */}
        <p className="mt-4 text-center text-sm text-stone">
          {currentStep === FORM_STEPS.length
            ? "Ready to submit? Our team will review your event within 24 hours."
            : "Your progress is saved automatically. You can return anytime to complete your submission."}
        </p>
      </div>
    </div>
  );
}
