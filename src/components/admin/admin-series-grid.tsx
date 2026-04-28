'use client';

/**
 * ADMIN SERIES GRID
 * ==================
 * Interactive series card grid with bulk selection, delete, and merge.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trash2,
  Merge,
  Calendar,
  MapPin,
  Users,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminSeriesCard } from '@/data/admin/get-admin-series';

const TYPE_COLORS: Record<string, string> = {
  recurring: 'bg-indigo-100 text-indigo-700',
  class: 'bg-emerald-100 text-emerald-700',
  camp: 'bg-amber-100 text-amber-700',
  workshop: 'bg-violet-100 text-violet-700',
  festival: 'bg-pink-100 text-pink-700',
  season: 'bg-blue-100 text-blue-700',
};

interface AdminSeriesGridProps {
  series: AdminSeriesCard[];
}

type BulkAction = null | 'delete' | 'merge';
type DeleteMode = 'detach' | 'delete_events';

export function AdminSeriesGrid({ series }: AdminSeriesGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('detach');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        timeZone: 'America/Chicago',
      }).format(new Date(d));
    } catch {
      return d;
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(series.map(s => s.id)));
  }, [series]);

  const selectNone = useCallback(() => {
    setSelected(new Set());
    setBulkAction(null);
    setMergeTargetId(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);

    const totalEvents = series
      .filter(s => ids.includes(s.id))
      .reduce((sum, s) => sum + s.event_count, 0);

    const willDeleteEvents = deleteMode === 'delete_events';
    const confirmMsg = willDeleteEvents
      ? `Delete ${ids.length} series AND ${totalEvents} enclosed events? This cannot be undone.`
      : `Delete ${ids.length} series? ${totalEvents} events will be detached (kept as standalone).`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/superadmin/series/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesIds: ids, deleteEvents: willDeleteEvents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setActionMessage({ type: 'success', text: data.message });
      setSelected(new Set());
      setBulkAction(null);
      router.refresh();
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' });
    } finally {
      setActionLoading(false);
    }
  }, [selected, series, deleteMode, router]);

  const handleMerge = useCallback(async () => {
    if (!mergeTargetId || selected.size < 2) return;
    const sourceIds = Array.from(selected).filter(id => id !== mergeTargetId);

    if (sourceIds.length === 0) {
      setActionMessage({ type: 'error', text: 'Select at least 2 series to merge' });
      return;
    }

    const targetTitle = series.find(s => s.id === mergeTargetId)?.title || 'Unknown';
    if (!confirm(`Merge ${sourceIds.length} series into "${targetTitle}"? Events will be moved to the target. Source series will be cancelled.`)) return;

    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/superadmin/series/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSeriesId: mergeTargetId, sourceSeriesIds: sourceIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Merge failed');

      setActionMessage({ type: 'success', text: data.message });
      setSelected(new Set());
      setBulkAction(null);
      setMergeTargetId(null);
      router.refresh();
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Merge failed' });
    } finally {
      setActionLoading(false);
    }
  }, [mergeTargetId, selected, series, router]);

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 bg-ink text-pure rounded-xl p-3 mb-4 flex items-center gap-3 shadow-lg">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <button onClick={selectAll} className="text-xs text-white/60 hover:text-white underline underline-offset-2">
            All
          </button>
          <button onClick={selectNone} className="text-xs text-white/60 hover:text-white underline underline-offset-2">
            None
          </button>

          <div className="flex-1" />

          {bulkAction === null && (
            <>
              <Button
                size="sm"
                onClick={() => setBulkAction('delete')}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
              {selected.size >= 2 && (
                <Button
                  size="sm"
                  onClick={() => setBulkAction('merge')}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <Merge className="w-3.5 h-3.5 mr-1.5" />
                  Merge
                </Button>
              )}
            </>
          )}

          {bulkAction === 'delete' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setDeleteMode('detach')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    deleteMode === 'detach' ? 'bg-white/20 text-white font-medium' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Keep events
                </button>
                <button
                  onClick={() => setDeleteMode('delete_events')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    deleteMode === 'delete_events' ? 'bg-red-500/80 text-white font-medium' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Delete events too
                </button>
              </div>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={actionLoading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                Confirm Delete
              </Button>
              <button onClick={() => setBulkAction(null)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {bulkAction === 'merge' && (
            <div className="flex items-center gap-2">
              {!mergeTargetId ? (
                <span className="text-xs text-indigo-300">
                  Click a selected series card below to choose the merge target
                </span>
              ) : (
                <>
                  <span className="text-xs text-indigo-300">
                    Merging {selected.size - 1} into &ldquo;{series.find(s => s.id === mergeTargetId)?.title}&rdquo;
                  </span>
                  <Button
                    size="sm"
                    onClick={handleMerge}
                    disabled={actionLoading}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Merge className="w-3.5 h-3.5 mr-1.5" />}
                    Confirm Merge
                  </Button>
                </>
              )}
              <button onClick={() => { setBulkAction(null); setMergeTargetId(null); }} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action feedback */}
      {actionMessage && (
        <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg text-sm ${
          actionMessage.type === 'success'
            ? 'bg-emerald/10 text-emerald border border-sage/20'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {actionMessage.text}
          <button onClick={() => setActionMessage(null)} className="ml-auto opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Series grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {series.map(s => {
          const isSelected = selected.has(s.id);
          const isMergeTarget = mergeTargetId === s.id;

          return (
            <div
              key={s.id}
              className={`relative bg-pure border rounded-xl p-4 transition-all ${
                isMergeTarget
                  ? 'border-indigo-400 ring-2 ring-indigo-200 shadow-lg'
                  : isSelected
                  ? 'border-blue ring-1 ring-blue/30'
                  : 'border-mist hover:shadow-card-lifted hover:-translate-y-0.5'
              }`}
            >
              {/* Selection checkbox */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (bulkAction === 'merge' && isSelected) {
                    // In merge mode, clicking a selected card sets it as target
                    setMergeTargetId(s.id === mergeTargetId ? null : s.id);
                  } else {
                    toggleSelect(s.id);
                  }
                }}
                className={`absolute top-3 right-3 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors z-10 ${
                  isMergeTarget
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : isSelected
                    ? 'bg-blue border-blue text-white'
                    : 'border-mist hover:border-stone bg-white'
                }`}
              >
                {isMergeTarget ? (
                  <span className="text-[9px] font-bold">T</span>
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5" />
                ) : null}
              </button>

              {/* Merge target label */}
              {isMergeTarget && (
                <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">
                  MERGE TARGET
                </div>
              )}

              {/* Card content — clickable to edit page */}
              <Link href={`/admin/series/${s.id}/edit`} className="block group">
                {/* Header */}
                <div className="flex items-start justify-between mb-2 pr-8">
                  <h3 className="font-medium text-ink group-hover:text-blue transition-colors line-clamp-2 flex-1 mr-2">
                    {s.title}
                  </h3>
                  <Badge className={TYPE_COLORS[s.series_type] || 'bg-stone/10 text-zinc'}>
                    {s.series_type}
                  </Badge>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc mb-3">
                  {s.organizer_name && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {s.organizer_name}
                    </span>
                  )}
                  {s.location_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {s.location_name}
                    </span>
                  )}
                  {s.category_name && (
                    <span>{s.category_name}</span>
                  )}
                </div>

                {/* Date range. Open-ended series show "scheduled thru" so
                    the end date doesn't read as a hard end — see
                    lib/series/date-display.ts. */}
                {(s.start_date || s.end_date) && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc mb-3">
                    <Calendar className="w-3 h-3" />
                    {s.is_open_ended ? (
                      <>
                        From {formatDate(s.start_date)}
                        {s.end_date && s.start_date !== s.end_date && (
                          <> · scheduled thru {formatDate(s.end_date)}</>
                        )}
                      </>
                    ) : (
                      <>
                        {formatDate(s.start_date)}
                        {s.end_date && s.start_date !== s.end_date && (
                          <> &ndash; {formatDate(s.end_date)}</>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 pt-2 border-t border-mist/50">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'published'
                      ? 'bg-emerald/10 text-emerald'
                      : s.status === 'pending_review'
                      ? 'bg-amber-50 text-amber-600'
                      : s.status === 'cancelled'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-stone/10 text-zinc'
                  }`}>
                    {s.status}
                  </span>
                  <span className="text-[11px] text-zinc">
                    {s.event_count} event{s.event_count !== 1 ? 's' : ''}
                  </span>
                  {s.total_sessions && (
                    <span className="text-[11px] text-zinc">
                      {s.total_sessions} sessions
                    </span>
                  )}
                  {(s.age_low != null || s.age_high != null) && (
                    <span className="text-[11px] text-zinc ml-auto">
                      Ages {s.age_low ?? '?'}&ndash;{s.age_high ?? '?'}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
