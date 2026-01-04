/**
 * MY SUBMISSIONS PAGE
 * ====================
 * Shows all events submitted by the current user.
 *
 * Route: /my/submissions
 * Auth: Required
 *
 * @module app/my/submissions/page
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlusCircle, Clock, CheckCircle, AlertCircle, XCircle, Edit2 } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getUserSubmissions, getSubmissionCounts } from '@/data/submit';
import { Container } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import {
  EventStatus,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
} from '@/types/submission';
import { cn } from '@/lib/utils';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'My Submissions | Happenlist',
  description: 'View and manage your submitted events.',
};

// ============================================================================
// STATUS ICON
// ============================================================================

function StatusIcon({ status }: { status: EventStatus }) {
  switch (status) {
    case 'draft':
      return <Edit2 className="w-4 h-4" />;
    case 'pending_review':
      return <Clock className="w-4 h-4" />;
    case 'published':
      return <CheckCircle className="w-4 h-4" />;
    case 'changes_requested':
      return <AlertCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default async function MySubmissionsPage() {
  // Check authentication
  const { session } = await getSession();

  if (!session) {
    redirect('/auth/login?redirect=/my/submissions');
  }

  // Get submissions and counts
  const [submissionsResult, countsResult] = await Promise.all([
    getUserSubmissions({ userEmail: session.email }),
    getSubmissionCounts(session.email),
  ]);

  const submissions = submissionsResult.submissions || [];
  const counts = countsResult.counts || {
    draft: 0,
    pending_review: 0,
    changes_requested: 0,
    published: 0,
    rejected: 0,
    cancelled: 0,
    postponed: 0,
  };

  return (
    <Container>
      <div className="py-8">
        {/* ========== Header ========== */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-charcoal">
              My Submissions
            </h1>
            <p className="text-stone mt-1">
              Events you&apos;ve submitted to Happenlist
            </p>
          </div>

          <Link href="/submit/new">
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit Event
            </Button>
          </Link>
        </div>

        {/* ========== Stats ========== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-warm-white border border-sand rounded-lg p-4">
            <div className="text-2xl font-bold text-charcoal">{counts.published}</div>
            <div className="text-sm text-stone">Published</div>
          </div>
          <div className="bg-warm-white border border-sand rounded-lg p-4">
            <div className="text-2xl font-bold text-charcoal">{counts.pending_review}</div>
            <div className="text-sm text-stone">Pending Review</div>
          </div>
          <div className="bg-warm-white border border-sand rounded-lg p-4">
            <div className="text-2xl font-bold text-charcoal">{counts.changes_requested}</div>
            <div className="text-sm text-stone">Needs Changes</div>
          </div>
          <div className="bg-warm-white border border-sand rounded-lg p-4">
            <div className="text-2xl font-bold text-charcoal">{counts.draft}</div>
            <div className="text-sm text-stone">Drafts</div>
          </div>
        </div>

        {/* ========== Changes Requested Banner ========== */}
        {counts.changes_requested > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-orange-800">
                  {counts.changes_requested} event{counts.changes_requested > 1 ? 's need' : ' needs'} your attention
                </p>
                <p className="text-sm text-orange-700">
                  Please review the feedback and resubmit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========== Submissions List ========== */}
        {submissions.length === 0 ? (
          <div className="text-center py-16 bg-warm-white border border-sand rounded-lg">
            <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-8 h-8 text-stone" />
            </div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">
              No submissions yet
            </h2>
            <p className="text-stone mb-6">
              Share your events with the Milwaukee community!
            </p>
            <Link href="/submit/new">
              <Button>Submit Your First Event</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-warm-white border border-sand rounded-lg p-4 hover:border-coral/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge
                        className={cn(
                          'flex items-center space-x-1',
                          EVENT_STATUS_COLORS[submission.status as EventStatus]
                        )}
                      >
                        <StatusIcon status={submission.status as EventStatus} />
                        <span>{EVENT_STATUS_LABELS[submission.status as EventStatus]}</span>
                      </Badge>

                      {submission.category_name && (
                        <span className="text-sm text-stone">
                          {submission.category_name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-charcoal truncate">
                      {submission.title}
                    </h3>

                    <div className="flex items-center space-x-4 mt-1 text-sm text-stone">
                      <span>
                        {format(new Date(submission.instance_date), 'MMM d, yyyy')}
                      </span>
                      {submission.location_name && (
                        <span>• {submission.location_name}</span>
                      )}
                    </div>

                    {/* Change Request Message */}
                    {submission.status === 'changes_requested' &&
                      submission.change_request_message && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm font-medium text-orange-800 mb-1">
                            Requested Changes:
                          </p>
                          <p className="text-sm text-orange-700">
                            {submission.change_request_message}
                          </p>
                        </div>
                      )}

                    {/* Rejection Reason */}
                    {submission.status === 'rejected' && submission.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Reason:
                        </p>
                        <p className="text-sm text-red-700">
                          {submission.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image */}
                  {submission.image_url && (
                    <div className="ml-4 flex-shrink-0 w-24 h-16 rounded overflow-hidden bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={submission.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-sand">
                  {submission.status === 'published' && (
                    <Link href={`/event/${submission.slug}`}>
                      <Button variant="outline" size="sm">
                        View Event
                      </Button>
                    </Link>
                  )}

                  {submission.status === 'changes_requested' && (
                    <Link href={`/submit/edit/${submission.id}`}>
                      <Button size="sm">
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit & Resubmit
                      </Button>
                    </Link>
                  )}

                  {submission.status === 'draft' && (
                    <Link href={`/submit/edit/${submission.id}`}>
                      <Button size="sm">
                        Continue Editing
                      </Button>
                    </Link>
                  )}

                  <span className="text-xs text-stone ml-auto">
                    Submitted {format(new Date(submission.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
