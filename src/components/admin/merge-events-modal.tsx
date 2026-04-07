'use client';

/**
 * MERGE EVENTS MODAL
 * ===================
 * Multi-step modal for merging duplicate events with AI assistance.
 *
 * Steps:
 *   1. Review: shows selected events, triggers AI merge preview
 *   2. Edit: shows AI suggestion with editable fields, choose primary
 *   3. Confirm: summary + commit
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminEventCard } from '@/data/admin';

interface MergeEventsModalProps {
  events: AdminEventCard[];
  onClose: () => void;
}

type Step = 'review' | 'edit' | 'confirm' | 'executing' | 'done' | 'error';

interface MergedFields {
  title: string;
  description: string | null;
  short_description: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  category_id: string | null;
  location_id: string | null;
  organizer_id: string | null;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  price_details: string | null;
  ticket_url: string | null;
  website_url: string | null;
  registration_url: string | null;
  image_url: string | null;
  recommended_primary_id: string;
  reasoning: string;
}

export function MergeEventsModal({ events, onClose }: MergeEventsModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('review');
  const [useAi, setUseAi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [merged, setMerged] = useState<MergedFields | null>(null);
  const [primaryId, setPrimaryId] = useState<string>(events[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  // Editable overrides
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const formatDate = (dt: string | null) => {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dt;
    }
  };

  const runAiPreview = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/superadmin/events/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds: events.map(e => e.id),
          useAi: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI preview failed');

      setMerged(data.suggestion);
      setPrimaryId(data.suggestion.recommended_primary_id || events[0].id);
      setEditTitle(data.suggestion.title || events[0].title);
      setEditDescription(data.suggestion.description || '');
      setStep('edit');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to get AI suggestion');
    } finally {
      setLoading(false);
    }
  }, [events]);

  const skipAi = useCallback(() => {
    // Use first event's fields as default
    const first = events[0];
    setPrimaryId(first.id);
    setEditTitle(first.title);
    setEditDescription(first.description || '');
    setMerged(null);
    setStep('edit');
  }, [events]);

  const commitMerge = useCallback(async () => {
    setStep('executing');
    try {
      const mergedFields: Record<string, unknown> = {
        title: editTitle,
        description: editDescription || null,
      };

      // If AI suggested other fields, include them
      if (merged) {
        if (merged.start_datetime) mergedFields.start_datetime = merged.start_datetime;
        if (merged.end_datetime) mergedFields.end_datetime = merged.end_datetime;
        if (merged.category_id) mergedFields.category_id = merged.category_id;
        if (merged.location_id) mergedFields.location_id = merged.location_id;
        if (merged.organizer_id) mergedFields.organizer_id = merged.organizer_id;
        if (merged.price_type) mergedFields.price_type = merged.price_type;
        if (merged.price_low != null) mergedFields.price_low = merged.price_low;
        if (merged.price_high != null) mergedFields.price_high = merged.price_high;
        if (merged.price_details) mergedFields.price_details = merged.price_details;
        if (merged.ticket_url) mergedFields.ticket_url = merged.ticket_url;
        if (merged.website_url) mergedFields.website_url = merged.website_url;
        if (merged.registration_url) mergedFields.registration_url = merged.registration_url;
        if (merged.image_url) mergedFields.image_url = merged.image_url;
      }

      const res = await fetch('/api/superadmin/events/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds: events.map(e => e.id),
          primaryEventId: primaryId,
          mergedFields,
          useAi: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Merge failed');

      setResultMessage(data.message);
      setStep('done');
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Merge failed');
      setStep('error');
    }
  }, [events, primaryId, editTitle, editDescription, merged, onClose, router]);

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-warm-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sand">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-coral" />
            <h2 className="font-display text-xl text-charcoal">
              Merge {events.length} Events
            </h2>
          </div>
          <button onClick={onClose} className="text-stone hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step 1: Review */}
          {step === 'review' && (
            <>
              <p className="text-sm text-stone mb-4">
                Select events to merge into a single event. AI can help pick the best fields.
              </p>

              {/* Event list */}
              <div className="space-y-2 mb-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 bg-cream rounded-lg border border-sand"
                  >
                    {event.thumbnail_url ? (
                      <img src={event.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-sand" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal truncate">{event.title}</p>
                      <p className="text-xs text-stone">
                        {formatDate(event.start_datetime)} · {event.location_name || 'No location'} · {event.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI toggle */}
              <label className="flex items-center gap-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  className="w-4 h-4 rounded border-sand text-coral focus:ring-coral"
                />
                <Sparkles className="w-4 h-4 text-coral" />
                <span className="text-sm text-charcoal">Use AI to pick the best fields</span>
              </label>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={useAi ? runAiPreview : skipAi}
                  disabled={loading}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Analyzing...</>
                  ) : useAi ? (
                    <><Sparkles className="w-4 h-4 mr-2" />Analyze with AI</>
                  ) : (
                    <><ChevronRight className="w-4 h-4 mr-2" />Continue</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Edit merged fields */}
          {step === 'edit' && (
            <>
              {merged?.reasoning && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{merged.reasoning}</span>
                </div>
              )}

              {/* Primary event selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Keep this event (primary):
                </label>
                <div className="space-y-1">
                  {events.map((event) => (
                    <label
                      key={event.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        primaryId === event.id ? 'bg-coral/10 border border-coral' : 'bg-cream border border-transparent hover:border-sand'
                      }`}
                    >
                      <input
                        type="radio"
                        name="primary"
                        value={event.id}
                        checked={primaryId === event.id}
                        onChange={() => setPrimaryId(event.id)}
                        className="text-coral focus:ring-coral"
                      />
                      <Star className={`w-3.5 h-3.5 ${primaryId === event.id ? 'text-coral' : 'text-stone'}`} />
                      <span className="text-sm text-charcoal truncate">{event.title}</span>
                      <span className="text-xs text-stone ml-auto">{event.source}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Editable title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm"
                />
              </div>

              {/* Editable description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none text-sm resize-none"
                />
              </div>

              {/* AI-picked fields summary */}
              {merged && (
                <div className="mb-4 p-3 bg-cream rounded-lg border border-sand">
                  <p className="text-xs font-medium text-stone mb-2 uppercase tracking-wide">
                    AI-selected fields (auto-applied)
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-charcoal">
                    {merged.start_datetime && (
                      <div><span className="text-stone">Date:</span> {formatDate(merged.start_datetime)}</div>
                    )}
                    {merged.price_type && (
                      <div><span className="text-stone">Price:</span> {merged.price_type}{merged.price_low != null ? ` $${merged.price_low}` : ''}</div>
                    )}
                    {merged.ticket_url && (
                      <div className="col-span-2 truncate"><span className="text-stone">Ticket:</span> {merged.ticket_url}</div>
                    )}
                    {merged.website_url && (
                      <div className="col-span-2 truncate"><span className="text-stone">Website:</span> {merged.website_url}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep('review')}>
                  <ChevronLeft className="w-4 h-4 mr-1" />Back
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={!editTitle.trim()}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  Review Merge<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <>
              <div className="mb-4 p-4 bg-cream rounded-lg border border-sand">
                <h3 className="font-medium text-charcoal mb-2">Merge Summary</h3>
                <ul className="text-sm text-charcoal space-y-1">
                  <li>
                    <span className="text-sage font-medium">Keep:</span>{' '}
                    &quot;{editTitle}&quot; ({events.find(e => e.id === primaryId)?.source || 'unknown'})
                  </li>
                  <li>
                    <span className="text-red-600 font-medium">Soft-delete:</span>{' '}
                    {events.filter(e => e.id !== primaryId).map(e => `"${e.title}"`).join(', ')}
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-2 p-3 mb-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Deleted events can be restored from the Deleted tab.
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep('edit')}>
                  <ChevronLeft className="w-4 h-4 mr-1" />Back
                </Button>
                <Button
                  onClick={commitMerge}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  Merge Events
                </Button>
              </div>
            </>
          )}

          {/* Executing */}
          {step === 'executing' && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <RefreshCw className="w-5 h-5 text-coral animate-spin" />
              <span className="text-charcoal">Merging events...</span>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <CheckCircle className="w-5 h-5 text-sage" />
              <span className="text-charcoal">{resultMessage}</span>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <>
              <div className="flex items-center gap-3 py-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={onClose}>Close</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
