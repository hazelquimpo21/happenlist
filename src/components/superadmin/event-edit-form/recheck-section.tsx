/**
 * EVENT EDIT FORM — RE-FETCH FROM SOURCE BANNER
 * ==============================================
 * Source URL display + RecheckPanel (rescrape diff modal). Hidden on
 * soft-deleted events since they can't be edited anyway.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/recheck-section
 */

'use client';

import { RecheckPanel } from '../recheck-panel';

interface RecheckSectionProps {
  eventId: string;
  sourceUrl: string | null | undefined;
}

export function RecheckSection({ eventId, sourceUrl }: RecheckSectionProps) {
  return (
    <div className="flex items-center justify-between bg-pure border border-mist rounded-lg px-4 py-3">
      <div className="text-sm text-zinc">
        {sourceUrl ? (
          <>
            Source:{' '}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue hover:text-blue-dark underline break-all"
            >
              {sourceUrl}
            </a>
          </>
        ) : (
          <span className="text-silver">No source URL on this event.</span>
        )}
      </div>
      <RecheckPanel eventId={eventId} hasSourceUrl={!!sourceUrl} />
    </div>
  );
}
