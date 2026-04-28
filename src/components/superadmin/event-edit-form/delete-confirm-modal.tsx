/**
 * EVENT EDIT FORM — DELETE CONFIRMATION MODAL
 * ============================================
 * Pure presentational modal for soft-delete confirmation. The parent owns the
 * actual delete handler + status state; this just gates submission until a
 * reason is supplied.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/delete-confirm-modal
 */

'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  eventTitle: string;
  deleteReason: string;
  onReasonChange: (next: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function DeleteConfirmModal({
  eventTitle,
  deleteReason,
  onReasonChange,
  onCancel,
  onConfirm,
  isSubmitting,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
      <div className="bg-pure rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body text-xl text-ink flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Delete Event
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-cloud/50 rounded-lg"
          >
            <X className="w-5 h-5 text-zinc" />
          </button>
        </div>

        <p className="text-zinc mb-4">
          Are you sure you want to delete &quot;<strong>{eventTitle}</strong>&quot;?
          This action can be undone by restoring the event later.
        </p>

        <div className="mb-4">
          <label htmlFor="deleteReason" className="block text-sm font-medium text-ink mb-2">
            Reason for deletion <span className="text-red-600">*</span>
          </label>
          <textarea
            id="deleteReason"
            value={deleteReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
            placeholder="Why are you deleting this event?"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!deleteReason.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Event'}
          </Button>
        </div>
      </div>
    </div>
  );
}
