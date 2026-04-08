/**
 * SUGGEST SIMILAR EVENTS API ROUTE
 * ==================================
 * POST /api/superadmin/events/suggest-similar
 *
 * Given a set of selected events, searches the database for other events
 * that likely belong to the same series. Uses multiple heuristics:
 *   - Title similarity (fuzzy match)
 *   - Same location
 *   - Same organizer
 *   - Same category
 *   - Same day-of-week pattern
 *   - Not already in a series
 *
 * Returns scored suggestions sorted by relevance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface SuggestedEvent {
  id: string;
  title: string;
  start_datetime: string | null;
  instance_date: string | null;
  location_name: string | null;
  organizer_name: string | null;
  category_name: string | null;
  status: string;
  series_id: string | null;
  match_reasons: string[];
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperadminAuth();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { eventIds } = body as { eventIds: string[] };

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'eventIds is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the selected events with their relationships
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: selectedEvents, error: fetchError } = await (supabase as any)
      .from('events')
      .select(`
        id, title, start_datetime, instance_date,
        category_id, location_id, organizer_id,
        categories ( name ),
        locations ( name ),
        organizers ( name )
      `)
      .in('id', eventIds);

    if (fetchError || !selectedEvents || selectedEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch selected events' },
        { status: 404 }
      );
    }

    // Extract signature from selected events for matching
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const titles = selectedEvents.map((e: any) => e.title?.toLowerCase() || '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryIds = [...new Set(selectedEvents.map((e: any) => e.category_id).filter(Boolean))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locationIds = [...new Set(selectedEvents.map((e: any) => e.location_id).filter(Boolean))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organizerIds = [...new Set(selectedEvents.map((e: any) => e.organizer_id).filter(Boolean))];

    // Extract common title words (3+ chars, appearing in most events)
    const wordCounts = new Map<string, number>();
    for (const title of titles) {
      const words: Set<string> = new Set(title.split(/\s+/).filter((w: string) => w.length >= 3));
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    const threshold = Math.max(1, Math.floor(titles.length * 0.5));
    const commonWords = [...wordCounts.entries()]
      .filter(([, count]) => count >= threshold)
      .map(([word]) => word)
      .slice(0, 5); // Top 5 common words

    // Build a broad search: events matching location OR organizer OR category
    // that are NOT in the selected set and NOT deleted
    const conditions: string[] = [];
    if (locationIds.length > 0) {
      conditions.push(`location_id.in.(${locationIds.join(',')})`);
    }
    if (organizerIds.length > 0) {
      conditions.push(`organizer_id.in.(${organizerIds.join(',')})`);
    }
    if (categoryIds.length > 0) {
      conditions.push(`category_id.in.(${categoryIds.join(',')})`);
    }

    if (conditions.length === 0 && commonWords.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Not enough data to find similar events',
      });
    }

    // Query candidates: same location/organizer/category OR title match, not deleted, not in selected set
    // Include title keyword ilike conditions so title-only matches aren't missed
    const allOrConditions = [...conditions];
    for (const word of commonWords.slice(0, 3)) {
      allOrConditions.push(`title.ilike.%${word}%`);
    }

    if (allOrConditions.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Not enough data to find similar events',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = (supabase as any)
      .from('events')
      .select(`
        id, title, start_datetime, instance_date, status,
        category_id, location_id, organizer_id, series_id,
        categories ( name ),
        locations ( name ),
        organizers ( name )
      `)
      .is('deleted_at', null)
      .not('id', 'in', `(${eventIds.join(',')})`)
      .or(allOrConditions.join(','))
      .limit(200);

    const { data: candidates, error: candidateError } = await query;

    if (candidateError) {
      console.error('Candidate search failed:', candidateError);
      return NextResponse.json(
        { success: false, error: 'Search failed' },
        { status: 500 }
      );
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No similar events found',
      });
    }

    // Score each candidate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scored: SuggestedEvent[] = candidates.map((c: any) => {
      let score = 0;
      const reasons: string[] = [];

      // Title similarity: count matching common words
      const candidateTitle = (c.title || '').toLowerCase();
      const matchingWords = commonWords.filter(w => candidateTitle.includes(w));
      if (matchingWords.length > 0) {
        score += matchingWords.length * 3; // 3 points per matching word
        reasons.push(`title matches: "${matchingWords.join(', ')}"`);
      }

      // Same location
      if (c.location_id && locationIds.includes(c.location_id)) {
        score += 2;
        reasons.push('same location');
      }

      // Same organizer
      if (c.organizer_id && organizerIds.includes(c.organizer_id)) {
        score += 3;
        reasons.push('same organizer');
      }

      // Same category
      if (c.category_id && categoryIds.includes(c.category_id)) {
        score += 1;
        reasons.push('same category');
      }

      // Day-of-week match with selected events
      if (c.start_datetime) {
        const candidateDay = new Date(c.start_datetime).getDay();
        const selectedDays = selectedEvents
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((e: any) => e.start_datetime ? new Date(e.start_datetime).getDay() : -1)
          .filter((d: number) => d >= 0);
        if (selectedDays.includes(candidateDay)) {
          score += 1;
          reasons.push('same day of week');
        }
      }

      // Not already in a series = more likely to be an orphan that needs grouping
      if (!c.series_id) {
        score += 1;
        reasons.push('not in a series');
      }

      return {
        id: c.id,
        title: c.title,
        start_datetime: c.start_datetime,
        instance_date: c.instance_date,
        location_name: c.locations?.name || null,
        organizer_name: c.organizers?.name || null,
        category_name: c.categories?.name || null,
        status: c.status,
        series_id: c.series_id,
        match_reasons: reasons,
        score,
      };
    });

    // Filter to score >= 4 (at least a title + something else, or organizer + location)
    // Sort by score descending, limit to 20
    const suggestions = scored
      .filter(s => s.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      suggestions,
      totalCandidates: candidates.length,
      message: suggestions.length > 0
        ? `Found ${suggestions.length} events that might belong to this series`
        : 'No strong matches found',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    console.error('Unexpected error in suggest-similar:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
