/**
 * EVENT APPROVAL FORM
 * ====================
 * Client component for approving/rejecting events.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AdminEventDetails } from '@/data/admin';

interface EventApprovalFormProps {
  event: AdminEventDetails;
}

export function EventApprovalForm({ event }: EventApprovalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    setError(null);
    setSuccess(null);
    setAction('approve');

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${event.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to approve event');
        }

        setSuccess('Event approved and published successfully!');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setAction(null);
      }
    });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setError(null);
    setSuccess(null);
    setAction('reject');

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${event.id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason, notes }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to reject event');
        }

        setSuccess('Event rejected successfully.');
        setShowRejectForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setAction(null);
      }
    });
  };

  // Already reviewed
  if (event.status !== 'pending_review' && event.status !== 'draft') {
    return (
      <Card padding="lg" className="border border-sand">
        <h3 className="font-medium text-charcoal mb-4">Review Status</h3>
        <div className="text-center py-4">
          {event.status === 'published' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-sage" />
              <p className="text-sage font-medium">Event Published</p>
              {event.reviewed_at && (
                <p className="text-sm text-stone mt-1">
                  Reviewed by {event.reviewed_by}
                </p>
              )}
            </>
          )}
          {event.status === 'rejected' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
              <p className="text-red-500 font-medium">Event Rejected</p>
              {event.rejection_reason && (
                <p className="text-sm text-stone mt-2 bg-sand/50 p-3 rounded-lg">
                  {event.rejection_reason}
                </p>
              )}
            </>
          )}
        </div>

        {/* Re-review option */}
        {event.status === 'rejected' && (
          <div className="mt-4 pt-4 border-t border-sand">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                // Re-approve would need different handling
                setShowRejectForm(false);
              }}
            >
              Reconsider This Event
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card padding="lg" className="border border-coral/30 bg-coral/5">
      <h3 className="font-medium text-charcoal mb-4">Review This Event</h3>

      {/* Status messages */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Notes field */}
      <div className="mb-4">
        <label className="block text-sm text-stone mb-1">
          Admin Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this review..."
          className="w-full px-3 py-2 border border-sand rounded-lg text-sm resize-none focus:border-coral focus:ring-1 focus:ring-coral outline-none"
          rows={2}
        />
      </div>

      {/* Rejection form */}
      {showRejectForm ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone mb-1">
              Reason for Rejection *
            </label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-sand rounded-lg text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none"
            >
              <option value="">Select a reason...</option>
              <option value="duplicate">Duplicate event</option>
              <option value="spam">Spam or irrelevant</option>
              <option value="incomplete">Incomplete information</option>
              <option value="past_event">Event already passed</option>
              <option value="invalid_venue">Invalid venue/location</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="other">Other</option>
            </select>
          </div>

          {rejectReason === 'other' && (
            <div>
              <label className="block text-sm text-stone mb-1">
                Custom Reason *
              </label>
              <textarea
                value={rejectReason === 'other' ? '' : rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe the reason..."
                className="w-full px-3 py-2 border border-sand rounded-lg text-sm resize-none focus:border-coral focus:ring-1 focus:ring-coral outline-none"
                rows={2}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="danger"
              fullWidth
              onClick={handleReject}
              disabled={isPending || !rejectReason}
              leftIcon={
                action === 'reject' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )
              }
            >
              {action === 'reject' ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason('');
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={handleApprove}
            disabled={isPending}
            leftIcon={
              action === 'approve' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )
            }
            className="bg-sage hover:bg-sage/90"
          >
            {action === 'approve' ? 'Approving...' : 'Approve & Publish'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            leftIcon={<XCircle className="w-4 h-4" />}
            className="text-red-500 hover:bg-red-50"
          >
            Reject
          </Button>
        </div>
      )}

      {/* Review tips */}
      <div className="mt-4 pt-4 border-t border-sand/50">
        <p className="text-xs text-stone">
          <strong>Tip:</strong> Before approving, verify the event details are
          accurate and the content is appropriate for the platform.
        </p>
      </div>
    </Card>
  );
}
