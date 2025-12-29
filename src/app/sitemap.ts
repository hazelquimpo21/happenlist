/**
 * SITEMAP GENERATOR
 * =================
 * Dynamic sitemap for SEO. Includes all events, venues, and organizers.
 */

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/lib/constants';
import { buildEventUrl, buildVenueUrl, buildOrganizerUrl } from '@/lib/utils';

/**
 * Generate sitemap with all public pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  console.log('🗺️ [Sitemap] Generating sitemap...');

  const supabase = await createClient();
  const baseUrl = SITE_CONFIG.url;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events/today`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events/this-weekend`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/venues`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/organizers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch events
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('slug, instance_date, updated_at')
    .eq('status', 'published')
    .gte('instance_date', new Date().toISOString().split('T')[0])
    .order('instance_date', { ascending: true })
    .limit(1000);

  if (eventsError) {
    console.error('❌ [Sitemap] Error fetching events:', eventsError);
  }

  const events = eventsData as { slug: string; instance_date: string; updated_at: string }[] | null;

  const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${baseUrl}${buildEventUrl({ slug: event.slug, instance_date: event.instance_date })}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Fetch venues
  const { data: venuesData, error: venuesError } = await supabase
    .from('locations')
    .select('slug, updated_at')
    .eq('is_active', true)
    .limit(500);

  if (venuesError) {
    console.error('❌ [Sitemap] Error fetching venues:', venuesError);
  }

  const venues = venuesData as { slug: string; updated_at: string }[] | null;

  const venuePages: MetadataRoute.Sitemap = (venues || []).map((venue) => ({
    url: `${baseUrl}${buildVenueUrl({ slug: venue.slug })}`,
    lastModified: new Date(venue.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Fetch organizers
  const { data: organizersData, error: organizersError } = await supabase
    .from('organizers')
    .select('slug, updated_at')
    .eq('is_active', true)
    .limit(500);

  if (organizersError) {
    console.error('❌ [Sitemap] Error fetching organizers:', organizersError);
  }

  const organizers = organizersData as { slug: string; updated_at: string }[] | null;

  const organizerPages: MetadataRoute.Sitemap = (organizers || []).map(
    (organizer) => ({
      url: `${baseUrl}${buildOrganizerUrl({ slug: organizer.slug })}`,
      lastModified: new Date(organizer.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })
  );

  const allPages = [
    ...staticPages,
    ...eventPages,
    ...venuePages,
    ...organizerPages,
  ];

  console.log(`✅ [Sitemap] Generated sitemap with ${allPages.length} URLs`);

  return allPages;
}
