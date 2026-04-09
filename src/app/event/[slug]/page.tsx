/**
 * EVENT DETAIL PAGE
 * =================
 * Individual event page with full details.
 *
 * Features:
 * - Full event information display
 * - Related events section
 * - SEO structured data
 * - Admin toolbar for superadmins (edit from anywhere!)
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Ticket,
  ExternalLink,
  User,
  Sparkles,
  Quote,
  Baby,
  Users,
  Mic2,
  Shield,
  DoorOpen,
  CreditCard,
} from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Button } from '@/components/ui';
import { EventGrid, SectionHeader, EventPrice, EventDateTime, EventLinks, FlyerLightbox, ShareButton, VibeProfileSection, AccessBadge, ChildEventsSchedule } from '@/components/events';
import { HeartButton } from '@/components/hearts';
import { SeriesLinkBadge } from '@/components/series';
import { EventJsonLd } from '@/components/seo';
import { AdminToolbar, type AdminToolbarEvent } from '@/components/admin-anywhere';
import { VenueMap } from '@/components/maps';
import { getEvent, getSimilarEvents, getChildEvents, getChildEventCount } from '@/data/events';
import { getSeriesById } from '@/data/series';
import { checkSingleHeart } from '@/data/user';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { parseEventSlug, buildVenueUrl, buildOrganizerUrl, getBestImageUrl, getChildEventLabel } from '@/lib/utils';
import { formatAgeRange, getGoodForTags, getPerformerRoleLabel, getBenefitConfig } from '@/types';
import { formatEventDate, formatDate, formatTime } from '@/lib/utils/dates';
import { getCategoryColor } from '@/lib/constants/category-colors';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for the event page.
 */
export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseEventSlug(slug);

  if (!parsed) {
    return { title: 'Event Not Found' };
  }

  const event = await getEvent({
    slug: parsed.slug,
    instanceDate: parsed.date,
  });

  if (!event) {
    return { title: 'Event Not Found' };
  }

  const title = event.meta_title || event.title;
  const description =
    event.meta_description ||
    event.short_description ||
    event.description?.slice(0, 155);
  
  // Use validated image URL for Open Graph
  const ogImage = getBestImageUrl(event.image_url, event.flyer_url);

  return {
    title,
    description,
    openGraph: {
      title: event.title,
      description: description || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Event detail page.
 */
export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;

  console.log('🎫 [EventPage] Rendering event:', slug);

  // Parse slug to get event slug and date
  const parsed = parseEventSlug(slug);

  if (!parsed) {
    console.log('⚠️ [EventPage] Invalid slug format');
    notFound();
  }

  // Fetch event and session in parallel
  const [event, { session }] = await Promise.all([
    getEvent({
      slug: parsed.slug,
      instanceDate: parsed.date,
    }),
    getSession(),
  ]);

  if (!event) {
    console.log('⚠️ [EventPage] Event not found');
    notFound();
  }

  // Check if current user is superadmin
  const userIsSuperAdmin = session ? isSuperAdmin(session.email) : false;

  if (userIsSuperAdmin) {
    console.log('🛡️ [EventPage] Superadmin detected, showing admin toolbar');
  }

  // Determine if this is a parent event (has children) or child event (has parent)
  const isChildEvent = !!event.parent_event_id;

  // Fetch related data in parallel
  const [similarEvents, isHearted, seriesInfo, childData, childCount, siblingEvents] = await Promise.all([
    // Similar events — skip if this is a parent (we'll show children instead)
    // or a child (we'll show siblings instead)
    !isChildEvent
      ? getSimilarEvents({
          eventId: event.id,
          categoryId: event.category?.id ?? null,
          vibeTags: event.vibe_tags ?? [],
          subcultures: event.subcultures ?? [],
          energyLevel: event.energy_level ?? null,
          formality: event.formality ?? null,
          crowdedness: event.crowdedness ?? null,
          accessType: event.access_type ?? null,
          limit: 6,
        })
      : Promise.resolve([]),
    session ? checkSingleHeart(session.id, event.id) : Promise.resolve(false),
    event.series_id ? getSeriesById(event.series_id) : Promise.resolve(null),
    // Fetch children if this might be a parent
    !isChildEvent ? getChildEvents({ parentEventId: event.id }) : Promise.resolve({ events: [], groups: [] }),
    !isChildEvent ? getChildEventCount(event.id) : Promise.resolve(0),
    // Fetch sibling events if this is a child
    isChildEvent && event.parent_event_id
      ? getChildEvents({ parentEventId: event.parent_event_id })
      : Promise.resolve({ events: [], groups: [] }),
  ]);

  const isParentEvent = childCount > 0;
  // Sibling events: other children of the same parent, excluding this event
  const siblingEventCards = isChildEvent
    ? siblingEvents.events.filter((e) => e.id !== event.id).slice(0, 6)
    : [];

  console.log('✅ [EventPage] Event loaded:', event.title);

  // Build admin toolbar event data (only if superadmin)
  const adminToolbarEvent: AdminToolbarEvent | null = userIsSuperAdmin
    ? {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        instance_date: event.instance_date,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        description: event.description,
        short_description: event.short_description,
        price_type: event.price_type,
        price_low: event.price_low,
        price_high: event.price_high,
        is_free: event.is_free,
        ticket_url: event.ticket_url,
        is_all_day: event.is_all_day,
        // External links
        website_url: event.website_url,
        instagram_url: event.instagram_url,
        facebook_url: event.facebook_url,
        registration_url: event.registration_url,
        // Good For audience tags
        good_for: event.good_for || [],
        // Cross-linked entities
        location: event.location ? {
          id: event.location.id,
          name: event.location.name,
          slug: event.location.slug,
          address_line: event.location.address_line,
          city: event.location.city,
          state: event.location.state,
          venue_type: event.location.venue_type,
        } : null,
        organizer: event.organizer ? {
          id: event.organizer.id,
          name: event.organizer.name,
          slug: event.organizer.slug,
          logo_url: event.organizer.logo_url,
          website_url: event.organizer.website_url,
        } : null,
        category: event.category ? {
          id: event.category.id,
          name: event.category.name,
          slug: event.category.slug,
          icon: event.category.icon,
        } : null,
        category_id: event.category?.id || null,
        location_id: event.location?.id || null,
        organizer_id: event.organizer?.id || null,
        // Series info
        series_id: event.series_id,
        series_title: seriesInfo?.title || null,
      }
    : null;

  // Format full address
  const fullAddress = event.location
    ? [
        event.location.address_line,
        event.location.address_line_2,
        event.location.city,
        event.location.state,
        event.location.postal_code,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  // Get category color for accent theming
  const categoryColor = getCategoryColor(event.category?.slug ?? null);

  return (
    <>
      {/* Structured data for SEO */}
      <EventJsonLd
        event={event}
        childEvents={isParentEvent ? childData.events.map((e) => ({
          title: e.title,
          slug: e.slug,
          instance_date: e.instance_date,
          start_datetime: e.start_datetime,
        })) : undefined}
      />

      {/* Admin toolbar for superadmins */}
      {adminToolbarEvent && (
        <AdminToolbar
          event={adminToolbarEvent}
          isSuperAdmin={userIsSuperAdmin}
        />
      )}

      {/* Category accent bar — full-width colored stripe */}
      <div
        className="w-full h-1"
        style={{ backgroundColor: categoryColor.accent }}
        aria-hidden="true"
      />

      <Container className="py-8">
        {/* Breadcrumbs — child events show parent in the trail */}
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/events' },
            ...(event.category
              ? [
                  {
                    label: event.category.name,
                    href: `/events?category=${event.category.slug}`,
                  },
                ]
              : []),
            ...(isChildEvent && event.parent_event_title && event.parent_event_slug
              ? [
                  {
                    label: event.parent_event_title,
                    href: `/event/${event.parent_event_slug}`,
                  },
                ]
              : []),
            { label: event.title },
          ]}
          className="mb-6"
        />

        {/* ── Hero Section ────────────────────────────────── */}

        {/* Hero image — wide banner when no flyer */}
        {!event.flyer_url && (() => {
          const heroImage = getBestImageUrl(event.image_url, null);
          return heroImage ? (
            <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-xl overflow-hidden mb-8">
              <Image
                src={heroImage}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
              {/* Bottom gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div
              className="relative aspect-[21/9] md:aspect-[3/1] rounded-xl overflow-hidden mb-8 flex items-center justify-center"
              style={{ backgroundColor: categoryColor.light }}
            >
              <span
                className="text-6xl md:text-8xl font-body font-bold opacity-20"
                style={{ color: categoryColor.accent }}
              >
                {event.title.charAt(0).toUpperCase()}
              </span>
            </div>
          );
        })()}

        {/* Title + meta header */}
        <div className="mb-8">
          {/* Category badge with dynamic color */}
          {event.category && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-caption font-body font-medium mb-4"
              style={{
                backgroundColor: categoryColor.bg,
                color: categoryColor.text,
              }}
            >
              {event.category.name}
            </span>
          )}

          <h1 className="font-body text-h1 md:text-display text-ink leading-tight">
            {event.title}
          </h1>

          {/* Child count badge for parent events */}
          {isParentEvent && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-3"
              style={{
                backgroundColor: `${categoryColor.accent}15`,
                color: categoryColor.accent,
              }}
            >
              {getChildEventLabel(event.category?.slug ?? null, childCount)}
            </span>
          )}

          {/* Parent group label for child events */}
          {isChildEvent && event.parent_group && (
            <p className="mt-2 text-sm text-zinc">
              {event.parent_group}
            </p>
          )}

          {/* Performer line — from linked entities, or fallback to talent_name */}
          {event.event_performers && event.event_performers.length > 0 ? (
            <p className="mt-2 text-base md:text-lg text-zinc flex items-center gap-2">
              <Mic2 className="w-4 h-4 flex-shrink-0" style={{ color: categoryColor.accent }} />
              <span>
                ft.{' '}
                {event.event_performers.slice(0, 3).map((ep, i) => (
                  <span key={ep.id}>
                    {i > 0 && ', '}
                    <Link
                      href={`/performer/${ep.performer.slug}`}
                      className="font-semibold text-ink hover:text-blue transition-colors"
                    >
                      {ep.performer.name}
                    </Link>
                  </span>
                ))}
                {event.event_performers.length > 3 && (
                  <span className="text-zinc"> +{event.event_performers.length - 3} more</span>
                )}
              </span>
            </p>
          ) : event.talent_name ? (
            <p className="mt-2 text-base md:text-lg text-zinc flex items-center gap-2">
              <Mic2 className="w-4 h-4 flex-shrink-0" style={{ color: categoryColor.accent }} />
              <span>feat. <span className="font-semibold text-ink">{event.talent_name}</span></span>
            </p>
          ) : null}

          {/* One-line summary */}
          {event.short_description && (
            <p className="mt-3 text-lg md:text-xl text-zinc leading-relaxed">
              {event.short_description}
            </p>
          )}

          {/* Prominent date / time / venue line */}
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-base md:text-lg font-medium text-ink">
            <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: categoryColor.accent }} />
            <span>
              {formatDate(event.start_datetime, 'EEEE, MMMM d')}
              {!event.is_all_day && (
                <>
                  {' · '}
                  {formatTime(event.start_datetime)}
                  {event.end_datetime && ` – ${formatTime(event.end_datetime)}`}
                </>
              )}
              {event.is_all_day && ' · All Day'}
            </span>
            {event.location && (
              <>
                <span className="text-zinc">at</span>
                <Link
                  href={buildVenueUrl(event.location)}
                  className="underline decoration-1 underline-offset-2 hover:text-blue transition-colors"
                >
                  {event.location.name}
                </Link>
              </>
            )}
          </div>

          {/* Series badge */}
          {seriesInfo && (
            <div className="mt-4">
              <SeriesLinkBadge
                seriesSlug={seriesInfo.slug}
                seriesTitle={seriesInfo.title}
                seriesType={seriesInfo.series_type}
                sequenceNumber={event.series_sequence}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* ── Two-Column Layout ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Price & audience quick-info bar */}
            <div
              className="flex flex-wrap items-center gap-3 p-4 rounded-xl border"
              style={{
                backgroundColor: categoryColor.light,
                borderColor: `${categoryColor.accent}33`,
              }}
            >
              {/* Price badge */}
              {event.is_free ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald text-white">
                  <Ticket className="w-4 h-4" />
                  Free
                </span>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-ink text-pure">
                  <Ticket className="w-4 h-4" />
                  <EventPrice event={event} showDetails />
                </div>
              )}

              {/* Age / audience */}
              {(event.age_restriction || event.is_family_friendly || event.age_low != null || event.age_high != null) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-pure text-ink border border-mist">
                  <Baby className="w-4 h-4 text-zinc" />
                  {(() => {
                    const parts: string[] = [];
                    const ageRange = formatAgeRange(event.age_low, event.age_high);
                    if (ageRange) parts.push(ageRange);
                    else if (event.age_restriction) parts.push(event.age_restriction);
                    if (event.is_family_friendly) parts.push('Family Friendly');
                    return parts.join(' · ');
                  })()}
                </span>
              )}

              {/* Good For tags */}
              {event.good_for && event.good_for.length > 0 && (
                <>
                  {getGoodForTags(event.good_for).map((tag) => (
                    <a
                      key={tag.slug}
                      href={`/events?goodFor=${tag.slug}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 ${tag.color}`}
                    >
                      {tag.label}
                    </a>
                  ))}
                </>
              )}
            </div>

            {/* Happenlist Editorial Summary */}
            {event.happenlist_summary && (
              <div
                className="p-6 rounded-xl border"
                style={{
                  borderColor: `${categoryColor.accent}30`,
                  backgroundColor: `${categoryColor.accent}08`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" style={{ color: categoryColor.accent }} />
                  <h2 className="font-body text-h4 text-ink">
                    Happenlist Highlights
                  </h2>
                </div>
                <div className="prose-event text-ink/90 leading-relaxed">
                  {event.happenlist_summary}
                </div>
              </div>
            )}

            {/* Performers Section — linked entities with rich display */}
            {event.event_performers && event.event_performers.length > 0 ? (
              <div
                className="p-6 rounded-xl border"
                style={{
                  borderColor: `${categoryColor.accent}25`,
                  backgroundColor: `${categoryColor.accent}06`,
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Mic2 className="w-5 h-5" style={{ color: categoryColor.accent }} />
                  <h2 className="font-body text-h4 text-ink">
                    {event.event_performers.length === 1 ? 'Featured Artist' : 'Lineup'}
                  </h2>
                </div>
                <div className="space-y-4">
                  {event.event_performers.map((ep) => {
                    const isHeadliner = ep.role === 'headliner' || ep.billing_order === 1;
                    return (
                      <div
                        key={ep.id}
                        className={`flex items-start gap-4 ${isHeadliner ? '' : 'pl-2'}`}
                      >
                        {/* Performer image or placeholder */}
                        <Link
                          href={`/performer/${ep.performer.slug}`}
                          className="flex-shrink-0"
                        >
                          {ep.performer.image_url ? (
                            <Image
                              src={ep.performer.image_url}
                              alt={ep.performer.name}
                              width={isHeadliner ? 64 : 48}
                              height={isHeadliner ? 64 : 48}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`rounded-full flex items-center justify-center ${
                                isHeadliner ? 'w-16 h-16' : 'w-12 h-12'
                              }`}
                              style={{ backgroundColor: `${categoryColor.accent}15` }}
                            >
                              <Mic2
                                className={isHeadliner ? 'w-7 h-7' : 'w-5 h-5'}
                                style={{ color: categoryColor.accent }}
                              />
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/performer/${ep.performer.slug}`}
                              className={`font-semibold text-ink hover:text-blue transition-colors ${
                                isHeadliner ? 'text-lg' : 'text-base'
                              }`}
                            >
                              {ep.performer.name}
                            </Link>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                              style={{
                                backgroundColor: `${categoryColor.accent}15`,
                                color: categoryColor.accent,
                              }}
                            >
                              {getPerformerRoleLabel(ep.role)}
                            </span>
                          </div>
                          {ep.performer.genre && (
                            <p className="text-xs text-zinc mt-0.5">{ep.performer.genre}</p>
                          )}
                          {isHeadliner && ep.performer.bio && (
                            <p className="text-sm text-ink/80 mt-1 leading-relaxed line-clamp-3">
                              {ep.performer.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : event.talent_name && event.talent_bio ? (
              /* Fallback: legacy talent_name/talent_bio fields */
              <div
                className="p-6 rounded-xl border"
                style={{
                  borderColor: `${categoryColor.accent}25`,
                  backgroundColor: `${categoryColor.accent}06`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Mic2 className="w-5 h-5" style={{ color: categoryColor.accent }} />
                  <h2 className="font-body text-h4 text-ink">
                    Featured: {event.talent_name}
                  </h2>
                </div>
                <p className="text-ink/80 leading-relaxed">
                  {event.talent_bio}
                </p>
              </div>
            ) : null}

            {/* Membership Benefits Section — linked orgs with benefit badges */}
            {event.event_membership_benefits && event.event_membership_benefits.length > 0 ? (
              <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                  <h2 className="font-body text-h4 text-ink">
                    Member Benefits
                  </h2>
                </div>
                <div className="space-y-3">
                  {event.event_membership_benefits.map((emb) => {
                    const config = getBenefitConfig(emb.benefit_type);
                    return (
                      <div key={emb.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100">
                        {/* Org logo */}
                        <Link
                          href={`/membership/${emb.membership_organization.slug}`}
                          className="flex-shrink-0"
                        >
                          {emb.membership_organization.logo_url ? (
                            <Image
                              src={emb.membership_organization.logo_url}
                              alt={emb.membership_organization.name}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-amber-700" />
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/membership/${emb.membership_organization.slug}`}
                              className="font-medium text-ink hover:text-blue transition-colors text-sm"
                            >
                              {emb.membership_organization.name}
                            </Link>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bgColor} ${config.color}`}>
                              {emb.benefit_type === 'member_price' && emb.member_price
                                ? `$${emb.member_price} member price`
                                : config.label}
                            </span>
                          </div>
                          {emb.benefit_details && (
                            <p className="text-xs text-zinc mt-1">{emb.benefit_details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : event.membership_required && event.membership_details ? (
              /* Fallback: legacy membership text in "How to Attend" section handles this */
              null
            ) : null}

            {/* About This Event (editorial description) */}
            {event.description && (
              <div>
                <h2 className="font-body text-h4 text-ink mb-3">
                  About This Event
                </h2>
                <div className="prose-event text-ink/85 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {/* Organizer Description (Verbatim) */}
            {event.organizer_description && (
              <div className="p-6 bg-pure rounded-xl border border-mist">
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-5 h-5 text-zinc" />
                  <h2 className="font-body text-h4 text-ink">
                    From the Organizer
                  </h2>
                </div>
                <div className="prose-event whitespace-pre-wrap text-ink/80 italic leading-relaxed">
                  {event.organizer_description}
                </div>
              </div>
            )}

            {/* Access & Practical Info */}
            {(event.access_type || event.attendance_mode || event.membership_required) && (
              <div className="p-5 bg-pure rounded-xl border border-mist">
                <div className="flex items-center gap-2 mb-4">
                  <DoorOpen className="w-5 h-5" style={{ color: categoryColor.accent }} />
                  <h2 className="font-body text-h4 text-ink">
                    How to Attend
                  </h2>
                </div>
                <div className="space-y-3">
                  {event.access_type && (
                    <div className="flex items-start gap-3">
                      <Shield className="w-4 h-4 mt-0.5 text-zinc" />
                      <div>
                        <AccessBadge accessType={event.access_type} isFree={event.is_free} />
                        {event.access_type === 'ticketed' && event.ticket_url && (
                          <p className="text-xs text-zinc mt-1">Tickets available online</p>
                        )}
                      </div>
                    </div>
                  )}
                  {event.attendance_mode && (
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 mt-0.5 text-zinc" />
                      <p className="text-sm text-ink">
                        {event.attendance_mode === 'drop_in' && 'Drop in anytime — no commitment needed'}
                        {event.attendance_mode === 'registered' && 'Registration required — must sign up'}
                        {event.attendance_mode === 'hybrid' && 'Drop-in or register — either works'}
                      </p>
                    </div>
                  )}
                  {event.membership_required && event.membership_details && (
                    <div className="flex items-start gap-3">
                      <Shield className="w-4 h-4 mt-0.5 text-zinc" />
                      <p className="text-sm text-ink">{event.membership_details}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vibe Profile — "What's It Actually Like?" */}
            <VibeProfileSection event={event} accentColor={categoryColor.accent} />

            {/* Price Details Section */}
            {event.price_details && (
              <div className="p-5 bg-emerald/10 rounded-xl border border-sage/30">
                <h3 className="font-body text-h4 text-ink mb-2 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-emerald" />
                  Pricing Details
                </h3>
                <p className="text-ink/80 leading-relaxed">
                  {event.price_details}
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Event flyer (top of sidebar) */}
              {event.flyer_url && (
                <FlyerLightbox
                  flyerUrl={event.flyer_url}
                  alt={`${event.title} event flyer`}
                  eventTitle={event.title}
                  className="w-full"
                />
              )}

              {/* Primary CTA Button — big, rounded-full, coral */}
              <div className="space-y-3">
                {event.ticket_url ? (
                  <Button
                    href={event.ticket_url}
                    external
                    fullWidth
                    size="lg"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                    className="!rounded-full"
                  >
                    Get Tickets
                  </Button>
                ) : event.registration_url ? (
                  <Button
                    href={event.registration_url}
                    external
                    fullWidth
                    size="lg"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                    className="!rounded-full"
                  >
                    Register / RSVP
                  </Button>
                ) : event.website_url ? (
                  <Button
                    href={event.website_url}
                    external
                    fullWidth
                    size="lg"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                    className="!rounded-full"
                  >
                    Learn More
                  </Button>
                ) : null}

                {/* Secondary Learn More (when there's already a primary CTA) */}
                {event.website_url && (event.ticket_url || event.registration_url) && (
                  <Button
                    href={event.website_url}
                    external
                    fullWidth
                    variant="secondary"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                    className="!rounded-full"
                  >
                    Learn More
                  </Button>
                )}

                {/* Original event listing link */}
                {event.source_url && (
                  <Button
                    href={event.source_url}
                    external
                    fullWidth
                    variant="ghost"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                    className="!rounded-full"
                  >
                    View Original Listing
                  </Button>
                )}
              </div>

              {/* Heart + Share side by side */}
              <div className="flex gap-3">
                <HeartButton
                  eventId={event.id}
                  initialHearted={isHearted}
                  initialCount={event.heart_count ?? 0}
                  size="lg"
                  className="flex-1 bg-pure border border-mist hover:border-blue/30 !rounded-full"
                />
                <ShareButton
                  title={event.title}
                  text={event.short_description || undefined}
                  className="flex-1 !rounded-full"
                />
              </div>

              {/* Event details card */}
              <div
                className="p-5 rounded-xl border overflow-hidden"
                style={{ borderColor: `${categoryColor.accent}30` }}
              >
                {/* Colored top stripe */}
                <div
                  className="h-0.5 -mx-5 -mt-5 mb-5"
                  style={{ backgroundColor: categoryColor.accent }}
                  aria-hidden="true"
                />

                {/* Date */}
                <div className="flex items-start gap-3 mb-4">
                  <Calendar className="w-5 h-5 mt-0.5" style={{ color: categoryColor.accent }} />
                  <div>
                    <p className="font-semibold text-ink">
                      {formatEventDate(event.start_datetime, { format: 'long', includeTime: false })}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="mb-4">
                  <EventDateTime
                    startDatetime={event.start_datetime}
                    endDatetime={event.end_datetime}
                    isAllDay={event.is_all_day}
                    timezone={event.timezone}
                    variant="full"
                    showIcon
                  />
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 mt-0.5" style={{ color: categoryColor.accent }} />
                    <div>
                      <Link
                        href={buildVenueUrl(event.location)}
                        className="font-medium text-ink hover:text-blue transition-colors"
                      >
                        {event.location.name}
                      </Link>
                      {fullAddress && (
                        <p className="text-body-sm text-zinc mt-0.5">{fullAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-start gap-3 mb-4">
                  <Ticket className="w-5 h-5 mt-0.5" style={{ color: categoryColor.accent }} />
                  <EventPrice event={event} showDetails />
                </div>

                {/* Age / audience info */}
                {(event.age_restriction || event.is_family_friendly || event.age_low != null || event.age_high != null) && (
                  <div className="flex items-start gap-3">
                    <Baby className="w-5 h-5 mt-0.5" style={{ color: categoryColor.accent }} />
                    <div>
                      {(() => {
                        const ageRange = formatAgeRange(event.age_low, event.age_high);
                        return ageRange ? (
                          <p className="font-medium text-ink">{ageRange}</p>
                        ) : event.age_restriction ? (
                          <p className="font-medium text-ink">{event.age_restriction}</p>
                        ) : null;
                      })()}
                      {event.is_family_friendly && (
                        <p className="text-body-sm text-emerald flex items-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5" />
                          Family Friendly
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Organizer card */}
              {event.organizer && !event.organizer_is_venue && (
                <div className="p-4 bg-pure rounded-xl border border-mist">
                  <h3 className="text-body-sm font-medium text-zinc uppercase tracking-wide mb-3">
                    Presented By
                  </h3>
                  <Link
                    href={buildOrganizerUrl(event.organizer)}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-cloud flex items-center justify-center overflow-hidden flex-shrink-0">
                      {event.organizer.logo_url ? (
                        <Image
                          src={event.organizer.logo_url}
                          alt={event.organizer.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-zinc" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink group-hover:text-blue transition-colors truncate">
                        {event.organizer.name}
                      </p>
                      <p className="text-xs text-zinc">View all events</p>
                    </div>
                  </Link>
                </div>
              )}

              {/* External Links */}
              {(event.website_url || event.instagram_url || event.facebook_url || event.registration_url) && (
                <div className="p-4 bg-pure rounded-xl border border-mist">
                  <h3 className="text-body-sm font-medium text-zinc uppercase tracking-wide mb-3">
                    Links & More
                  </h3>
                  <EventLinks
                    websiteUrl={event.website_url}
                    instagramUrl={event.instagram_url}
                    facebookUrl={event.facebook_url}
                    registrationUrl={event.registration_url}
                    variant="full"
                  />
                </div>
              )}

              {/* Interactive Map */}
              {event.location?.latitude && event.location?.longitude && (
                <div className="rounded-xl overflow-hidden">
                  <VenueMap
                    latitude={Number(event.location.latitude)}
                    longitude={Number(event.location.longitude)}
                    venueName={event.location.name}
                    address={fullAddress || undefined}
                    venueType={event.location.venue_type}
                    height="180px"
                    zoom={15}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Child events schedule — shown on parent event pages */}
        {isParentEvent && childData.events.length > 0 && (
          <section className="mt-16">
            <SectionHeader title="Schedule" />
            <ChildEventsSchedule
              events={childData.events}
              groups={childData.groups}
              categorySlug={event.category?.slug ?? null}
            />
          </section>
        )}

        {/* Sibling events — shown on child event pages */}
        {isChildEvent && siblingEventCards.length > 0 && (
          <section className="mt-16">
            <SectionHeader
              title={`More from ${event.parent_event_title || 'This Event'}`}
            />
            <EventGrid events={siblingEventCards} columns={4} />
          </section>
        )}

        {/* Similar events — shown on standalone events (not parent/child) */}
        {!isParentEvent && !isChildEvent && similarEvents.length > 0 && (
          <section className="mt-16">
            <SectionHeader title="Events Like This" />
            <EventGrid events={similarEvents} columns={4} />
          </section>
        )}
      </Container>
    </>
  );
}
