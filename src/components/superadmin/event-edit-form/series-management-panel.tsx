/**
 * EVENT EDIT FORM — SERIES MANAGEMENT PANEL
 * ==========================================
 * Owns the Make Recurring / Attach to Existing Series / Detach from Series
 * state machine + handlers. Each handler hits a separate /api/superadmin route:
 *
 *   - POST /api/superadmin/events/[id]/make-recurring
 *   - POST /api/superadmin/events/[id]/attach-series
 *   - POST /api/superadmin/events/[id]/detach-series
 *
 * The `make-recurring` and `attach-series` routes materialize instances; this
 * component just kicks them off and shows status. router.refresh() is delayed
 * 1.5s after success so the user sees the success message before the page
 * re-renders.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/series-management-panel
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecurrenceBuilder } from '../recurrence-builder';
import { RecurrenceNaturalInput } from '../recurrence-natural-input';
import { SeriesSearch } from '../series-search';
import type { RecurrenceRule } from '@/lib/supabase/types';

interface SeriesManagementPanelProps {
  eventId: string;
  seriesId: string | null | undefined;
  seriesSequence: number | null | undefined;
  startDatetime: string | null | undefined;
}

type SeriesPanel = 'idle' | 'make-recurring' | 'attach-series';

export function SeriesManagementPanel({
  eventId,
  seriesId,
  seriesSequence,
  startDatetime,
}: SeriesManagementPanelProps) {
  const router = useRouter();

  const [seriesPanel, setSeriesPanel] = useState<SeriesPanel>('idle');
  const [seriesActionLoading, setSeriesActionLoading] = useState(false);
  const [seriesMessage, setSeriesMessage] = useState('');

  const handleMakeRecurring = async (recurrenceRule: RecurrenceRule) => {
    setSeriesActionLoading(true);
    setSeriesMessage('');
    try {
      const response = await fetch(`/api/superadmin/events/${eventId}/make-recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recurrenceRule }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to make recurring');
      setSeriesMessage(`Created recurring series with ${data.eventCount} events`);
      setSeriesPanel('idle');
      setTimeout(() => router.refresh(), 1500);
    } catch (error) {
      setSeriesMessage(error instanceof Error ? error.message : 'Failed');
    } finally {
      setSeriesActionLoading(false);
    }
  };

  const handleAttachSeries = async (attachSeriesId: string, seriesTitle: string) => {
    setSeriesActionLoading(true);
    setSeriesMessage('');
    try {
      const response = await fetch(`/api/superadmin/events/${eventId}/attach-series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId: attachSeriesId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to attach');
      const generated = data.eventsGenerated ?? 0;
      setSeriesMessage(
        generated > 0
          ? `Attached to "${seriesTitle}" · generated ${generated} future instances`
          : `Attached to "${seriesTitle}"`
      );
      setSeriesPanel('idle');
      setTimeout(() => router.refresh(), 1500);
    } catch (error) {
      setSeriesMessage(error instanceof Error ? error.message : 'Failed');
    } finally {
      setSeriesActionLoading(false);
    }
  };

  const handleDetachSeries = async () => {
    setSeriesActionLoading(true);
    setSeriesMessage('');
    try {
      const response = await fetch(`/api/superadmin/events/${eventId}/detach-series`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to detach');
      setSeriesMessage('Event detached from series');
      setTimeout(() => router.refresh(), 1500);
    } catch (error) {
      setSeriesMessage(error instanceof Error ? error.message : 'Failed');
    } finally {
      setSeriesActionLoading(false);
    }
  };

  return (
    <>
      {/* Series status message */}
      {seriesMessage && (
        <div className={`p-3 rounded-lg text-sm ${
          seriesMessage.includes('Failed') || seriesMessage.includes('Error')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-emerald/10 text-emerald border border-sage/20'
        }`}>
          {seriesMessage}
        </div>
      )}

      {/* Standalone event — offer to make recurring or attach to series */}
      {!seriesId && (
        <div className="p-4 bg-stone/5 border border-mist rounded-lg">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-zinc mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Standalone Event</p>
              <p className="text-sm text-zinc mt-0.5">
                This event is not part of a series.
              </p>

              {seriesPanel === 'idle' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setSeriesPanel('make-recurring'); setSeriesMessage(''); }}
                  >
                    Make Recurring
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setSeriesPanel('attach-series'); setSeriesMessage(''); }}
                  >
                    Add to Existing Series
                  </Button>
                </div>
              )}

              {seriesPanel === 'make-recurring' && (
                <div className="mt-3 space-y-3">
                  <RecurrenceNaturalInput
                    startDate={startDatetime?.split('T')[0] || null}
                    defaultTime={startDatetime?.split('T')[1]?.substring(0, 5) || null}
                    onParsed={({ rule }) => handleMakeRecurring(rule)}
                  />
                  <div className="text-xs text-zinc text-center">
                    — or fill in the structured form below —
                  </div>
                  <RecurrenceBuilder
                    firstDate={startDatetime?.split('T')[0] || new Date().toISOString().split('T')[0]}
                    defaultTime={startDatetime?.split('T')[1]?.substring(0, 5) || '19:00'}
                    onSubmit={handleMakeRecurring}
                    onCancel={() => setSeriesPanel('idle')}
                    isSubmitting={seriesActionLoading}
                  />
                </div>
              )}

              {seriesPanel === 'attach-series' && (
                <div className="mt-3">
                  <SeriesSearch
                    onSelect={handleAttachSeries}
                    onCancel={() => setSeriesPanel('idle')}
                    isSubmitting={seriesActionLoading}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event in a series — show series info + detach option */}
      {seriesId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-800">Part of a Series</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDetachSeries}
                  disabled={seriesActionLoading}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                >
                  {seriesActionLoading ? 'Detaching...' : 'Remove from Series'}
                </Button>
              </div>
              <p className="text-sm text-blue-700 mt-0.5">
                Series ID: {seriesId}
                {seriesSequence != null && ` · Instance #${seriesSequence}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
