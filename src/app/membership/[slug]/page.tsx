/**
 * MEMBERSHIP ORG DETAIL PAGE
 * ==========================
 * Individual membership organization with event benefits.
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield,
  Globe,
  ExternalLink,
  Ticket,
  Calendar,
  MapPin,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button } from '@/components/ui';
import { SectionHeader } from '@/components/events';
import { getMembershipOrg, getMembershipOrgEvents } from '@/data/membership';
import { getOrganizer } from '@/data/organizers';
import { getBenefitConfig } from '@/types';
import { buildEventUrl } from '@/lib/utils/url';
import { formatDate, formatTime } from '@/lib/utils/dates';

interface MembershipPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MembershipPageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = await getMembershipOrg({ slug });

  if (!org) {
    return { title: 'Membership Not Found' };
  }

  const description = org.description ||
    `Events with member benefits from ${org.name}. See what your membership gets you.`;

  return {
    title: `${org.name} — Member Benefits`,
    description,
    openGraph: {
      title: `${org.name} — Member Benefits`,
      description,
      images: org.logo_url ? [org.logo_url] : undefined,
    },
  };
}

export default async function MembershipPage({ params }: MembershipPageProps) {
  const { slug } = await params;

  console.log('🏛️ [MembershipPage] Rendering membership org:', slug);

  const org = await getMembershipOrg({ slug });

  if (!org) {
    console.log('⚠️ [MembershipPage] Org not found');
    notFound();
  }

  // Fetch events and parent organizer in parallel
  const [events, parentOrganizer] = await Promise.all([
    getMembershipOrgEvents(org.id),
    org.organizer_id ? getOrganizer({ slug: '' }).then(() => null).catch(() => null) : Promise.resolve(null),
  ]);

  // If has organizer_id, fetch by ID instead
  let linkedOrganizer = parentOrganizer;
  if (org.organizer_id && !linkedOrganizer) {
    // We need to fetch by ID — let's use a direct query
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('organizers')
      .select('id, name, slug')
      .eq('id', org.organizer_id)
      .eq('is_active', true)
      .single();
    if (data) {
      linkedOrganizer = data as { id: string; name: string; slug: string } & Record<string, unknown>;
    }
  }

  console.log('✅ [MembershipPage] Org loaded:', org.name);

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Memberships', href: '/memberships' },
          { label: org.name },
        ]}
        className="mb-6"
      />

      {/* Org header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-6 mb-8">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {org.logo_url ? (
                <Image
                  src={org.logo_url}
                  alt={org.name}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <Shield className="w-12 h-12 text-amber-600" />
              )}
            </div>

            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">
                Membership Organization
              </span>
              <h1 className="font-display text-h1 text-charcoal">
                {org.name}
              </h1>
              {linkedOrganizer && 'slug' in linkedOrganizer && (
                <Link
                  href={`/organizer/${linkedOrganizer.slug}`}
                  className="text-sm text-coral hover:text-coral-dark transition-colors mt-1 inline-block"
                >
                  View organizer page &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          {org.description && (
            <div className="mb-8">
              <h2 className="font-display text-h3 text-charcoal mb-4">
                About
              </h2>
              <div className="prose-event whitespace-pre-wrap">
                {org.description}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Website */}
            {org.website_url && (
              <div className="p-6 bg-warm-white rounded-lg border border-sand">
                <h3 className="font-display text-h4 text-charcoal mb-4">
                  Links
                </h3>
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-charcoal">Website</p>
                    <a
                      href={org.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-coral hover:text-coral-dark transition-colors"
                    >
                      Visit website
                    </a>
                  </div>
                </div>
                <Button
                  href={org.website_url}
                  external
                  fullWidth
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Learn About Membership
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="p-6 bg-warm-white rounded-lg border border-sand">
              <div className="text-center">
                <p className="font-display text-h2 text-amber-600">{events.length}</p>
                <p className="text-body-sm text-stone">
                  {events.length === 1 ? 'Event with Benefits' : 'Events with Benefits'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events with benefits */}
      <section>
        <SectionHeader
          title="Member Benefits at Upcoming Events"
          subtitle={`Events where your ${org.name} membership gets you perks`}
        />

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-10 h-10 text-stone/40 mx-auto mb-3" />
            <p className="text-stone">No upcoming events with member benefits right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const config = getBenefitConfig(event.benefit_type);
              return (
                <Link
                  key={event.id}
                  href={buildEventUrl(event)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-warm-white border border-sand hover:shadow-card-lifted hover:-translate-y-0.5 transition-all"
                >
                  {/* Date column */}
                  <div className="flex-shrink-0 text-center w-14">
                    <p className="text-xs text-stone uppercase">
                      {formatDate(event.start_datetime, 'MMM')}
                    </p>
                    <p className="font-display text-h3 text-charcoal leading-tight">
                      {formatDate(event.start_datetime, 'd')}
                    </p>
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal truncate">{event.title}</p>
                    <div className="flex items-center gap-3 text-xs text-stone mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTime(event.start_datetime)}
                      </span>
                      {event.location_name && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" />
                          {event.location_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Benefit badge */}
                  <div className="flex-shrink-0">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                      {event.benefit_type === 'member_price' && event.member_price
                        ? `$${event.member_price}`
                        : config.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </Container>
  );
}
