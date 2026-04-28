/**
 * Audience section
 * =================
 * "Good for" multi-select chips. Each tag uses its own color from
 * GOOD_FOR_TAGS. Selection state matches the rest of the chip groups
 * (rounded-full, ring on selected).
 *
 * @module components/superadmin/event-edit-form/sections/audience-section
 */
'use client';

import { GOOD_FOR_TAGS } from '@/types';
import { cn } from '@/lib/utils';
import type { SectionBaseProps } from './types';

export function AudienceSection({ formState, setFormState, resetStatus }: SectionBaseProps) {
  const count = formState.good_for.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc">
        Multi-select. Tag every audience that would feel at home here.
      </p>
      <div className="flex flex-wrap gap-2">
        {GOOD_FOR_TAGS.map((tag) => {
          const isSelected = formState.good_for.includes(tag.slug);
          return (
            <button
              key={tag.slug}
              type="button"
              onClick={() => {
                setFormState((prev) => ({
                  ...prev,
                  good_for: isSelected
                    ? prev.good_for.filter((s) => s !== tag.slug)
                    : [...prev.good_for, tag.slug],
                }));
                resetStatus();
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                isSelected
                  ? `${tag.color} ring-2 ring-offset-1 ring-current`
                  : 'bg-cloud/60 text-zinc hover:bg-cloud',
              )}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
      {count > 0 && (
        <p className="text-xs text-zinc">
          {count} {count === 1 ? 'tag' : 'tags'} selected
        </p>
      )}
    </div>
  );
}
