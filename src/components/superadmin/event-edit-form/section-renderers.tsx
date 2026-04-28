/**
 * Event edit form — section renderer map
 * =========================================
 * Builds the `sectionId → ReactNode` map consumed by the orchestrator's
 * EVENT_FORM_SECTIONS loop. Extracted from index.tsx to keep the
 * orchestrator focused on state and handlers.
 *
 * All section components live in ./sections/* — this file just wires the
 * shared state + per-section props together.
 *
 * @module components/superadmin/event-edit-form/section-renderers
 */
'use client';

import type { ReactNode } from 'react';
import type { AdminEventDetails } from '@/data/admin/get-admin-event';
import {
  AudienceSection,
  BasicsSection,
  DangerSection,
  MoneyLinksSection,
  SeriesCollectionSection,
  SystemSection,
  VibeSection,
  WhenSection,
  WhereSection,
  WhoSection,
} from './sections';
import type {
  FormState,
  OccurrenceScope,
  VenueSearchResult,
  OrganizerSearchResult,
} from './helpers';
import type { useHeuristicEvent } from './use-heuristic-event';

interface BuildArgs {
  event: AdminEventDetails;
  categories: { id: string; name: string; slug: string; icon: string | null }[];
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  resetStatus: () => void;
  heuristicEvent: ReturnType<typeof useHeuristicEvent>;
  selectedVenue: VenueSearchResult | null;
  setSelectedVenue: (next: VenueSearchResult | null) => void;
  selectedOrganizer: OrganizerSearchResult | null;
  setSelectedOrganizer: (next: OrganizerSearchResult | null) => void;
  notes: string;
  setNotes: (next: string) => void;
  occurrenceScope: OccurrenceScope;
  setOccurrenceScope: (next: OccurrenceScope) => void;
  childEventCount: number;
  initialParentEvent: { id: string; title: string; slug: string } | null;
  isDeleted: boolean;
  isSubmitting: boolean;
  onRequestDelete: () => void;
  onRestore: () => void;
}

export function buildSectionRenderers(args: BuildArgs): Record<string, ReactNode> {
  const {
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
    isSubmitting,
    onRequestDelete,
    onRestore,
  } = args;

  return {
    basics: (
      <BasicsSection
        formState={formState}
        setFormState={setFormState}
        resetStatus={resetStatus}
        heuristicEvent={heuristicEvent}
        eventId={event.id}
        categories={categories}
      />
    ),
    when: (
      <WhenSection
        formState={formState}
        setFormState={setFormState}
        resetStatus={resetStatus}
        heuristicEvent={heuristicEvent}
      />
    ),
    where: (
      <WhereSection
        selectedVenue={selectedVenue}
        onChange={(v) => {
          setSelectedVenue(v);
          resetStatus();
        }}
      />
    ),
    who: (
      <WhoSection
        selectedOrganizer={selectedOrganizer}
        onChange={(o) => {
          setSelectedOrganizer(o);
          resetStatus();
        }}
      />
    ),
    audience: (
      <AudienceSection
        formState={formState}
        setFormState={setFormState}
        resetStatus={resetStatus}
        heuristicEvent={heuristicEvent}
      />
    ),
    vibe: (
      <VibeSection
        formState={formState}
        setFormState={setFormState}
        resetStatus={resetStatus}
        heuristicEvent={heuristicEvent}
      />
    ),
    money: (
      <MoneyLinksSection
        formState={formState}
        setFormState={setFormState}
        resetStatus={resetStatus}
        heuristicEvent={heuristicEvent}
      />
    ),
    series: (
      <SeriesCollectionSection
        formState={formState}
        setFormState={setFormState}
        resetStatus={resetStatus}
        heuristicEvent={heuristicEvent}
        eventId={event.id}
        seriesId={event.series_id}
        seriesSequence={event.series_sequence}
        startDatetime={event.start_datetime}
        occurrenceScope={occurrenceScope}
        setOccurrenceScope={setOccurrenceScope}
        childEventCount={childEventCount}
        initialParentEvent={initialParentEvent}
      />
    ),
    system: (
      <SystemSection
        status={formState.status}
        onStatusChange={(s) => {
          setFormState((p) => ({ ...p, status: s }));
          resetStatus();
        }}
        notes={notes}
        onNotesChange={setNotes}
      />
    ),
    danger: (
      <DangerSection
        isDeleted={isDeleted}
        isSubmitting={isSubmitting}
        onRequestDelete={onRequestDelete}
        onRestore={onRestore}
      />
    ),
  };
}
