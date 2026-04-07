'use client';

/**
 * ADMIN EVENT LIST
 * ================
 * Client component that wraps event cards with bulk selection and actions.
 * Provides select-all, per-card checkboxes, and a floating action bar.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  ChevronDown,
  X,
  AlertTriangle,
} from 'lucide-react';
import { AdminEventCard } from './admin-event-card';
import { Button } from '@/components/ui/button';
import type { AdminEventCard as AdminEventCardType } from '@/data/admin';

interface AdminEventListProps {
  events: AdminEventCardType[];
  /** Show approve/reject buttons (for pending pages) */
  showApproveReject?: boolean;
  /** Show delete/status change buttons (superadmin) */
  showSuperadminActions?: boolean;
}

type BulkAction = 'approve' | 'reject' | 'delete' | 'change_status';
type ActionState = 'idle' | 'confirming' | 'executing' | 'done' | 'error';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminEventList({
  events,
  showApproveReject = true,
  showSuperadminActions = false,
}: AdminEventListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [reason, setReason] = useState('');
  const [targetStatus, setTargetStatus] = useState('published');
  const [resultMessage, setResultMessage] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const selectedCount = selectedIds.size;
  const allSelected = events.length > 0 && selectedIds.size === events.length;

  const handleSelect = useCallback((eventId: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map(e => e.id)));
    }
  }, [allSelected, events]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setPendingAction(null);
    setActionState('idle');
    setReason('');
    setResultMessage('');
  }, []);

  const startAction = useCallback((action: BulkAction) => {
    setPendingAction(action);
    setActionState('confirming');
    setReason('');
    setResultMessage('');
  }, []);

  const executeAction = useCallback(async () => {
    if (!pendingAction || selectedCount === 0) return;

    setActionState('executing');

    try {
      const body: Record<string, unknown> = {
        action: pendingAction,
        eventIds: Array.from(selectedIds),
      };

      if (pendingAction === 'reject' || pendingAction === 'delete') {
        body.reason = reason || 'Bulk action';
      }
      if (pendingAction === 'change_status') {
        body.status = targetStatus;
      }

      const response = await fetch('/api/admin/events/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bulk action failed');
      }

      setActionState('done');
      setResultMessage(data.message);

      // Clear selection and refresh after short delay
      setTimeout(() => {
        clearSelection();
        router.refresh();
      }, 1500);
    } catch (error) {
      setActionState('error');
      setResultMessage(error instanceof Error ? error.message : 'Action failed');
    }
  }, [pendingAction, selectedIds, selectedCount, reason, targetStatus, clearSelection, router]);

  const getActionLabel = (action: BulkAction): string => {
    switch (action) {
      case 'approve': return 'Approve';
      case 'reject': return 'Reject';
      case 'delete': return 'Delete';
      case 'change_status': return `Change to ${STATUS_OPTIONS.find(s => s.value === targetStatus)?.label || targetStatus}`;
    }
  };

  return (
    <div>
      {/* Select all header */}
      {events.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-sand text-coral focus:ring-coral"
            />
            <span className="text-sm text-stone">
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
          </label>
          {selectedCount > 0 && (
            <span className="text-sm text-coral font-medium">
              {selectedCount} selected
            </span>
          )}
        </div>
      )}

      {/* Event cards */}
      <div className="space-y-3">
        {events.map((event) => (
          <AdminEventCard
            key={event.id}
            event={event}
            selected={selectedIds.has(event.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Floating bulk action bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-charcoal text-warm-white rounded-xl shadow-xl px-6 py-3 flex items-center gap-4">
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedCount} event{selectedCount !== 1 ? 's' : ''} selected
            </span>

            <div className="w-px h-6 bg-white/20" />

            {/* Action buttons */}
            {showApproveReject && (
              <>
                <button
                  onClick={() => startAction('approve')}
                  className="flex items-center gap-1.5 text-sm text-sage hover:text-white transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => startAction('reject')}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}

            {showSuperadminActions && (
              <>
                <button
                  onClick={() => startAction('delete')}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Status
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-sand py-1 min-w-[160px]">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setTargetStatus(opt.value);
                            setShowStatusDropdown(false);
                            startAction('change_status');
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-charcoal hover:bg-cream transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="w-px h-6 bg-white/20" />

            <button
              onClick={clearSelection}
              className="text-stone hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation / result modal */}
      {actionState !== 'idle' && pendingAction && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-warm-white rounded-xl shadow-xl max-w-md w-full p-6">
            {actionState === 'confirming' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <h3 className="font-display text-xl text-charcoal">
                    {getActionLabel(pendingAction)} {selectedCount} event{selectedCount !== 1 ? 's' : ''}?
                  </h3>
                </div>

                {(pendingAction === 'reject' || pendingAction === 'delete') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-charcoal mb-1">
                      Reason {pendingAction === 'reject' && <span className="text-red-600">*</span>}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-sand rounded-lg focus:border-coral focus:ring-1 focus:ring-coral outline-none resize-none text-sm"
                      placeholder={pendingAction === 'reject' ? 'Why are these being rejected?' : 'Optional reason for deletion'}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={clearSelection}>Cancel</Button>
                  <Button
                    onClick={executeAction}
                    disabled={pendingAction === 'reject' && !reason.trim()}
                    className={
                      pendingAction === 'approve'
                        ? 'bg-sage hover:bg-sage/90 text-white'
                        : pendingAction === 'reject' || pendingAction === 'delete'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-coral hover:bg-coral/90 text-white'
                    }
                  >
                    {getActionLabel(pendingAction)}
                  </Button>
                </div>
              </>
            )}

            {actionState === 'executing' && (
              <div className="flex items-center gap-3 py-4">
                <RefreshCw className="w-5 h-5 text-coral animate-spin" />
                <span className="text-charcoal">Processing {selectedCount} events...</span>
              </div>
            )}

            {actionState === 'done' && (
              <div className="flex items-center gap-3 py-4">
                <CheckCircle className="w-5 h-5 text-sage" />
                <span className="text-charcoal">{resultMessage}</span>
              </div>
            )}

            {actionState === 'error' && (
              <>
                <div className="flex items-center gap-3 py-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{resultMessage}</span>
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={clearSelection}>Close</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
