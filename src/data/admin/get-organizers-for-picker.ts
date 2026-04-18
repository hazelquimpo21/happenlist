/**
 * GET ORGANIZERS FOR PICKER
 * =========================
 * Small list of organizers for use in admin form dropdowns (currently
 * membership-org create/edit). Uses the service-role client so inactive
 * organizers still show up — an admin can assign a membership org to a
 * temporarily-inactive organizer.
 *
 * Returns id + name + is_membership_org for sorting (membership orgs first).
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface PickerOrganizer {
  id: string;
  name: string;
  is_membership_org: boolean;
}

export async function getOrganizersForPicker(): Promise<PickerOrganizer[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('organizers')
    .select('id, name, is_membership_org')
    .order('name', { ascending: true })
    .limit(500);

  if (error) {
    console.error('[getOrganizersForPicker] query failed:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) || []).map((r) => ({
    id: r.id,
    name: r.name,
    is_membership_org: !!r.is_membership_org,
  }));
}
