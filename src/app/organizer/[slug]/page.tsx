/**
 * ORGANIZER DETAIL PAGE
 * =====================
 * Individual organizer page with their events.
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import {
  User,
  Globe,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { EventGrid, SectionHeader } from '@/components/events';
import { OrganizerJsonLd } from '@/components/seo';
import { SuperadminBar } from '@/components/admin-anywhere';
import { getOrganizer } from '@/data/organizers';
import { getEvents } from '@/data/events';
import { getSession, isSuperAdmin } from '@/lib/auth';

interface OrganizerPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for the organizer page.
 */
export async function generateMetadata({
  params,
}: OrganizerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await getOrganizer({ slug });

  if (!organizer) {
    return { title: 'Organizer Not Found' };
  }

  const description = organizer.description ||
    `Events by ${organizer.name}. Find upcoming shows, classes, and more.`;

  return {
    title: organizer.name,
    description,
    openGraph: {
      title: organizer.name,
      description,
      images: organizer.logo_url ? [organizer.logo_url] : undefined,
    },
  };
}

/**
 * Organizer detail page.
 */
export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const { slug } = await params;

  console.log('👥 [OrganizerPage] Rendering organizer:', slug);

  // Fetch organizer and session in parallel
  const [organizer, { session }] = await Promise.all([
    getOrganizer({ slug }),
    getSession(),
  ]);

  if (!organizer) {
    console.log('⚠️ [OrganizerPage] Organizer not found');
    notFound();
  }

  // Check if current user is superadmin
  const userIsSuperAdmin = session ? isSuperAdmin(session.email) : false;

  // Fetch events by this organizer
  const { events, total } = await getEvents({
    organizerId: organizer.id,
    limit: 12,
  });

  console.log('✅ [OrganizerPage] Organizer loaded:', organizer.name);

  return (
    <>
      {/* Structured data for SEO */}
      <OrganizerJsonLd organizer={organizer} />

      {/* Superadmin bar */}
      {userIsSuperAdmin && (
        <SuperadminBar
          entityType="organizer"
          entityName={organizer.name}
          entityId={organizer.id}
        />
      )}

      <Container className="py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Organizers', href: '/organizers' },
            { label: organizer.name },
          ]}
          className="mb-6"
        />

        {/* Organizer header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Organizer profile */}
          <div className="flex items-start gap-6 mb-8">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {organizer.logo_url ? (
                <Image
                  src={organizer.logo_url}
                  alt={organizer.name}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-coral" />
              )}
            </div>

            {/* Info */}
            <div>
              <Badge variant="secondary" className="mb-3">
                Organizer
              </Badge>
              <h1 className="font-display text-h1 text-charcoal">
                {organizer.name}
              </h1>
            </div>
          </div>

          {/* Description */}
          {organizer.description && (
            <div className="mb-8">
              <h2 className="font-display text-h3 text-charcoal mb-4">
                About
              </h2>
              <div className="prose-event whitespace-pre-wrap">
                {organizer.description}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Contact info card */}
            <div className="p-6 bg-warm-white rounded-lg border border-sand">
              <h3 className="font-display text-h4 text-charcoal mb-4">
                Contact
              </h3>

              {/* Website */}
              {organizer.website_url && (
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="w-5 h-5 text-coral mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">Website</p>
                    <a
                      href={organizer.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-coral hover:text-coral-dark transition-colors"
                    >
                      Visit website
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {organizer.email && (
                <div className="flex items-start gap-3 mb-4">
                  <Mail className="w-5 h-5 text-coral mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">Email</p>
                    <a
                      href={`mailto:${organizer.email}`}
                      className="text-body-sm text-coral hover:text-coral-dark transition-colors"
                    >
                      {organizer.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Phone */}
              {organizer.phone && (
                <div className="flex items-start gap-3 mb-6">
                  <Phone className="w-5 h-5 text-coral mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">Phone</p>
                    <a
                      href={`tel:${organizer.phone}`}
                      className="text-body-sm text-coral hover:text-coral-dark transition-colors"
                    >
                      {organizer.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* External link */}
              {organizer.website_url && (
                <Button
                  href={organizer.website_url}
                  external
                  fullWidth
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Visit Website
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="p-6 bg-warm-white rounded-lg border border-sand">
              <div className="text-center">
                <p className="font-display text-h2 text-coral">{total}</p>
                <p className="text-body-sm text-stone">
                  {total === 1 ? 'Upcoming Event' : 'Upcoming Events'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Events by this organizer */}
        <section>
          <SectionHeader
            title="Upcoming Events"
            subtitle={`Events hosted by ${organizer.name}`}
          />
          <EventGrid
            events={events}
            columns={4}
            emptyTitle="No upcoming events"
            emptyMessage="Check back soon for events from this organizer!"
          />
        </section>
      </Container>
    </>
  );
}
