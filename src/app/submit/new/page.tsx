/**
 * SUBMIT NEW EVENT PAGE
 * ======================
 * Multi-step form for submitting a new event.
 *
 * Route: /submit/new
 * Auth: Required (magic link)
 *
 * @module app/submit/new/page
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getCategories } from '@/data/categories';
import { SubmitEventForm } from './submit-event-form';

// ============================================================================
// METADATA
// ============================================================================

export const metadata = {
  title: 'Submit an Event | Happenlist',
  description: 'Share your event with the Milwaukee community. Submit your concert, class, workshop, or community event.',
};

// ============================================================================
// PAGE
// ============================================================================

export default async function SubmitNewEventPage() {
  // Check authentication
  const { session } = await getSession();

  if (!session) {
    // Redirect to auth with callback
    redirect('/auth/login?redirect=/submit/new');
  }

  // Get categories for the form
  const { categories } = await getCategories();

  return (
    <SubmitEventForm
      userEmail={session.email}
      userName={session.name || undefined}
      userId={session.id}
      categories={categories || []}
    />
  );
}
