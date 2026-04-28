'use client';

/**
 * SUPERADMIN EVENT EDIT FORM (orchestrator)
 * ==========================================
 * Thin composition layer over the per-section components in ./sections/*
 * and the shared admin form-shell primitives. Owns:
 *
 *   - FormState (init from event, updated by sections)
 *   - selectedVenue / selectedOrganizer (diffed against location_id /
 *     organizer_id at save time)
 *   - notes / occurrenceScope / status banner state
 *   - delete-confirm modal state
 *   - dirty diff (drives TOC dots, "What changed" sidebar, save count)
 *
 * Visual chrome:
 *   - <CommandBar> (sticky top) with status select, Re-fetch, Save
 *   - <HeroCard> with image, title, key facts, category footer
 *   - <QuickChecklist> publish-readiness row
 *   - <SectionTOC> left rail
 *   - <FormSection> per section, composed in EVENT_FORM_SECTIONS order
 *   - <WhatChangedCard> sidebar diff
 *
 * Save logic: extracted to ./save-event-changes.ts.
 * Section JSX: extracted to ./sections/*.
 *
 * @module components/superadmin/event-edit-form
 */
import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { formatMKEPattern } from '@/lib/utils/dates';
import { Button } from '@/components/ui/button';
import {
  CommandBar,
  CommandBarStatusSelect,
  HeroCard,
  FormSection,
  InlineEditText,
  QuickChecklist,
  SectionTOC,
  StatusPill,
  WhatChangedCard,
  CompactToggle,
  useEditMode,
} from '@/components/admin/form-shell';
import { ShapeBadge } from '@/components/admin/shape-badge';
import { EVENT_FORM_SECTIONS } from '@/lib/constants/admin-form-sections';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { useFormDirtyState } from '@/lib/admin/use-form-dirty-state';
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard';
import type { AdminEventDetails } from '@/data/admin/get-admin-event';
import type {
  FormState,
  FormStatus,
  OccurrenceScope,
  VenueSearchResult,
  OrganizerSearchResult,
} from './helpers';
import { useHeuristicEvent } from './use-heuristic-event';
import { RecheckSection } from './recheck-section';
import { DeleteConfirmModal } from './delete-confirm-modal';
import { deriveInitialFormState } from './initial-form-state';
import { saveEventChanges } from './save-event-changes';
import { EVENT_FORM_DIRTY_SPEC } from './dirty-spec';
import { deriveEventChecklist } from './derive-checklist';
import { buildSectionRenderers } from './section-renderers';

interface EventEditFormProps {
  event: AdminEventDetails;
  categories?: { id: string; name: string; slug: string; icon: string | null }[];
  onSuccess?: () => void;
}

export function SuperadminEventEditForm({
  event,
  categories = [],
  onSuccess,
}: EventEditFormProps) {
  const router = useRouter();

  // Original snapshot (the dirty-diff baseline). Held in state, not a ref,
  // so resetting it after a save triggers a re-render and the dirty count
  // updates immediately. The page wrapper passes a fresh `event` prop on
  // router.refresh() and re-keys the form so the baseline always matches.
  const [originalState, setOriginalState] = useState<FormState>(() =>
    deriveInitialFormState(event),
  );
  const [formState, setFormState] = useState<FormState>(() =>
    deriveInitialFormState(event),
  );

  const heuristicEvent = useHeuristicEvent(event, formState);

  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [justDeleted, setJustDeleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [occurrenceScope, setOccurrenceScope] = useState<OccurrenceScope>('single');
  const [editMode, setEditMode] = useEditMode();

  const [selectedVenue, setSelectedVenue] = useState<VenueSearchResult | null>(
    event.location
      ? {
          id: event.location.id,
          name: event.location.name,
          address_line: event.location.address_line,
          city: event.location.city,
          state: event.location.state,
          venue_type: event.location.venue_type,
          category: null,
          rating: null,
          review_count: 0,
          latitude: null,
          longitude: null,
        }
      : null,
  );
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerSearchResult | null>(
    event.organizer
      ? {
          id: event.organizer.id,
          name: event.organizer.name,
          slug: event.organizer.slug,
          logo_url: event.organizer.logo_url,
          website_url: event.organizer.website_url,
          description: null,
        }
      : null,
  );

  const resetStatus = useCallback(() => {
    setStatus((s) => (s === 'saved' || s === 'error' ? 'idle' : s));
  }, []);

  // ============================================================================
  // DIRTY DIFF
  // ============================================================================

  const dirty = useFormDirtyState(formState, originalState, EVENT_FORM_DIRTY_SPEC);

  // Venue and organizer changes aren't part of FormState (the picker components
  // own their own state) — overlay them onto the section dirty map manually.
  const venueDirty = (selectedVenue?.id || null) !== (event.location_id || null);
  const organizerDirty = (selectedOrganizer?.id || null) !== (event.organizer_id || null);
  const dirtyBySection = useMemo(() => {
    const next = { ...dirty.bySection };
    if (venueDirty) next.where = true;
    if (organizerDirty) next.who = true;
    return next;
  }, [dirty.bySection, venueDirty, organizerDirty]);

  const totalDirtyCount = dirty.count + (venueDirty ? 1 : 0) + (organizerDirty ? 1 : 0);

  useUnsavedChangesGuard(totalDirtyCount > 0 && !justDeleted);

  // ============================================================================
  // CHECKLIST
  // ============================================================================

  const checklist = useMemo(
    () => deriveEventChecklist(formState, !!selectedVenue),
    [formState, selectedVenue],
  );

  // ============================================================================
  // SAVE / DELETE / RESTORE
  // ============================================================================

  const handleSave = async () => {
    setStatus('saving');
    setStatusMessage('Saving changes…');
    try {
      const outcome = await saveEventChanges({
        event,
        formState,
        selectedVenue,
        selectedOrganizer,
        notes,
        occurrenceScope,
      });
      if (outcome.noChanges) {
        setStatus('idle');
        setStatusMessage('No changes to save');
        return;
      }
      setStatus('saved');
      setStatusMessage(
        outcome.appliedToSeries
          ? `Saved · applied to ${occurrenceScope === 'all' ? 'all' : 'this and future'} occurrences`
          : 'Saved',
      );
      setNotes('');
      // Reset dirty baseline so subsequent edits compare against the new saved state.
      // State (not ref) so the dirty count clears immediately on success.
      setOriginalState(formState);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error('Save error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save changes');
    }
  };

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      setStatusMessage('Please provide a reason for deletion');
      return;
    }
    setStatus('saving');
    setStatusMessage('Deleting event…');
    try {
      const res = await fetch(`/api/superadmin/events/${event.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason, hardDelete: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete event');
      }
      setStatus('saved');
      setStatusMessage('Event deleted');
      setShowDeleteConfirm(false);
      setJustDeleted(true);
      setTimeout(() => router.push('/admin/events'), 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  const handleRestore = async () => {
    setStatus('saving');
    setStatusMessage('Restoring event…');
    try {
      const res = await fetch(`/api/superadmin/events/${event.id}/restore`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to restore event');
      }
      setStatus('saved');
      setStatusMessage('Event restored');
      router.refresh();
    } catch (error) {
      console.error('Restore error:', error);
      setStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to restore event');
    }
  };

  // ============================================================================
  // DERIVED VIEW STATE
  // ============================================================================

  const isDeleted = !!event.deleted_at;
  const childEventCount = (() => {
    const raw = (event as { child_count?: { count: number }[] | null }).child_count;
    return raw?.[0]?.count ?? 0;
  })();
  const initialParentEvent = ((event as { parent_event?: { id: string; title: string; slug: string } | null }).parent_event) ?? null;

  const accentHex = getCategoryColor(event.category?.slug ?? null).accent;
  const startLabel = event.start_datetime
    ? formatMKEPattern(event.start_datetime, "EEE · MMM d · h:mm a 'CT'")
    : 'No date set';

  // Build the section components in catalog order. Extracted to
  // section-renderers.tsx so the orchestrator stays focused on state.
  const sectionRenderers = buildSectionRenderers({
    event,
    categories,
    formState,
    setFormState,
    resetStatus,
    heuristicEvent,
    selectedVenue,
    setSelectedVenue,
    selectedOrganizer,
    setSelectedOrganizer,
    notes,
    setNotes,
    occurrenceScope,
    setOccurrenceScope,
    childEventCount,
    initialParentEvent,
    isDeleted,
    isSubmitting: status === 'saving',
    onRequestDelete: () => setShowDeleteConfirm(true),
    onRestore: handleRestore,
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  const showFullForm = editMode === 'full';

  return (
    <div className="bg-white min-h-screen">
      <CommandBar
        backHref={`/admin/events/${event.id}`}
        backLabel="Back to review"
        title={event.title || 'Untitled event'}
        badges={
          <>
            <ShapeBadge
              seriesId={event.series_id}
              parentEventId={formState.parent_event_id || null}
              childEventCount={childEventCount}
              hours={formState.hours}
              compact
            />
            <StatusPill status={formState.status} compact />
          </>
        }
        actions={
          <>
            <CompactToggle value={editMode} onChange={setEditMode} />
            {event.slug && (
              <Button
                variant="ghost"
                size="sm"
                href={`/event/${event.slug}`}
                external
                className="gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Preview</span>
              </Button>
            )}
            <CommandBarStatusSelect
              value={formState.status}
              onChange={(s) => {
                setFormState((p) => ({ ...p, status: s }));
                resetStatus();
              }}
              disabled={status === 'saving'}
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={status === 'saving' || (!totalDirtyCount && status !== 'error')}
              className="gap-1.5 bg-blue hover:bg-blue/90 text-white"
            >
              <Save className="w-3.5 h-3.5" />
              {status === 'saving'
                ? 'Saving…'
                : totalDirtyCount > 0
                ? `Save (${totalDirtyCount})`
                : 'Save'}
            </Button>
          </>
        }
      />

      <div className="px-6 py-6 space-y-5 max-w-7xl mx-auto">
        {justDeleted && (
          <div className="rounded-xl border-2 border-rose/40 bg-rose/5 p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trash2 className="w-6 h-6 text-rose" />
              <h3 className="text-xl text-rose font-bold">Event deleted</h3>
            </div>
            <p className="text-rose/80 text-sm">
              &quot;{event.title}&quot; has been removed. Redirecting…
            </p>
          </div>
        )}

        {!isDeleted && !justDeleted && (
          <RecheckSection eventId={event.id} sourceUrl={event.source_url} />
        )}

        {isDeleted && !justDeleted && (
          <div className="rounded-lg border border-rose/30 bg-rose/5 p-3 flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-rose shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose">This event is deleted</p>
              <p className="text-xs text-zinc">
                Hidden from public and admin lists. Restore it from the Danger zone.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestore}
              disabled={status === 'saving'}
              className="text-xs font-medium text-rose underline-offset-2 hover:underline"
            >
              Restore
            </button>
          </div>
        )}

        {status !== 'idle' && !justDeleted && (
          <div
            className={`p-3 rounded-lg flex items-center gap-3 text-sm ${
              status === 'saving'
                ? 'bg-golden/10 text-amber border border-golden/30'
                : status === 'saved'
                ? 'bg-emerald/10 text-emerald border border-emerald/30'
                : 'bg-rose/10 text-rose border border-rose/30'
            }`}
          >
            {status === 'saving' && <Clock className="w-4 h-4 animate-spin" />}
            {status === 'saved' && <CheckCircle className="w-4 h-4" />}
            {status === 'error' && <AlertTriangle className="w-4 h-4" />}
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        <HeroCard
          accentHex={accentHex}
          imageUrl={formState.image_url || null}
          imageAlt={event.title}
          badges={
            <>
              <ShapeBadge
                seriesId={event.series_id}
                parentEventId={formState.parent_event_id || null}
                childEventCount={childEventCount}
                hours={formState.hours}
              />
              <StatusPill status={formState.status} />
            </>
          }
          title={
            <InlineEditText
              value={formState.title}
              onSave={(next) => {
                setFormState((p) => ({ ...p, title: next }));
                resetStatus();
              }}
              emptyLabel="Untitled event"
            />
          }
          subtitle={
            <>
              <span>{startLabel}</span>
              {selectedVenue && (
                <span>
                  {selectedVenue.name}
                  {selectedVenue.city && ` · ${selectedVenue.city}`}
                </span>
              )}
              {selectedOrganizer && <span>Hosted by {selectedOrganizer.name}</span>}
            </>
          }
          footer={
            event.category && (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentHex }}
                />
                {event.category.name}
              </span>
            )
          }
        />

        <QuickChecklist items={checklist} />

        {showFullForm ? (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-5 items-start">
            <div className="hidden lg:block">
              <SectionTOC
                sections={EVENT_FORM_SECTIONS}
                dirtyBySection={dirtyBySection}
              />
            </div>

            <div className="space-y-4 min-w-0">
              {EVENT_FORM_SECTIONS.map((s) => (
                <FormSection
                  key={s.id}
                  id={s.id}
                  title={s.label}
                  description={s.description}
                  icon={s.icon}
                  accent={s.accent}
                  dirtyCount={
                    s.id === 'where'
                      ? venueDirty
                        ? 1
                        : 0
                      : s.id === 'who'
                      ? organizerDirty
                        ? 1
                        : 0
                      : dirty.countBySection[s.id] ?? 0
                  }
                  defaultOpen={s.defaultOpen}
                  storageScope={event.id}
                >
                  {sectionRenderers[s.id]}
                </FormSection>
              ))}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <WhatChangedCard changes={dirty.changes} />
            </aside>
          </div>
        ) : (
          <div className="rounded-xl border border-mist bg-pure p-4 text-sm text-zinc">
            Compact mode hides everything below the hero. Switch to{' '}
            <button
              type="button"
              onClick={() => setEditMode('full')}
              className="text-blue hover:underline font-medium"
            >
              Full edit
            </button>{' '}
            to access individual fields.
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          eventTitle={event.title}
          deleteReason={deleteReason}
          onReasonChange={setDeleteReason}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          isSubmitting={status === 'saving'}
        />
      )}
    </div>
  );
}
