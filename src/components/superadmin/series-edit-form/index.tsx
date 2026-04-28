'use client';

/**
 * SUPERADMIN SERIES EDIT FORM (orchestrator)
 * ============================================
 * Tabbed shell: Details / Recurrence / Events / Danger zone. Each tab
 * owns its own primary action (Save / Save recurrence / Add+remove
 * events / Cancel+delete) — the series page is structurally different
 * from a single event form because the surfaces touch different APIs.
 *
 * Replaces the prior 691-line series-edit-form.tsx + the in-page sidebar
 * stack (SeriesEventManager, SeriesDangerZone) that previously sat below
 * the form.
 *
 * @module components/superadmin/series-edit-form
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandBar,
  HeroCard,
  InlineEditText,
  StatusPill,
  TabBar,
  WhatChangedCard,
} from '@/components/admin/form-shell';
import { ShapeBadge } from '@/components/admin/shape-badge';
import { SERIES_FORM_TABS } from '@/lib/constants/admin-form-sections';
import { useFormDirtyState } from '@/lib/admin/use-form-dirty-state';
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard';
import type { SeriesRow } from '@/types/series';
import type { RecurrenceRule } from '@/lib/supabase/types';
import {
  deriveInitialSeriesFormState,
  type SeriesFormState,
  type SeriesFormStatus,
} from './helpers';
import { saveSeriesChanges } from './save-series-changes';
import { SERIES_FORM_DIRTY_SPEC } from './dirty-spec';
import { DetailsTab, RecurrenceTab, EventsTab, DangerTab } from './tabs';

interface Props {
  series: SeriesRow;
  totalEventsCount: number;
  activeEventsCount: number;
}

export function SuperadminSeriesEditForm({
  series,
  totalEventsCount,
  activeEventsCount,
}: Props) {
  const router = useRouter();

  // State, not ref, so dirty count clears immediately on save success. The
  // page re-keys this form on event prop change so the baseline always
  // matches the freshly-fetched record.
  const [originalState, setOriginalState] = useState<SeriesFormState>(() =>
    deriveInitialSeriesFormState(series),
  );
  const [formState, setFormState] = useState<SeriesFormState>(() =>
    deriveInitialSeriesFormState(series),
  );
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<string>('details');
  const [status, setStatus] = useState<SeriesFormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const dirty = useFormDirtyState(formState, originalState, SERIES_FORM_DIRTY_SPEC);
  useUnsavedChangesGuard(dirty.isDirty);

  const handleDetailsSave = async () => {
    setStatus('saving');
    setStatusMessage('Saving changes…');
    try {
      const outcome = await saveSeriesChanges({ series, formState, notes });
      if (outcome.noChanges) {
        setStatus('idle');
        setStatusMessage('No changes to save');
        return;
      }
      setStatus('saved');
      setStatusMessage('Saved');
      setNotes('');
      setOriginalState(formState);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const seriesAccent = useMemo(
    () => seriesAccentForType(series.series_type),
    [series.series_type],
  );

  const dirtyByTab = useMemo<Record<string, boolean>>(
    () => ({ ...dirty.bySection, details: dirty.bySection.details ?? false }),
    [dirty.bySection],
  );

  return (
    <div className="bg-white min-h-screen">
      <CommandBar
        backHref={`/series/${series.slug}`}
        backLabel="Back to series"
        title={series.title || 'Untitled series'}
        badges={
          <>
            <ShapeBadge
              seriesId={series.id}
              parentEventId={null}
              childEventCount={0}
              hours={null}
              compact
            />
            <StatusPill status={formState.status} compact />
          </>
        }
        actions={
          series.slug && (
            <Button
              variant="ghost"
              size="sm"
              href={`/series/${series.slug}`}
              external
              className="gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Preview</span>
            </Button>
          )
        }
      />

      <div className="px-6 py-6 space-y-5 max-w-7xl mx-auto">
        {status !== 'idle' && (
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
          accentHex={seriesAccent}
          imageUrl={formState.image_url || null}
          imageAlt={series.title ?? ''}
          badges={
            <>
              <ShapeBadge
                seriesId={series.id}
                parentEventId={null}
                childEventCount={0}
                hours={null}
              />
              <StatusPill status={formState.status} />
            </>
          }
          title={
            <InlineEditText
              value={formState.title}
              onSave={(next) => {
                setFormState((p) => ({ ...p, title: next }));
                if (status === 'saved' || status === 'error') setStatus('idle');
              }}
              emptyLabel="Untitled series"
            />
          }
          subtitle={
            <>
              <span className="capitalize">{formState.series_type}</span>
              <span>
                {activeEventsCount} active event{activeEventsCount === 1 ? '' : 's'}
                {totalEventsCount > activeEventsCount && (
                  <span className="text-zinc">
                    {' '}
                    · {totalEventsCount - activeEventsCount} cancelled
                  </span>
                )}
              </span>
              {series.recurrence_rule && (
                <span className="text-xs">
                  See Recurrence tab for the schedule pattern.
                </span>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          <div className="min-w-0 space-y-4">
            <TabBar
              tabs={SERIES_FORM_TABS}
              activeId={activeTab}
              onChange={setActiveTab}
              dirtyByTab={dirtyByTab}
            />

            <div
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              className="bg-pure border border-mist rounded-xl p-5 sm:p-6"
            >
              {activeTab === 'details' && (
                <DetailsTab
                  formState={formState}
                  setFormState={setFormState}
                  notes={notes}
                  setNotes={setNotes}
                  onSave={handleDetailsSave}
                  isSaving={status === 'saving'}
                  isDirty={dirty.isDirty}
                  dirtyCount={dirty.count}
                />
              )}
              {activeTab === 'recurrence' && (
                <RecurrenceTab
                  seriesId={series.id}
                  seriesType={series.series_type}
                  currentRule={series.recurrence_rule as RecurrenceRule | null}
                  startDate={series.start_date}
                  onSaved={() => router.refresh()}
                />
              )}
              {activeTab === 'events' && <EventsTab seriesId={series.id} />}
              {activeTab === 'danger' && (
                <DangerTab
                  seriesId={series.id}
                  seriesTitle={series.title ?? 'Untitled series'}
                  seriesStatus={series.status ?? 'draft'}
                  seriesDeleted={
                    !!(series as { deleted_at?: string | null }).deleted_at
                  }
                  totalEventsCount={totalEventsCount}
                  activeEventsCount={activeEventsCount}
                />
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <WhatChangedCard changes={dirty.changes} />
            <div className="rounded-xl border border-mist bg-pure p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc mb-2">
                Series info
              </p>
              <dl className="space-y-1.5 text-sm">
                <Row label="Slug" value={series.slug ?? '—'} />
                <Row label="Type" value={series.series_type ?? '—'} capitalize />
                <Row label="Saved status" value={series.status ?? 'draft'} capitalize />
                {series.total_sessions != null && (
                  <Row label="Sessions" value={String(series.total_sessions)} />
                )}
                <Row label="Active events" value={String(activeEventsCount)} />
                {totalEventsCount > activeEventsCount && (
                  <Row
                    label="Cancelled events"
                    value={String(totalEventsCount - activeEventsCount)}
                  />
                )}
                <Row label="ID" value={series.id.slice(0, 8) + '…'} mono />
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc">{label}</dt>
      <dd
        className={[
          'text-ink truncate text-right',
          mono ? 'font-mono text-xs' : '',
          capitalize ? 'capitalize' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}

/** Map series_type to a soft accent for the hero gradient. */
function seriesAccentForType(seriesType: string | null): string {
  switch (seriesType) {
    case 'class':
    case 'workshop':
      return '#5B4FC4'; // workshops indigo
    case 'recurring':
      return '#5B4FC4';
    case 'festival':
      return '#d48700'; // amber/festivals
    case 'season':
      return '#E85D45';
    case 'camp':
      return '#6BAD5A';
    default:
      return '#008bd2';
  }
}
