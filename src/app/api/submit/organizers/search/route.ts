/**
 * ORGANIZER SEARCH API ROUTE
 * ==========================
 * API route for searching organizers by name.
 *
 * GET /api/submit/organizers/search?q=query&limit=20
 * GET /api/submit/organizers/search?id=uuid
 *
 * @module api/submit/organizers/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('API.Organizers');

export async function GET(request: NextRequest) {
  const timer = logger.time('GET /api/submit/organizers/search');

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const id = searchParams.get('id') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = await createClient();

    // Fetch a single organizer by ID
    if (id) {
      const { data, error } = await supabase
        .from('organizers')
        .select('id, name, slug, logo_url, website_url, description')
        .eq('id', id)
        .single();

      if (error) {
        timer.error('Failed to fetch organizer by id', error);
        return NextResponse.json({ success: true, organizer: null });
      }

      timer.success(`Fetched organizer by id: ${id}`);
      return NextResponse.json({ success: true, organizer: data });
    }

    // If no query, return organizers sorted by name
    if (!query.trim()) {
      const { data, error } = await supabase
        .from('organizers')
        .select('id, name, slug, logo_url, website_url, description')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        timer.error('Failed to fetch organizers', error);
        return NextResponse.json({ success: false, organizers: [], error: 'Failed to fetch organizers' }, { status: 500 });
      }

      timer.success(`Returned ${data?.length || 0} organizers (no query)`);
      return NextResponse.json({
        success: true,
        organizers: data || [],
        query: '',
        count: data?.length || 0,
      });
    }

    // Search by name with ILIKE
    const { data, error } = await supabase
      .from('organizers')
      .select('id, name, slug, logo_url, website_url, description')
      .eq('is_active', true)
      .ilike('name', `%${query.trim()}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      timer.error('Organizer search failed', error);
      return NextResponse.json({ success: false, organizers: [], error: 'Search failed' }, { status: 500 });
    }

    timer.success(`Found ${data?.length || 0} organizers for "${query}"`);

    return NextResponse.json({
      success: true,
      organizers: data || [],
      query: query.trim(),
      count: data?.length || 0,
    });
  } catch (error) {
    timer.error('Unexpected error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search organizers', organizers: [] },
      { status: 500 }
    );
  }
}
