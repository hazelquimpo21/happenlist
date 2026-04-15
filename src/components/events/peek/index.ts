/**
 * EVENT PEEK — module barrel
 * =====================================================================
 *   EventPeek       — pure content (no dialog). Embed anywhere.
 *   EventPeekSheet  — Radix Dialog chrome (+ .Skeleton, .Error variants).
 *   PeekHost        — mounts the sheet globally from peek context.
 *   PeekSkeleton    — loading placeholder.
 *
 * The typical call path:
 *   EventCard onClick → usePeek().openPeek() → context → PeekHost mounts sheet.
 *
 * Context + history logic lives in `src/contexts/peek-context.tsx`.
 * =====================================================================
 */

export { EventPeek } from './event-peek';
export { EventPeekSheet } from './event-peek-sheet';
export { PeekHost } from './peek-host';
export { PeekSkeleton } from './peek-skeleton';
