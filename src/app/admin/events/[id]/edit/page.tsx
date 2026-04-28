/**
 * SUPERADMIN EVENT EDIT PAGE
 * ===========================
 * Auth gate + data fetch. The actual layout (command bar, hero, sections,
 * sidebar) lives inside SuperadminEventEditForm so the form can stay
 * cohesive across full-page and embed contexts.
 *
 * @module app/admin/events/[id]/edit
 */
import { notFound, redirect } from 'next/navigation';
import { SuperadminEventEditForm } from '@/components/superadmin';
import { getAdminEvent } from '@/data/admin';
import { getCategories } from '@/data/categories';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { superadminLogger } from '@/lib/utils/logger';

export const metadata = { title: 'Edit Event' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminEventEditPage({ params }: PageProps) {
  const { id: eventId } = await params;

  const { session } = await getSession();

  if (!session) {
    superadminLogger.warn('Unauthenticated user tried to access edit page', {
      entityType: 'event',
      entityId: eventId,
    });
    redirect('/auth/login?redirect=/admin/events/' + eventId + '/edit');
  }

  if (!isSuperAdmin(session.email)) {
    superadminLogger.warn('Non-superadmin tried to access edit page', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
    });
    redirect('/admin/events/' + eventId);
  }

  const timer = superadminLogger.time('SuperadminEventEditPage render', {
    entityType: 'event',
    entityId: eventId,
    adminEmail: session.email,
  });

  const [event, categories] = await Promise.all([
    getAdminEvent(eventId),
    getCategories(),
  ]);

  if (!event) {
    superadminLogger.warn('Event not found', { entityType: 'event', entityId: eventId });
    notFound();
  }

  timer.success(`Loaded event for editing: ${event.title}`);

  // Re-key the form when the saved record changes so its dirty-diff
  // baseline always matches the fresh server state. Otherwise router.refresh()
  // after a save would leave the form's internal `originalState` stale.
  const formKey = `${event.id}:${event.updated_at ?? ''}`;

  return (
    <SuperadminEventEditForm
      key={formKey}
      event={event}
      categories={categories}
    />
  );
}
