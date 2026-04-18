/**
 * =============================================================================
 * EVENT DETAIL PAGE — /event/[slug]
 * =============================================================================
 *
 * Composition-only file. All rendering logic lives in:
 *   - src/components/events/poster-hero.tsx
 *   - src/components/events/ticket-stub.tsx
 *   - src/components/events/mobile-action-bar.tsx
 *   - src/components/events/how-it-feels-section.tsx
 *   - src/app/event/[slug]/_sections/* (page-specific editorial sections)
 *
 * All pure helpers live in:
 *   - src/lib/utils/event-detail.ts (price/age summaries, timing, calendar URL)
 *
 * Page rhythm (top → bottom):
 *   1. PosterHero             — full-bleed category slab
 *   2. StampedRow             — monospace quick-hits bar
 *   3. Breadcrumbs + banners
 *   4. Short description      — elevated editorial lead
 *   5. Two-column body:
 *        main  → SeriesContext → WhyWePicked → PersonalityStickers →
 *                Lineup/LegacyTalent → MemberBenefits → About →
 *                OrganizerQuote → GettingIn → SeriesDetails → PastInstances →
 *                VibeProfile (legacy surfaces only) → PriceDetails
 *        aside → TicketStub (sticky on desktop)
 *   6. HowItFeelsSection      — full-bleed dark signals editorial
 *   7. Schedule / siblings / similar events
 *   8. MobileActionBar        — sticky bottom bar (mobile only)
 *
 * Legacy signal surfaces inside <VibeProfileSection> (sensory / leave_with /
 * social_mode / energy_needed) still render on this page — they're mirrored
 * by the new <HowItFeelsSection> one level down. Accepted duplication for v1.
 * Add an `excludeNewSignals` prop to VibeProfileSection if this gets noisy.
 *
 * Redesign: "The Ticket Stub" (2026-04-18). See
 *   HQ Files/Claude/Claude Outputs/happenlist/2026-04-18/review-report.html
 * =============================================================================
 */

export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/layout';
import { Sticker } from '@/components/ui';
import {
  EventGrid,
  VibeProfileSection,
  ChildEventsSchedule,
  PastInstances,
  ViewTracker,
  PastEventBanner,
  PosterHero,
  HowItFeelsSection,
  TicketStub,
  MobileActionBar,
} from '@/components/events';
import { SeriesContextBlock } from '@/components/series';
import { EventJsonLd } from '@/components/seo';
import { AdminToolbar, type AdminToolbarEvent } from '@/components/admin-anywhere';
import { getEvent, getSimilarEvents, getChildEvents, getChildEventCount } from '@/data/events';
import { getSeriesById, getSeriesStats } from '@/data/series';
import { checkSingleHeart } from '@/data/user';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { getGoodForTags } from '@/types';
import { getCategoryColor } from '@/lib/constants/category-colors';
import {
  parseEventSlug,
  getTimingBadge,
  formatPriceSummary,
  formatAgeSummary,
  isPastEvent as checkIsPastEvent,
  buildGoogleCalendarUrl,
  getChildEventLabel,
} from '@/lib/utils';
import {
  StampedRow,
  AboutSection,
  OrganizerQuote,
  GettingIn,
  SeriesDetailsAccordion,
  MemberBenefits,
  PriceDetails,
  ProTips,
  TailSectionHeader,
  Chapter,
  EditorsTake,
} from './_sections';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseEventSlug(slug);
  if (!parsed) return { title: 'Event Not Found' };

  const event = await getEvent({ slug: parsed.slug, instanceDate: parsed.date });
  if (!event) return { title: 'Event Not Found' };

  const title = event.meta_title || event.title;
  const description =
    event.meta_description || event.short_description || event.description?.slice(0, 155);
  const ogImage = event.image_url || event.flyer_url || undefined;

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

// =============================================================================
// PAGE
// =============================================================================

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  console.log('🎫 [EventPage] Rendering event:', slug);

  const parsed = parseEventSlug(slug);
  if (!parsed) {
    console.log('⚠️ [EventPage] Invalid slug format');
    notFound();
  }

  const [event, { session }] = await Promise.all([
    getEvent({ slug: parsed.slug, instanceDate: parsed.date }),
    getSession(),
  ]);

  if (!event) {
    console.log('⚠️ [EventPage] Event not found');
    notFound();
  }

  const userIsSuperAdmin = session ? isSuperAdmin(session.email) : false;
  const isChildEvent = !!event.parent_event_id;

  const [similarEvents, isHearted, seriesInfo, seriesStats, childData, childCount, siblingEvents] =
    await Promise.all([
      !isChildEvent
        ? getSimilarEvents({
            eventId: event.id,
            categoryId: event.category?.id ?? null,
            vibeTags: event.vibe_tags ?? [],
            subcultures: event.subcultures ?? [],
            energyLevel: event.energy_level ?? null,
            accessType: event.access_type ?? null,
            limit: 6,
          })
        : Promise.resolve([]),
      session ? checkSingleHeart(session.id, event.id) : Promise.resolve(false),
      event.series_id ? getSeriesById(event.series_id) : Promise.resolve(null),
      event.series_id
        ? getSeriesStats(event.series_id)
        : Promise.resolve({ totalEvents: 0, upcomingEvents: 0, pastEvents: 0, nextEventDate: null }),
      !isChildEvent
        ? getChildEvents({ parentEventId: event.id })
        : Promise.resolve({ events: [], groups: [] }),
      !isChildEvent ? getChildEventCount(event.id) : Promise.resolve(0),
      isChildEvent && event.parent_event_id
        ? getChildEvents({ parentEventId: event.parent_event_id })
        : Promise.resolve({ events: [], groups: [] }),
    ]);

  const isParentEvent = childCount > 0;
  const siblingEventCards = isChildEvent
    ? siblingEvents.events.filter((e) => e.id !== event.id).slice(0, 6)
    : [];

  console.log('✅ [EventPage] Event loaded:', event.title);

  // Derived values — all come from centralized helpers.
  const categoryColor = getCategoryColor(event.category?.slug ?? null);
  const timingBadge = getTimingBadge(event.start_datetime);
  const isPastEvt = checkIsPastEvent(event.instance_date);
  const calendarUrl = buildGoogleCalendarUrl(
    event as Parameters<typeof buildGoogleCalendarUrl>[0],
  );
  const priceSummary = formatPriceSummary(event);
  const ageSummary = formatAgeSummary(event);
  const goodForTags = getGoodForTags(event.good_for || []);

  // Admin toolbar (superadmin-only)
  const adminToolbarEvent = userIsSuperAdmin ? buildAdminToolbarEvent(event, seriesInfo) : null;

  return (
    <>
      <ViewTracker eventId={event.id} />
      <EventJsonLd
        event={event}
        childEvents={
          isParentEvent
            ? childData.events.map((e) => ({
                title: e.title,
                slug: e.slug,
                instance_date: e.instance_date,
                start_datetime: e.start_datetime,
              }))
            : undefined
        }
      />
      {adminToolbarEvent && <AdminToolbar event={adminToolbarEvent} isSuperAdmin={userIsSuperAdmin} />}

      {/* 1. POSTER HERO */}
      <PosterHero event={event} categoryColor={categoryColor} timingBadge={timingBadge} />

      {/* 2. STAMPED QUICK-HITS ROW */}
      <StampedRow
        priceSummary={priceSummary}
        ageSummary={ageSummary}
        accessType={event.access_type ?? null}
        isFree={event.is_free ?? false}
        goodForTags={goodForTags}
      />

      <Container className="py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/events' },
            ...(event.category
              ? [{ label: event.category.name, href: `/events?category=${event.category.slug}` }]
              : []),
            ...(isChildEvent && event.parent_event_title && event.parent_event_slug
              ? [{ label: event.parent_event_title, href: `/event/${event.parent_event_slug}` }]
              : []),
            { label: event.title },
          ]}
          className="mb-6"
        />

        {isPastEvt && (
          <PastEventBanner
            organizerName={event.organizer?.name}
            organizerSlug={event.organizer?.slug}
          />
        )}

        {event.sold_out && !isPastEvt && (
          <div className="mb-6 flex items-start gap-4">
            <Sticker variant="warning" rotate={-3}>
              Sold Out
            </Sticker>
            {event.sold_out_details && (
              <p className="text-sm text-zinc pt-1">{event.sold_out_details}</p>
            )}
          </div>
        )}

        {/* Child/parent banner meta (tiny eyebrow above the lead) */}
        {isParentEvent && event.category && (
          <p
            className="mb-6 font-mono text-[11px] font-bold tracking-[0.15em] uppercase"
            style={{ color: categoryColor.accent }}
          >
            {getChildEventLabel(event.category.slug ?? null, childCount)}
          </p>
        )}
        {isChildEvent && event.parent_group && (
          <p className="mb-6 font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-zinc">
            {event.parent_group}
          </p>
        )}

        {event.short_description && (
          <p className="mb-10 text-lg md:text-xl font-medium text-slate leading-snug max-w-3xl">
            {event.short_description}
          </p>
        )}

        {/* MAIN + SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
          <main className="space-y-20 min-w-0">
            {/*
              Main column is structured as four chapters:
                I   · The pitch       (editorial, warm)
                II  · The lineup      (dark aside, concert-bill feel)
                III · The details     (practical, default)
                IV  · How it feels    (full-bleed — rendered OUTSIDE Container below)

              Each Chapter only renders if it has content. A chapter with zero
              child sections returns null via the `hasContent` guard below.
            */}

            {/* ── Series context — stands outside the chapter flow because it's
                contextual framing, not part of the narrative. */}
            {seriesInfo && (
              <SeriesContextBlock
                seriesInfo={seriesInfo}
                categorySlug={event.category?.slug ?? null}
                sequenceNumber={event.series_sequence}
                upcomingCount={Math.max(0, (seriesStats.upcomingEvents ?? 0) - 1)}
                hasPastInstances={(seriesStats.pastEvents ?? 0) > 0}
              />
            )}

            {/* Part I ("The people") was dropped — the hero's "ft. X, Y, Z"
                line (linked to performer pages) carries enough, and a full
                chapter felt over-dignified for info that lives better on
                the performer pages themselves. LineupSection + LegacyTalent
                still exported from _sections/ for potential future use. */}

            {/* ── Part I · The details ── */}
            <Chapter number="I" title="The details" accentColor={categoryColor.accent}>
              {event.description && (
                <AboutSection description={event.description} accentColor={categoryColor.accent} />
              )}

              {event.organizer_description && (
                <OrganizerQuote
                  body={event.organizer_description}
                  accentColor={categoryColor.accent}
                  organizerName={event.organizer?.name}
                  organizerIsVenue={event.organizer_is_venue}
                />
              )}

              <GettingIn
                accessType={event.access_type}
                attendanceMode={event.attendance_mode}
                hasTicketUrl={!!event.ticket_url}
                membershipRequired={event.membership_required}
                membershipDetails={event.membership_details}
                isFree={event.is_free}
                accentColor={categoryColor.accent}
              />

              {event.event_membership_benefits &&
                event.event_membership_benefits.length > 0 && (
                  <MemberBenefits benefits={event.event_membership_benefits} />
                )}

              {event.price_details && <PriceDetails details={event.price_details} />}

              {Array.isArray(event.pro_tips) && event.pro_tips.length > 0 && (
                <ProTips tips={event.pro_tips} accentColor={categoryColor.accent} />
              )}

              {seriesInfo && <SeriesDetailsAccordion seriesInfo={seriesInfo} />}

              {event.series_id && (
                <PastInstances seriesId={event.series_id} excludeEventId={event.id} />
              )}

              {/* Legacy vibe surfaces (energy bars, vibe_tags, subcultures,
                  noise_level, expected_crowd). The NEW signals (sensory,
                  leave_with, social_mode, energy_needed, accessibility)
                  live in HowItFeelsSection below (Part IV). */}
              <VibeProfileSection event={event} accentColor={categoryColor.accent} />
            </Chapter>
          </main>

          <aside className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* EditorsTake sits ABOVE the ticket stub — it's the "why"
                  that frames the save action, not a sidebar footnote. */}
              <EditorsTake
                summary={event.happenlist_summary}
                personalityBadges={event.personality_badges}
                accentColor={categoryColor.accent}
              />
              <TicketStub
                event={event}
                isHearted={isHearted}
                isPastEvent={isPastEvt}
                calendarUrl={calendarUrl}
                categoryColor={categoryColor}
              />
            </div>
          </aside>
        </div>
      </Container>

      {/* 6. HOW IT FEELS — full-bleed signals editorial */}
      <HowItFeelsSection event={event} accentColor={categoryColor.accent} />

      <Container className="py-16 md:py-20">
        {isParentEvent && childData.events.length > 0 && (
          <section className="mb-16">
            <TailSectionHeader
              eyebrow="Full schedule"
              headline="Every date, all the details"
              accentColor={categoryColor.accent}
            />
            <ChildEventsSchedule
              events={childData.events}
              groups={childData.groups}
              categorySlug={event.category?.slug ?? null}
            />
          </section>
        )}

        {isChildEvent && siblingEventCards.length > 0 && (
          <section className="mb-16">
            <TailSectionHeader
              eyebrow="Also part of this"
              headline={`More from ${event.parent_event_title || 'this event'}`}
              accentColor={categoryColor.accent}
            />
            <EventGrid events={siblingEventCards} columns={4} />
          </section>
        )}

        {!isParentEvent && !isChildEvent && similarEvents.length > 0 && (
          <section className="mb-16">
            <TailSectionHeader
              eyebrow="More like this"
              headline="More from around town"
              accentColor={categoryColor.accent}
            />
            <EventGrid events={similarEvents} columns={4} />
          </section>
        )}
      </Container>

      <MobileActionBar
        event={event}
        isHearted={isHearted}
        isPastEvent={isPastEvt}
        categoryColor={categoryColor}
      />

      {/* Spacer so the sticky mobile bar doesn't cover the last line of content */}
      <div className="md:hidden h-20" aria-hidden="true" />
    </>
  );
}

// =============================================================================
// Admin toolbar payload builder — isolated to keep the render path readable.
// =============================================================================

function buildAdminToolbarEvent(
  event: Awaited<ReturnType<typeof getEvent>> & object,
  seriesInfo: Awaited<ReturnType<typeof getSeriesById>>,
): AdminToolbarEvent {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    status: event.status ?? 'draft',
    instance_date: event.instance_date,
    start_datetime: event.start_datetime,
    end_datetime: event.end_datetime,
    description: event.description,
    short_description: event.short_description,
    price_type: event.price_type,
    price_low: event.price_low,
    price_high: event.price_high,
    is_free: event.is_free ?? false,
    ticket_url: event.ticket_url,
    is_all_day: event.is_all_day ?? false,
    website_url: event.website_url,
    instagram_url: event.instagram_url,
    facebook_url: event.facebook_url,
    registration_url: event.registration_url,
    good_for: event.good_for || [],
    location: event.location
      ? {
          id: event.location.id,
          name: event.location.name,
          slug: event.location.slug,
          address_line: event.location.address_line,
          city: event.location.city,
          state: event.location.state,
          venue_type: event.location.venue_type ?? '',
        }
      : null,
    organizer: event.organizer
      ? {
          id: event.organizer.id,
          name: event.organizer.name,
          slug: event.organizer.slug,
          logo_url: event.organizer.logo_url,
          website_url: event.organizer.website_url,
        }
      : null,
    category: event.category
      ? {
          id: event.category.id,
          name: event.category.name,
          slug: event.category.slug,
          icon: event.category.icon,
        }
      : null,
    category_id: event.category?.id || null,
    location_id: event.location?.id || null,
    organizer_id: event.organizer?.id || null,
    series_id: event.series_id,
    series_title: seriesInfo?.title || null,
  };
}
