/**
 * STEP 1: BASIC INFO
 * ===================
 * First step of the event submission form.
 *
 * Collects:
 *   - Event title
 *   - Description
 *   - Short description
 *   - Category selection
 *
 * @module components/submit/steps/step-1-basic-info
 */

'use client';

import { StepHeader } from '../step-progress';
import { Input, Button } from '@/components/ui';
import type { EventDraftData } from '@/types/submission';
import { MAX_TITLE_LENGTH, MAX_SHORT_DESCRIPTION_LENGTH } from '@/lib/constants/series-limits';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface Step1Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
  categories: Category[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step1BasicInfo({ draftData, updateData, categories }: Step1Props) {
  return (
    <div className="space-y-6">
      <StepHeader
        step={1}
        title="Basic Information"
        description="Tell us about your event"
      />

      {/* ========== Title ========== */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Event Title <span className="text-coral">*</span>
        </label>
        <Input
          id="title"
          type="text"
          value={draftData.title || ''}
          onChange={(e) => updateData({ title: e.target.value })}
          placeholder="e.g., Summer Jazz Festival 2025"
          maxLength={MAX_TITLE_LENGTH}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-stone">
            Be specific and descriptive
          </p>
          <p className="text-xs text-stone">
            {(draftData.title || '').length}/{MAX_TITLE_LENGTH}
          </p>
        </div>
      </div>

      {/* ========== Category ========== */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2">
          Category <span className="text-coral">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => updateData({ category_id: category.id })}
              className={cn(
                'px-4 py-3 rounded-lg border text-left transition-all',
                'hover:border-coral hover:bg-coral/5',
                draftData.category_id === category.id
                  ? 'border-coral bg-coral/10 text-coral'
                  : 'border-sand bg-warm-white text-charcoal'
              )}
            >
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========== Short Description ========== */}
      <div>
        <label
          htmlFor="short_description"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Short Description
        </label>
        <textarea
          id="short_description"
          value={draftData.short_description || ''}
          onChange={(e) => updateData({ short_description: e.target.value })}
          placeholder="A brief summary for event cards (one or two sentences)"
          rows={2}
          maxLength={MAX_SHORT_DESCRIPTION_LENGTH}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-sand',
            'bg-warm-white text-charcoal placeholder:text-stone/60',
            'focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral',
            'resize-none'
          )}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-stone">
            This appears on event cards and search results
          </p>
          <p className="text-xs text-stone">
            {(draftData.short_description || '').length}/{MAX_SHORT_DESCRIPTION_LENGTH}
          </p>
        </div>
      </div>

      {/* ========== Full Description ========== */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Full Description
        </label>
        <textarea
          id="description"
          value={draftData.description || ''}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="Tell potential attendees all about your event. Include what they can expect, any special guests, what to bring, etc."
          rows={6}
          className={cn(
            'w-full px-3 py-2 rounded-lg border border-sand',
            'bg-warm-white text-charcoal placeholder:text-stone/60',
            'focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral',
            'resize-y min-h-[150px]'
          )}
        />
        <p className="text-xs text-stone mt-1">
          Tip: More detail helps people decide to attend!
        </p>
      </div>
    </div>
  );
}
