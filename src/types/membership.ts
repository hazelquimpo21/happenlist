/**
 * MEMBERSHIP TYPES
 * ================
 * Type definitions for membership organizations and event benefits.
 */

/**
 * A membership organization (e.g., Milwaukee Art Museum, YMCA).
 */
export interface MembershipOrganization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  organizer_id: string | null;
  is_active: boolean;
}

/**
 * Junction record linking an event to a membership org with benefit details.
 */
export interface EventMembershipBenefit {
  id: string;
  membership_org_id: string;
  benefit_type: string; // free, discount, early_access, priority, member_price
  benefit_details: string | null;
  member_price: number | null;
  membership_organization: MembershipOrganization;
}

/**
 * Membership org with event count (for directory listings).
 */
export interface MembershipOrgWithCount extends MembershipOrganization {
  event_count: number;
}

/**
 * Membership org card data for grids/lists.
 */
export interface MembershipOrgCard {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  event_count: number;
}

/**
 * Human-readable labels and colors for benefit types.
 */
export const BENEFIT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  free: { label: 'FREE for members', color: 'text-emerald-800', bgColor: 'bg-emerald-100' },
  discount: { label: 'Member discount', color: 'text-amber-800', bgColor: 'bg-amber-100' },
  early_access: { label: 'Early access', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  priority: { label: 'Priority access', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  member_price: { label: 'Member price', color: 'text-amber-800', bgColor: 'bg-amber-100' },
};

/**
 * Get display config for a benefit type.
 */
export function getBenefitConfig(benefitType: string) {
  return BENEFIT_TYPE_CONFIG[benefitType] || {
    label: benefitType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    color: 'text-stone',
    bgColor: 'bg-sand',
  };
}

/**
 * Format a benefit for display on cards (short version).
 */
export function formatBenefitShort(benefit: EventMembershipBenefit): string {
  switch (benefit.benefit_type) {
    case 'free':
      return 'Free for members';
    case 'member_price':
      return benefit.member_price ? `$${benefit.member_price} members` : 'Member pricing';
    case 'discount':
      return benefit.benefit_details || 'Member discount';
    case 'early_access':
      return 'Early access';
    case 'priority':
      return 'Priority access';
    default:
      return 'Member benefits';
  }
}
