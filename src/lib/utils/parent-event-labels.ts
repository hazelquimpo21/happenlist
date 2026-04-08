/**
 * PARENT EVENT LABELS
 * ===================
 * Contextual language for parent-child event relationships.
 * "48 screenings" > "48 events" — matches the editorial tone.
 */

/**
 * Returns a contextual label for child events based on category.
 * E.g., "screenings" for film festivals, "performances" for theater.
 */
export function getChildEventLabel(
  categorySlug: string | null,
  count: number
): string {
  const singular: Record<string, string> = {
    arts: 'showing',
    music: 'act',
    nightlife: 'act',
    festivals: 'event',
    classes: 'session',
    workshops: 'session',
    sports: 'match',
    community: 'event',
    food: 'event',
    family: 'show',
  };

  const plural: Record<string, string> = {
    arts: 'showings',
    music: 'acts',
    nightlife: 'acts',
    festivals: 'events',
    classes: 'sessions',
    workshops: 'sessions',
    sports: 'matches',
    community: 'events',
    food: 'events',
    family: 'shows',
  };

  const slug = categorySlug || '';
  const label = count === 1
    ? (singular[slug] || 'event')
    : (plural[slug] || 'events');

  return `${count} ${label}`;
}
