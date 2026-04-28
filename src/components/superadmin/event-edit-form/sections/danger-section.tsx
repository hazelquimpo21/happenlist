/**
 * Danger section
 * ===============
 * Soft-deleted banner + Delete / Restore buttons. The actual confirmation
 * modal lives in DeleteConfirmModal and is owned by index.tsx so it can
 * sit at the page level.
 *
 * @module components/superadmin/event-edit-form/sections/danger-section
 */
'use client';

import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isDeleted: boolean;
  isSubmitting: boolean;
  onRequestDelete: () => void;
  onRestore: () => void;
}

export function DangerSection({ isDeleted, isSubmitting, onRequestDelete, onRestore }: Props) {
  return (
    <div className="space-y-4">
      {isDeleted ? (
        <>
          <div className="rounded-lg border border-rose/40 bg-rose/5 p-3 flex items-start gap-3">
            <Trash2 className="w-4 h-4 text-rose mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose">This event is deleted</p>
              <p className="text-xs text-zinc mt-0.5">
                Restore to bring it back. The event is hidden from public and admin
                lists while deleted.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onRestore}
            disabled={isSubmitting}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restore event
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc">
            Soft-delete hides this event from public and admin lists. You can
            restore it later from this same panel.
          </p>
          <Button
            variant="secondary"
            onClick={onRequestDelete}
            disabled={isSubmitting}
            className="gap-2 text-rose hover:bg-rose/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete event
          </Button>
        </>
      )}
    </div>
  );
}
