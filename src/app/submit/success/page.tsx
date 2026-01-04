/**
 * SUBMISSION SUCCESS PAGE
 * ========================
 * Shown after a successful event submission.
 *
 * Route: /submit/success?id=eventId
 *
 * @module app/submit/success/page
 */

import Link from 'next/link';
import { CheckCircle, ArrowRight, PlusCircle, List } from 'lucide-react';
import { Button } from '@/components/ui';
import { Container } from '@/components/layout';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Event Submitted! | Happenlist',
  description: 'Your event has been submitted for review.',
};

// ============================================================================
// PAGE
// ============================================================================

export default function SubmitSuccessPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const eventId = searchParams.id;

  return (
    <Container>
      <div className="min-h-[60vh] flex items-center justify-center py-16">
        <div className="max-w-md w-full text-center">
          {/* ========== Success Icon ========== */}
          <div className="w-20 h-20 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-sage" />
          </div>

          {/* ========== Heading ========== */}
          <h1 className="text-3xl font-display font-bold text-charcoal mb-3">
            Event Submitted! 🎉
          </h1>

          <p className="text-lg text-stone mb-8">
            Thanks for sharing your event with the community. We&apos;ll review it
            and get back to you within 24 hours.
          </p>

          {/* ========== What Happens Next ========== */}
          <div className="bg-cream rounded-lg p-6 text-left mb-8">
            <h2 className="font-semibold text-charcoal mb-4">What happens next?</h2>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-coral text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  1
                </span>
                <span className="text-stone">
                  Our team reviews your submission (usually within a few hours)
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-coral text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  2
                </span>
                <span className="text-stone">
                  You&apos;ll get an email when your event is approved
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-sage text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  ✓
                </span>
                <span className="text-stone">
                  Your event goes live and people can discover it!
                </span>
              </li>
            </ol>
          </div>

          {/* ========== Actions ========== */}
          <div className="space-y-3">
            <Link href="/submit/new">
              <Button className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Submit Another Event
              </Button>
            </Link>

            <Link href="/my/submissions">
              <Button variant="outline" className="w-full">
                <List className="w-4 h-4 mr-2" />
                View My Submissions
              </Button>
            </Link>

            <Link href="/events">
              <Button variant="ghost" className="w-full">
                Browse Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
