/**
 * SUBMIT EVENT FORM
 * ==================
 * Client component that orchestrates the multi-step submission form.
 *
 * Manages:
 *   - Draft state and auto-saving
 *   - Step navigation
 *   - Final submission
 *
 * @module app/submit/new/submit-event-form
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FormWrapper,
  Step1BasicInfo,
  Step2EventType,
  Step3DateTime,
  Step4Location,
  Step5Pricing,
  Step6Image,
  Step7Review,
} from '@/components/submit';
import type { EventDraftData, SeriesDraftData, EventDraft } from '@/types/submission';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SubmitForm');

// ============================================================================
// TYPES
// ============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SubmitEventFormProps {
  userEmail: string;
  userName?: string;
  userId: string;
  categories: Category[];
  existingDraft?: EventDraft;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SubmitEventForm({
  userEmail,
  userName,
  userId,
  categories,
  existingDraft,
}: SubmitEventFormProps) {
  const router = useRouter();

  // ========== State ==========
  const [draftId, setDraftId] = useState<string | null>(existingDraft?.id || null);
  const [currentStep, setCurrentStep] = useState(existingDraft?.current_step || 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    existingDraft?.completed_steps || []
  );
  const [draftData, setDraftData] = useState<EventDraftData>(
    existingDraft?.draft_data || { source: 'user_submission' }
  );
  const [seriesDraftData, setSeriesDraftData] = useState<SeriesDraftData | null>(
    existingDraft?.series_draft_data || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>(
    existingDraft ? new Date(existingDraft.updated_at) : undefined
  );
  const [error, setError] = useState<string | null>(null);

  // ========== Update Data Helpers ==========
  const updateDraftData = useCallback((updates: Partial<EventDraftData>) => {
    setDraftData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateSeriesDraftData = useCallback((data: SeriesDraftData | null) => {
    setSeriesDraftData(data);
  }, []);

  // ========== Save Draft ==========
  const saveDraft = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const url = draftId ? `/api/submit/draft/${draftId}` : '/api/submit/draft';
      const method = draftId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftData,
          seriesDraftData,
          currentStep,
          completedSteps,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save draft');
      }

      // Update draft ID if this was a new draft
      if (!draftId && result.draft?.id) {
        setDraftId(result.draft.id);
      }

      setLastSaved(new Date());
      logger.success('Draft saved');
    } catch (err) {
      logger.error('Failed to save draft', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [draftId, draftData, seriesDraftData, currentStep, completedSteps, isSaving]);

  // ========== Submit Event ==========
  const submitEvent = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/submit/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          draftData,
          seriesDraftData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit event');
      }

      logger.success(`Event submitted: ${result.eventId}`);

      // Redirect to success page
      router.push(`/submit/success?id=${result.eventId}`);
    } catch (err) {
      logger.error('Failed to submit event', err);
      setError(err instanceof Error ? err.message : 'Failed to submit event');
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, draftData, seriesDraftData, router]);

  // ========== Series Search ==========
  const searchSeries = useCallback(async (query: string) => {
    try {
      const response = await fetch(`/api/submit/series/search?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      return result.success ? result.series : [];
    } catch {
      return [];
    }
  }, []);

  // ========== Venue Search (placeholder) ==========
  const searchVenues = useCallback(async (query: string) => {
    // TODO: Implement actual venue search
    return [];
  }, []);

  // ========== Render Current Step ==========
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            draftData={draftData}
            updateData={updateDraftData}
            categories={categories}
          />
        );
      case 2:
        return (
          <Step2EventType
            draftData={draftData}
            updateData={updateDraftData}
            seriesDraftData={seriesDraftData}
            updateSeriesData={updateSeriesDraftData}
            searchSeries={searchSeries}
          />
        );
      case 3:
        return (
          <Step3DateTime
            draftData={draftData}
            updateData={updateDraftData}
          />
        );
      case 4:
        return (
          <Step4Location
            draftData={draftData}
            updateData={updateDraftData}
            venues={[]}
            onSearchVenues={searchVenues}
          />
        );
      case 5:
        return (
          <Step5Pricing
            draftData={draftData}
            updateData={updateDraftData}
          />
        );
      case 6:
        return (
          <Step6Image
            draftData={draftData}
            updateData={updateDraftData}
          />
        );
      case 7:
        return (
          <Step7Review
            draftData={draftData}
            seriesDraftData={seriesDraftData}
            categories={categories}
            onEditStep={(step) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm text-red-600 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <FormWrapper
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        draftData={draftData}
        setDraftData={setDraftData}
        seriesDraftData={seriesDraftData}
        setSeriesDraftData={setSeriesDraftData}
        completedSteps={completedSteps}
        setCompletedSteps={setCompletedSteps}
        onSave={saveDraft}
        onSubmit={submitEvent}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        lastSaved={lastSaved}
      >
        {renderStep()}
      </FormWrapper>
    </>
  );
}
