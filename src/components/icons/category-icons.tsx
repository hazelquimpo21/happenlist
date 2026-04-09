/**
 * CATEGORY ICONS
 * ==============
 * Custom SVG icons for each event category.
 * Bold, geometric, poster-style — designed to work at 32px+
 * on both color backgrounds and white.
 *
 * All icons use currentColor so they inherit text color.
 * Viewbox is 24x24, strokeWidth 2, rounded caps/joins.
 */

import { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Music — audio wave / equalizer bars */
export function IconMusic(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="4" y="10" width="3" height="10" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="10.5" y="4" width="3" height="16" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="17" y="7" width="3" height="13" rx="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Arts & Culture — painter's palette / abstract brush */
export function IconArts(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M15 16c1.5-1 2.5-2.5 2-4" strokeWidth={2} />
    </svg>
  );
}

/** Food & Drink — fork + knife simplified */
export function IconFood(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M7 3v6c0 1.66 1.34 3 3 3h0" strokeWidth={2} />
      <path d="M7 12v9" strokeWidth={2} />
      <path d="M3 3v3c0 1.66 1.34 3 3 3" strokeWidth={2} />
      <line x1="5" y1="3" x2="5" y2="9" strokeWidth={2} />
      <path d="M17 3c0 0 0 4-0.5 6s-1.5 3-1.5 3v9" strokeWidth={2} />
      <path d="M19 3c0 0 0 4 0.5 6s1.5 3 1.5 3" strokeWidth={2} />
      <line x1="17" y1="12" x2="21" y2="12" strokeWidth={2} />
    </svg>
  );
}

/** Family — two big + one small figure */
export function IconFamily(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="7" cy="5" r="2.5" strokeWidth={2} />
      <path d="M3 21v-3a4 4 0 0 1 4-4h0" strokeWidth={2} />
      <circle cx="17" cy="5" r="2.5" strokeWidth={2} />
      <path d="M21 21v-3a4 4 0 0 0-4-4h0" strokeWidth={2} />
      <circle cx="12" cy="9" r="2" strokeWidth={2} />
      <path d="M9 21v-2a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2" strokeWidth={2} />
    </svg>
  );
}

/** Sports & Fitness — lightning bolt (energy) */
export function IconSports(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <polygon
        points="13,2 4,14 11,14 10,22 20,10 13,10"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/** Community — overlapping circles (connection) */
export function IconCommunity(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="9" cy="10" r="6" strokeWidth={2} fill="none" />
      <circle cx="15" cy="10" r="6" strokeWidth={2} fill="none" />
      <circle cx="12" cy="16" r="6" strokeWidth={2} fill="none" />
    </svg>
  );
}

/** Nightlife — crescent moon + stars */
export function IconNightlife(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path
        d="M19 12.5A7.5 7.5 0 0 1 11.5 5a7.5 7.5 0 1 0 7.5 7.5z"
        fill="currentColor"
        stroke="none"
      />
      <circle cx="17" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="20" cy="8" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Classes — open book */
export function IconClasses(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M2 4c2-1 4.5-1 6.5 0s4.5 1 6.5 0" strokeWidth={2} fill="none" />
      <path d="M2 4v14c2-1 4.5-1 6.5 0s4.5 1 6.5 0V4" strokeWidth={2} fill="none" />
      <line x1="8.5" y1="4" x2="8.5" y2="18" strokeWidth={2} />
      <path d="M15 4c2-1 4.5-1 6.5 0" strokeWidth={2} fill="none" />
      <path d="M15 4v14c2-1 4.5-1 6.5 0V4" strokeWidth={2} fill="none" />
    </svg>
  );
}

/** Festivals — firework burst */
export function IconFestivals(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="6" strokeWidth={2} />
      <line x1="12" y1="18" x2="12" y2="22" strokeWidth={2} />
      <line x1="2" y1="12" x2="6" y2="12" strokeWidth={2} />
      <line x1="18" y1="12" x2="22" y2="12" strokeWidth={2} />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" strokeWidth={2} />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" strokeWidth={2} />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" strokeWidth={2} />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" strokeWidth={2} />
    </svg>
  );
}

/** Workshops — wrench + gear (hands-on making) */
export function IconWorkshops(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94L6.73 20.2a2 2 0 0 1-2.83-2.83l6.73-6.73A6 6 0 0 1 18.57 2.7z" strokeWidth={2} />
    </svg>
  );
}

/** Markets & Shopping — shopping tote bag */
export function IconMarkets(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="4" y="8" width="16" height="13" rx="2" strokeWidth={2} />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" strokeWidth={2} />
    </svg>
  );
}

/** Talks & Lectures — speech podium / microphone */
export function IconTalks(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" strokeWidth={2} />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" strokeWidth={2} />
      <line x1="12" y1="18" x2="12" y2="22" strokeWidth={2} />
      <line x1="8" y1="22" x2="16" y2="22" strokeWidth={2} />
    </svg>
  );
}

/** Outdoors & Nature — mountain peaks */
export function IconOutdoors(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M8 21l5-13 5 13" strokeWidth={2} fill="none" />
      <path d="M2 21l4-7 3 4" strokeWidth={2} fill="none" />
      <line x1="2" y1="21" x2="22" y2="21" strokeWidth={2} />
    </svg>
  );
}

/** Charity & Fundraising — heart in hand */
export function IconCharity(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 8c-1.5-2.5-5-3-6.5-0.5S4 12 12 17c8-5 8.5-7.5 7-10S13.5 5.5 12 8z" fill="currentColor" stroke="none" />
      <path d="M6 17v4h12v-4" strokeWidth={2} />
      <path d="M4 21h16" strokeWidth={2} />
    </svg>
  );
}

/** Holiday & Seasonal — snowflake / star */
export function IconHoliday(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <polygon
        points="12,2 14.5,9 22,9 16,13.5 18,21 12,16.5 6,21 8,13.5 2,9 9.5,9"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/**
 * Master map — matches the `icon` field stored in the database
 * category rows to the correct component.
 */
export const CATEGORY_ICON_MAP: Record<string, (props: IconProps) => JSX.Element> = {
  // Primary categories
  Music: IconMusic,
  Palette: IconArts,
  UtensilsCrossed: IconFood,
  Heart: IconFamily,
  Dumbbell: IconSports,
  Users: IconCommunity,
  Moon: IconNightlife,
  GraduationCap: IconClasses,
  PartyPopper: IconFestivals,
  Clapperboard: IconWorkshops,
  // Extended categories
  ShoppingBag: IconMarkets,
  Mic: IconTalks,
  TreePine: IconOutdoors,
  HandHeart: IconCharity,
  Snowflake: IconHoliday,
};

/** Get the icon component for a category, falls back to Music */
export function getCategoryIcon(iconName: string | null): (props: IconProps) => JSX.Element {
  if (!iconName) return IconMusic;
  return CATEGORY_ICON_MAP[iconName] ?? IconMusic;
}
