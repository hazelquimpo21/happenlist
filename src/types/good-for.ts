/**
 * GOOD FOR TAGS
 * =============
 * Audience/vibe tags for events — UI metadata layer.
 *
 * These answer "who would enjoy this?" — orthogonal to categories
 * which answer "what kind of event is this?"
 *
 * Events can have multiple good_for tags (TEXT[] in the database).
 *
 * SOURCE OF TRUTH for the slug list lives in:
 *   src/lib/constants/vocabularies.ts (mirrors the scraper)
 *
 * This file owns the rich UI metadata (label, description, icon, color) and
 * imports the slug union type so any mismatch fails compilation. If you add
 * a new slug, add it to vocabularies.ts FIRST, then add the matching entry
 * here — TypeScript will tell you if you forget.
 */

import { GOOD_FOR_SLUGS, type GoodForSlug } from '@/lib/constants/vocabularies';

// Re-export so existing imports from `@/types` keep working without churn.
export { GOOD_FOR_SLUGS };
export type { GoodForSlug };

/**
 * A single "Good For" tag definition.
 */
export interface GoodForTag {
  slug: GoodForSlug;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind bg class for pills
}

/**
 * All valid "Good For" tag definitions.
 *
 * Add new tags here — the slug must match what's stored in the database.
 * Order determines display order in the UI.
 */
export const GOOD_FOR_TAGS: GoodForTag[] = [
  {
    slug: 'date_night',
    label: 'Date Night',
    description: 'Romantic or couples-friendly',
    icon: 'Heart',
    color: 'bg-rose-100 text-rose-800',
  },
  {
    slug: 'families_young_kids',
    label: 'Families with Young Kids',
    description: 'Toddlers and under-6 will survive and have fun',
    icon: 'Baby',
    color: 'bg-sky-100 text-sky-800',
  },
  {
    slug: 'families_older_kids',
    label: 'Families with Older Kids',
    description: 'Tweens and teens (roughly 7–17)',
    icon: 'Users',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    slug: 'pet_friendly',
    label: 'Pet Owners',
    description: 'Dogs welcome, yappy hours, pet-centric',
    icon: 'Dog',
    color: 'bg-amber-100 text-amber-800',
  },
  {
    slug: 'foodies',
    label: 'Foodies',
    description: 'Tasting events, food tours, pop-ups, culinary experiences',
    icon: 'UtensilsCrossed',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    slug: 'girls_night',
    label: 'Girls Night Out',
    description: 'Paint nights, drag brunches, group-friendly fun',
    icon: 'Sparkles',
    color: 'bg-pink-100 text-pink-800',
  },
  {
    slug: 'guys_night',
    label: 'Guys Night Out',
    description: 'Sports watch parties, cornhole leagues, etc.',
    icon: 'Trophy',
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    slug: 'solo_friendly',
    label: 'Great Solo',
    description: 'Comfortable and fun to attend alone',
    icon: 'UserCheck',
    color: 'bg-teal-100 text-teal-800',
  },
  {
    slug: 'outdoorsy',
    label: 'Outdoor Lovers',
    description: 'Hikes, garden tours, outdoor markets',
    icon: 'TreePine',
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    slug: 'creatives',
    label: 'Creatives',
    description: 'Art workshops, open mics, maker events',
    icon: 'Palette',
    color: 'bg-violet-100 text-violet-800',
  },
  {
    slug: 'music_lovers',
    label: 'Live Music Fans',
    description: 'Events with live music (even non-Music category)',
    icon: 'Music',
    color: 'bg-fuchsia-100 text-fuchsia-800',
  },
  {
    slug: 'active_seniors',
    label: 'Active Seniors',
    description: 'Accessible, daytime, welcoming to older adults',
    icon: 'Sun',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    slug: 'college_crowd',
    label: 'College Crowd',
    description: 'Student-priced, campus-adjacent, young-adult energy',
    icon: 'GraduationCap',
    color: 'bg-cyan-100 text-cyan-800',
  },
  {
    slug: 'first_timers',
    label: 'First-Timers Welcome',
    description: 'Low barrier, beginner-friendly, newcomers encouraged',
    icon: 'HandHeart',
    color: 'bg-lime-100 text-lime-800',
  },
  {
    slug: 'bridal_shower',
    label: 'Bridal/Bachelorette',
    description: 'Great for bridal showers, bachelorette parties, and wedding-adjacent celebrations',
    icon: 'PartyPopper',
    color: 'bg-pink-100 text-pink-800',
  },
  {
    slug: 'bachelor_party',
    label: 'Bachelor Party',
    description: 'Fun group activities for bachelor parties and groom celebrations',
    icon: 'Beer',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    slug: 'first_date',
    label: 'First Date',
    description: 'Low-pressure, easy-to-talk, good first-date energy',
    icon: 'HeartHandshake',
    color: 'bg-rose-100 text-rose-800',
  },
  {
    slug: 'meet_people',
    label: 'Meet People',
    description: 'Socializing-forward — meetups, mixers, networking, community events',
    icon: 'UsersRound',
    color: 'bg-teal-100 text-teal-800',
  },
  {
    slug: 'tourist_friendly',
    label: 'Tourist Friendly',
    description: 'Great for visitors — iconic, easy to find, no local knowledge needed',
    icon: 'MapPin',
    color: 'bg-sky-100 text-sky-800',
  },
  {
    slug: 'rainy_day',
    label: 'Rainy Day',
    description: 'Indoor activities perfect for bad weather days',
    icon: 'CloudRain',
    color: 'bg-slate-100 text-slate-800',
  },
  {
    slug: 'budget_friendly',
    label: 'Budget Friendly',
    description: 'Free or cheap — easy on the wallet',
    icon: 'PiggyBank',
    color: 'bg-green-100 text-green-800',
  },
  {
    slug: 'after_work',
    label: 'After Work',
    description: 'Happy hours, evening drop-ins, post-5pm weekday vibes',
    icon: 'Clock',
    color: 'bg-amber-100 text-amber-800',
  },
  {
    slug: 'group_outing',
    label: 'Group Outing',
    description: 'Works well for groups of 6+ — team outings, friend groups, parties',
    icon: 'Users',
    color: 'bg-violet-100 text-violet-800',
  },
  {
    slug: 'quiet_hangout',
    label: 'Quiet Hangout',
    description: 'Low-key, conversation-friendly, no sensory overload',
    icon: 'Coffee',
    color: 'bg-stone-100 text-stone-800',
  },
];

/**
 * Look up a tag by slug.
 */
export function getGoodForTag(slug: string): GoodForTag | undefined {
  return GOOD_FOR_TAGS.find((t) => t.slug === slug);
}

/**
 * Look up multiple tags by slug array.
 * Returns tags in the canonical display order (matching GOOD_FOR_TAGS order).
 */
export function getGoodForTags(slugs: string[]): GoodForTag[] {
  return GOOD_FOR_TAGS.filter((t) => slugs.includes(t.slug));
}
