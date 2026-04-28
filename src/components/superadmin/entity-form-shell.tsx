'use client';

/**
 * ENTITY FORM SHELL
 * =================
 * Shared scaffolding for the four Directory entity forms
 * (organizer, venue, performer, membership_org). Handles ~200 lines of
 * repeated boilerplate per form:
 *   - status bar (idle / saving / saved / error)
 *   - notes input (audit-log context)
 *   - save + deactivate action buttons
 *   - delete confirmation modal
 *   - create → redirect to edit page flow
 *   - edit → PATCH-with-diff → refresh flow
 *   - delete → DELETE-with-reason → refresh flow
 *
 * Per-entity forms provide:
 *   - the fields between the status bar and the actions (children)
 *   - the kind (organizer/venue/…) for the API path
 *   - a buildCreatePayload(state) — create-mode only
 *   - a buildUpdateDiff(state) — edit-mode only
 *   - the initial form state + reset (edit mode)
 *
 * Rule of thumb: if the scaffolding changes for one entity, change it HERE
 * so all four get the fix simultaneously.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_ENTITIES, type AdminEntityKind } from '@/lib/constants/admin-entities';

type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

// ============================================================================
// STATUS BAR
// ============================================================================

interface FormStatusBarProps {
  status: FormStatus;
  message: string;
}

export function FormStatusBar({ status, message }: FormStatusBarProps) {
  if (status === 'idle') return null;
  return (
    <div
      className={`p-4 rounded-lg flex items-center gap-3 ${
        status === 'saving'
          ? 'bg-amber-50 border border-amber-200'
          : status === 'saved'
          ? 'bg-emerald/10 border border-sage/30'
          : 'bg-red-50 border border-red-200'
      }`}
    >
      {status === 'saving' && <Clock className="w-5 h-5 text-amber-600 animate-spin" />}
      {status === 'saved' && <CheckCircle className="w-5 h-5 text-emerald" />}
      {status === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
      <span
        className={`text-sm font-medium ${
          status === 'saving' ? 'text-amber-800' : status === 'saved' ? 'text-emerald' : 'text-red-800'
        }`}
      >
        {message}
      </span>
    </div>
  );
}

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteConfirmModalProps {
  open: boolean;
  entityLabel: string;
  entityName: string;
  reason: string;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}

export function DeleteConfirmModal({
  open,
  entityLabel,
  entityName,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
  busy,
}: DeleteConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
      <div className="bg-pure rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-body text-xl text-ink flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Deactivate {entityLabel}
          </h3>
          <button onClick={onCancel} className="p-1 hover:bg-cloud/50 rounded-lg">
            <X className="w-5 h-5 text-zinc" />
          </button>
        </div>

        <p className="text-zinc mb-4">
          This will hide <strong>{entityName}</strong> from the site. It can be
          reactivated later.
        </p>

        <div className="mb-4">
          <label htmlFor="deleteReason" className="block text-sm font-medium text-ink mb-2">
            Reason <span className="text-red-600">*</span>
          </label>
          <textarea
            id="deleteReason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-mist rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
            placeholder={`Why are you deactivating this ${entityLabel.toLowerCase()}?`}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!reason.trim() || busy}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {busy ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// useEntityForm hook — the state machine
// ============================================================================

export interface UseEntityFormOptions<TState> {
  kind: AdminEntityKind;
  mode: 'create' | 'edit';
  /** Only required in edit mode. */
  entityId?: string;
  /** Only required in edit mode. */
  entityName?: string;
  /** Build the POST body for create. Keys are column names. */
  buildCreatePayload?: (state: TState) => Record<string, unknown>;
  /** Build the PATCH `updates` diff for edit mode. */
  buildUpdateDiff?: (state: TState) => Record<string, unknown>;
  /**
   * Called after a successful edit-save so the form can refresh its baseline.
   * Without this, `initial` stays at mount-time values and subsequent saves
   * re-send already-persisted fields as "updates" (harmless but noisy in the
   * audit log).
   */
  onAfterSave?: () => void;
}

export interface EntityFormController {
  status: FormStatus;
  message: string;
  notes: string;
  setNotes: (v: string) => void;
  showDeleteConfirm: boolean;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;
  deleteReason: string;
  setDeleteReason: (v: string) => void;
  /** Create (POST) OR edit (PATCH) based on mode. */
  save: () => Promise<void>;
  /** Edit-mode only. */
  confirmDelete: () => Promise<void>;
  /** Force-reset status to idle (e.g. user edited a field after an error). */
  resetStatus: () => void;
  /** Surface a client-side validation error in the status bar. */
  setError: (message: string) => void;
}

export function useEntityForm<TState>(
  opts: UseEntityFormOptions<TState>,
  state: TState
): EntityFormController {
  const router = useRouter();
  const meta = ADMIN_ENTITIES[opts.kind];
  const apiBase = `/api/superadmin/${meta.apiSlug}`;

  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const resetStatus = useCallback(() => {
    if (status === 'saved' || status === 'error') setStatus('idle');
  }, [status]);

  const save = useCallback(async () => {
    if (opts.mode === 'create') {
      if (!opts.buildCreatePayload) return;
      const payload = opts.buildCreatePayload(state);
      if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
        setStatus('error');
        setMessage('Name is required');
        return;
      }
      setStatus('saving');
      setMessage(`Creating ${meta.label.toLowerCase()}...`);
      try {
        const res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, notes: notes || `Superadmin create` }),
        });
        const data = await res.json();
        if (!res.ok || !data.id) throw new Error(data.error || data.message || 'Create failed');
        setStatus('saved');
        setMessage(`${meta.label} created — redirecting...`);
        router.push(`/admin/${meta.urlSlug}/${data.id}/edit`);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Create failed');
      }
      return;
    }

    // EDIT MODE
    if (!opts.entityId || !opts.buildUpdateDiff) return;
    const updates = opts.buildUpdateDiff(state);
    if (Object.keys(updates).length === 0) {
      setStatus('idle');
      setMessage('No changes to save');
      return;
    }
    setStatus('saving');
    setMessage('Saving changes...');
    try {
      const res = await fetch(`${apiBase}/${opts.entityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, notes: notes || 'Superadmin edit' }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save changes');
      }
      setStatus('saved');
      setMessage('Changes saved successfully!');
      setNotes('');
      opts.onAfterSave?.();
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to save changes');
    }
  }, [opts, state, notes, apiBase, meta.label, meta.urlSlug, router]);

  const confirmDelete = useCallback(async () => {
    if (opts.mode !== 'edit' || !opts.entityId) return;
    if (!deleteReason.trim()) return;
    setStatus('saving');
    setMessage('Deactivating...');
    try {
      const res = await fetch(`${apiBase}/${opts.entityId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to deactivate');
      }
      setStatus('saved');
      setMessage(`${meta.label} deactivated successfully`);
      setShowDeleteConfirm(false);
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to deactivate');
    }
  }, [opts, deleteReason, apiBase, meta.label, router]);

  const setError = useCallback((msg: string) => {
    setStatus('error');
    setMessage(msg);
  }, []);

  return {
    status,
    message,
    notes,
    setNotes,
    showDeleteConfirm,
    openDeleteConfirm: () => setShowDeleteConfirm(true),
    closeDeleteConfirm: () => setShowDeleteConfirm(false),
    deleteReason,
    setDeleteReason,
    save,
    confirmDelete,
    resetStatus,
    setError,
  };
}

// ============================================================================
// FORM ACTIONS BAR
// ============================================================================

interface FormActionsProps {
  mode: 'create' | 'edit';
  entityLabel: string;
  status: FormStatus;
  onSave: () => void;
  onRequestDelete?: () => void; // edit mode
}

export function FormActions({ mode, entityLabel, status, onSave, onRequestDelete }: FormActionsProps) {
  const isCreate = mode === 'create';
  return (
    <div className="flex items-center justify-between">
      {!isCreate && onRequestDelete ? (
        <Button
          variant="secondary"
          onClick={onRequestDelete}
          disabled={status === 'saving'}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          Deactivate {entityLabel}
        </Button>
      ) : (
        <span />
      )}

      <Button
        onClick={onSave}
        disabled={status === 'saving'}
        className="flex items-center gap-2 bg-blue hover:bg-blue/90 text-white px-6"
      >
        {isCreate ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {status === 'saving'
          ? isCreate
            ? 'Creating...'
            : 'Saving...'
          : isCreate
          ? `Create ${entityLabel}`
          : 'Save Changes'}
      </Button>
    </div>
  );
}

// ============================================================================
// NOTES FIELD
// ============================================================================

interface NotesFieldProps {
  mode: 'create' | 'edit';
  value: string;
  onChange: (v: string) => void;
}

export function NotesField({ mode, value, onChange }: NotesFieldProps) {
  const isCreate = mode === 'create';
  return (
    <div>
      <label htmlFor="notes" className="block text-sm font-medium text-ink mb-2">
        {isCreate ? 'Creation' : 'Edit'} Notes{' '}
        <span className="text-zinc font-normal">(for audit log)</span>
      </label>
      <textarea
        id="notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full px-4 py-2 border border-mist rounded-lg focus:border-blue focus:ring-2 focus:ring-blue/30 outline-none resize-none"
        placeholder={isCreate ? 'Context for this new record' : 'Why are you making these changes?'}
      />
    </div>
  );
}

// ============================================================================
// DIFF HELPER — build an edit-mode updates object
// ============================================================================

/**
 * Generic diff builder. For each key in `current`, emit an entry if the
 * value differs from `original[key]` (treating '' and null as equivalent).
 * Keys whose current value is '' get converted to null unless `nonNullable`
 * lists them.
 *
 * Caller is responsible for providing ONLY the keys that are editable —
 * don't pass through `id`, `created_at`, etc.
 */
export function buildStringDiff<T extends Record<string, unknown>>(
  original: T,
  current: Partial<T>,
  opts: { nonNullable?: (keyof T)[] } = {}
): Record<string, unknown> {
  const nonNullable = new Set(opts.nonNullable || []);
  const updates: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(current) as [keyof T, unknown][]) {
    if (raw === undefined) continue;
    const originalValue = original[key];
    const originalNormalized =
      typeof originalValue === 'string' ? originalValue : originalValue ?? '';
    const currentNormalized = typeof raw === 'string' ? raw : raw ?? '';
    if (currentNormalized === originalNormalized) continue;
    // Booleans and numbers just pass through.
    if (typeof raw === 'boolean' || typeof raw === 'number') {
      updates[key as string] = raw;
      continue;
    }
    // Strings: '' → null unless column is NOT NULL.
    if (typeof raw === 'string' && raw === '' && !nonNullable.has(key)) {
      updates[key as string] = null;
    } else {
      updates[key as string] = raw;
    }
  }
  return updates;
}
