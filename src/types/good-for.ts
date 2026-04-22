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
  /**
   * True for kid/teen/family-programming tags (storytime, camps, youth sports,
   * teen workshops). The filter drawer renders these in a dedicated "For Kids
   * & Families" section so adult browsers aren't cluttered with them, and
   * kids-oriented pages can surface them front-and-center.
   */
  family_only?: boolean;
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
    slug: 'curious_minds',
    label: 'Curious Minds',
    description: 'Talks, lectures, panels, demos, historical tours, science events — the person who likes to learn things',
    icon: 'BookOpen',
    color: 'bg-cyan-100 text-cyan-800',
  },
  {
    slug: 'occasion_worthy',
    label: 'Occasion Worthy',
    description: 'Great for celebrating someone — birthdays, bachelorette, bachelor, anniversary, graduation',
    icon: 'PartyPopper',
    color: 'bg-yellow-100 text-yellow-800',
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

  // ==========================================================================
  // Situational / persona tags added 2026-04-21
  // (Thrillist/Infatuation-style specificity. Match slugs with the scraper
  // vocab at happenlist_scraper/backend/lib/vocabularies.js.)
  // ==========================================================================
  {
    slug: 'sports_fans',
    label: 'Sports Fans',
    description: 'Game watches, team viewings, tailgates — Brewers, Bucks, Marquette, anything with a scoreboard',
    icon: 'Medal',
    color: 'bg-red-100 text-red-800',
  },
  {
    slug: 'dancefloor',
    label: 'On the Dancefloor',
    description: 'DJ nights, dance classes, salsa, house — anywhere people are actually dancing',
    icon: 'Disc3',
    color: 'bg-fuchsia-100 text-fuchsia-800',
  },
  {
    slug: 'late_night',
    label: 'Up All Night',
    description: 'After-hours energy — 11pm start times, parties that run past last call',
    icon: 'Moon',
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    slug: 'wellness_seekers',
    label: 'Wellness & Yoga',
    description: 'Yoga, breathwork, meditation, sound baths, wellness workshops',
    icon: 'Flower2',
    color: 'bg-green-100 text-green-800',
  },
  {
    slug: 'coffee_snobs',
    label: 'Coffee Snobs',
    description: 'Specialty coffee tastings, roasters, pour-over demos, third-wave nerdery',
    icon: 'Coffee',
    color: 'bg-amber-100 text-amber-800',
  },
  {
    slug: 'beer_drinkers',
    label: 'Beer Drinkers',
    description: 'Brewery events, tap takeovers, beer festivals, brewery tours',
    icon: 'Beer',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    slug: 'cocktail_nerds',
    label: 'Cocktail Nerds',
    description: 'Craft cocktails, tiki bars, spirit tastings, mixology classes',
    icon: 'Martini',
    color: 'bg-pink-100 text-pink-800',
  },
  {
    slug: 'wine_lovers',
    label: 'Wine Lovers',
    description: 'Tastings, flights, vineyard trips, winemaker dinners',
    icon: 'Wine',
    color: 'bg-rose-100 text-rose-800',
  },
  {
    slug: 'bookworms',
    label: 'Bookworms',
    description: 'Book clubs, author readings, literary festivals, poetry nights',
    icon: 'BookMarked',
    color: 'bg-stone-100 text-stone-800',
  },
  {
    slug: 'film_buffs',
    label: 'Film Buffs',
    description: 'Indie and repertory cinema, film festivals, director Q&As, cult classics',
    icon: 'Film',
    color: 'bg-neutral-100 text-neutral-800',
  },
  {
    slug: 'theater_kids',
    label: 'Theater Kids',
    description: 'Plays, musicals, live theater, opera',
    icon: 'Drama',
    color: 'bg-red-100 text-red-800',
  },
  {
    slug: 'comedy_fans',
    label: 'Comedy Fans',
    description: 'Stand-up, improv shows, sketch comedy, open mics',
    icon: 'Mic',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    slug: 'vintage_hunters',
    label: 'Vintage Hunters',
    description: 'Flea markets, estate sales, antique fairs, thrift pop-ups',
    icon: 'ShoppingBag',
    color: 'bg-amber-100 text-amber-800',
  },
  {
    slug: 'history_buffs',
    label: 'History Buffs',
    description: 'Historic walking tours, heritage events, museum exhibits, reenactments',
    icon: 'Landmark',
    color: 'bg-zinc-100 text-zinc-800',
  },
  {
    slug: 'early_birds',
    label: 'Early Birds',
    description: '5k runs, farmers markets, breakfast clubs, sunrise sessions — done by noon',
    icon: 'Sunrise',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    slug: 'trivia_lovers',
    label: 'Trivia Nights',
    description: 'Pub quizzes, trivia leagues, bar trivia',
    icon: 'Lightbulb',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    slug: 'karaoke_singalongs',
    label: 'Karaoke & Sing-Alongs',
    description: 'Karaoke nights, sing-along screenings, piano bars',
    icon: 'Mic2',
    color: 'bg-pink-100 text-pink-800',
  },
  {
    slug: 'game_night',
    label: 'Game Night',
    description: 'Board game cafes, D&D, video game tournaments, tabletop nights',
    icon: 'Dices',
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    slug: 'networking_pros',
    label: 'Networking',
    description: 'Professional mixers, industry meetups, career panels, founders events',
    icon: 'Briefcase',
    color: 'bg-slate-100 text-slate-800',
  },
  {
    slug: 'fancy_night',
    label: 'Fancy Night Out',
    description: 'Black tie, galas, upscale tastings — a reason to dress up',
    icon: 'Gem',
    color: 'bg-violet-100 text-violet-800',
  },

  // ==========================================================================
  // For Kids & Families — age-graded programming (added 2026-04-21)
  // `family_only: true` flags these for a dedicated drawer section.
  // Slugs mirrored in happenlist_scraper/backend/lib/vocabularies.js.
  // ==========================================================================

  // -- Babies (0–2) --
  {
    slug: 'baby_storytime',
    label: 'Baby Storytime',
    description: 'Infant and baby storytime at libraries, bookstores, and family centers',
    icon: 'BookOpen',
    color: 'bg-sky-100 text-sky-800',
    family_only: true,
  },
  {
    slug: 'baby_music_class',
    label: 'Baby Music Class',
    description: 'Music Together, Kindermusik, lullaby singalongs for 0–2',
    icon: 'Music',
    color: 'bg-sky-100 text-sky-800',
    family_only: true,
  },

  // -- Toddlers (2–4) --
  {
    slug: 'toddler_storytime',
    label: 'Toddler Storytime',
    description: 'Picture-book readings, library storytimes for ages 2–4',
    icon: 'BookOpen',
    color: 'bg-teal-100 text-teal-800',
    family_only: true,
  },
  {
    slug: 'toddler_music_movement',
    label: 'Toddler Music & Movement',
    description: 'Music-and-motion classes, sing + dance programs for 2–4',
    icon: 'Music2',
    color: 'bg-teal-100 text-teal-800',
    family_only: true,
  },
  {
    slug: 'toddler_art_messy',
    label: 'Toddler Art (Messy)',
    description: 'Toddler art classes, messy play, finger paint, sensory tables',
    icon: 'Palette',
    color: 'bg-teal-100 text-teal-800',
    family_only: true,
  },

  // -- Kids (5–10) --
  {
    slug: 'kids_art_class',
    label: 'Kids Art Class',
    description: 'Art classes, pottery, craft workshops for elementary-age kids',
    icon: 'Paintbrush',
    color: 'bg-violet-100 text-violet-800',
    family_only: true,
  },
  {
    slug: 'kids_stem',
    label: 'Kids STEM & Science',
    description: 'Robotics, coding, science, maker programs for kids',
    icon: 'FlaskConical',
    color: 'bg-emerald-100 text-emerald-800',
    family_only: true,
  },
  {
    slug: 'kids_cooking',
    label: 'Kids Cooking Class',
    description: 'Junior chef classes, baking workshops, kid culinary camps',
    icon: 'ChefHat',
    color: 'bg-orange-100 text-orange-800',
    family_only: true,
  },
  {
    slug: 'kids_theater_dance',
    label: 'Kids Theater & Dance',
    description: 'Youth theater, dance classes, performance programs',
    icon: 'Drama',
    color: 'bg-pink-100 text-pink-800',
    family_only: true,
  },
  {
    slug: 'kids_music_lessons',
    label: 'Kids Music Lessons',
    description: 'Instrument lessons, kids choir, youth orchestra programs',
    icon: 'Music',
    color: 'bg-fuchsia-100 text-fuchsia-800',
    family_only: true,
  },
  {
    slug: 'kids_nature_adventure',
    label: 'Kids Nature & Outdoors',
    description: 'Nature programs, junior naturalist, scouting outdoor events',
    icon: 'TreePine',
    color: 'bg-green-100 text-green-800',
    family_only: true,
  },

  // -- Youth sports --
  {
    slug: 'youth_sports_league',
    label: 'Youth Sports League',
    description: 'Organized kids leagues — soccer, basketball, baseball, volleyball, hockey',
    icon: 'Trophy',
    color: 'bg-red-100 text-red-800',
    family_only: true,
  },
  {
    slug: 'youth_sports_clinic',
    label: 'Youth Sports Clinic',
    description: 'One-off skill clinics, "try it" days, athlete-led workshops for kids',
    icon: 'Medal',
    color: 'bg-red-100 text-red-800',
    family_only: true,
  },
  {
    slug: 'swim_lessons',
    label: 'Swim Lessons',
    description: 'Parent-tot swim, youth swim lessons, water-safety programs',
    icon: 'Waves',
    color: 'bg-cyan-100 text-cyan-800',
    family_only: true,
  },
  {
    slug: 'gymnastics_tumbling',
    label: 'Gymnastics & Tumbling',
    description: 'Gymnastics classes, tumbling, open-gym, Ninja Warrior for kids',
    icon: 'Zap',
    color: 'bg-yellow-100 text-yellow-800',
    family_only: true,
  },

  // -- Camps --
  {
    slug: 'summer_camp_day',
    label: 'Summer Day Camp',
    description: 'Weeklong day camps, full-day and half-day summer programs',
    icon: 'Sun',
    color: 'bg-amber-100 text-amber-800',
    family_only: true,
  },
  {
    slug: 'summer_camp_overnight',
    label: 'Overnight Camp',
    description: 'Sleep-away summer camps, residential youth programs',
    icon: 'Tent',
    color: 'bg-amber-100 text-amber-800',
    family_only: true,
  },
  {
    slug: 'school_break_camp',
    label: 'School Break Camp',
    description: 'Winter break, spring break, and no-school-day camps',
    icon: 'CalendarDays',
    color: 'bg-amber-100 text-amber-800',
    family_only: true,
  },
  {
    slug: 'specialty_camp',
    label: 'Specialty Camp',
    description: 'Art, STEM, theater, music, sports camps — single-focus camps',
    icon: 'Star',
    color: 'bg-amber-100 text-amber-800',
    family_only: true,
  },

  // -- Tweens / Teens --
  {
    slug: 'tween_maker_workshop',
    label: 'Tween Maker Workshop',
    description: 'Makerspace programs, DIY and craft workshops for ages 9–12',
    icon: 'Wrench',
    color: 'bg-indigo-100 text-indigo-800',
    family_only: true,
  },
  {
    slug: 'teen_creative_workshop',
    label: 'Teen Workshop',
    description: 'Art, music, filmmaking, writing workshops for teens 13–17',
    icon: 'Sparkles',
    color: 'bg-indigo-100 text-indigo-800',
    family_only: true,
  },
  {
    slug: 'teen_career_college',
    label: 'Teen Career & College',
    description: 'College fairs, internship programs, career panels, campus visits',
    icon: 'GraduationCap',
    color: 'bg-indigo-100 text-indigo-800',
    family_only: true,
  },

  // -- All-family --
  {
    slug: 'birthday_party_worthy',
    label: 'Birthday Party Worthy',
    description: 'Great for hosting a kid birthday party — has the space, staff, or format for it',
    icon: 'PartyPopper',
    color: 'bg-rose-100 text-rose-800',
    family_only: true,
  },
];

// ============================================================================
// PARTITIONS
// ============================================================================
// Centralized subsets so consumers don't hand-roll the filter.
// Whenever a new tag is added above, these exports update automatically.

/**
 * Kid/teen/family-programming tags only. Used by the "For Kids & Families"
 * filter drawer section and any family-facing landing pages.
 */
export const FAMILY_GOOD_FOR_TAGS: GoodForTag[] = GOOD_FOR_TAGS.filter(
  (t) => t.family_only === true
);

/**
 * Everything else — general audience/vibe tags. This is what adult-facing
 * browse views should show by default.
 */
export const GENERAL_GOOD_FOR_TAGS: GoodForTag[] = GOOD_FOR_TAGS.filter(
  (t) => t.family_only !== true
);

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
