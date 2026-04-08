/**
 * GET MEMBERSHIP ORGANIZATIONS
 * ============================
 * Fetches membership orgs with optional filtering and pagination.
 */

import { createClient } from '@/lib/supabase/server';
import type { MembershipOrgCard } from '@/types';

interface GetMembershipOrgsParams {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetches active membership organizations with event counts.
 */
export async function getMembershipOrgs(
  params: GetMembershipOrgsParams = {}
): Promise<{ orgs: MembershipOrgCard[]; total: number }> {
  const { search, page = 1, limit = 24 } = params;

  console.log('🏛️ [getMembershipOrgs] Fetching membership orgs:', { search, page, limit });

  const supabase = await createClient();
  const offset = (page - 1) * limit;
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('membership_organizations')
    .select('id, name, slug, logo_url, description', { count: 'exact' })
    .eq('is_active', true);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getMembershipOrgs] Error:', error);
    throw error;
  }

  // Count upcoming events per org
  const orgs: MembershipOrgCard[] = [];
  if (data && data.length > 0) {
    const orgIds = data.map((o) => o.id);

    const { data: benefitLinks } = await supabase
      .from('event_membership_benefits')
      .select('membership_org_id, event:events!inner(id, instance_date, status, deleted_at)')
      .in('membership_org_id', orgIds)
      .gte('event.instance_date', today)
      .eq('event.status', 'published')
      .is('event.deleted_at', null);

    const countMap = new Map<string, number>();
    if (benefitLinks) {
      for (const link of benefitLinks) {
        const oid = (link as { membership_org_id: string }).membership_org_id;
        countMap.set(oid, (countMap.get(oid) || 0) + 1);
      }
    }

    for (const o of data) {
      orgs.push({
        id: o.id,
        name: o.name,
        slug: o.slug,
        logo_url: o.logo_url,
        description: o.description,
        event_count: countMap.get(o.id) || 0,
      });
    }

    // Sort by event count descending (most valuable memberships first)
    orgs.sort((a, b) => b.event_count - a.event_count);
  }

  console.log(`✅ [getMembershipOrgs] Found ${orgs.length} orgs (total: ${count})`);

  return {
    orgs,
    total: count || 0,
  };
}
