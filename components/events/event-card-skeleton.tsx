// ============================================================================
// 💀 HAPPENLIST - Event Card Skeleton Component
// ============================================================================
// Loading placeholder for event cards.
// Shows while events are being fetched.
//
// Usage:
//   <EventCardSkeleton />
//   <EventListSkeleton count={6} />
// ============================================================================

import { Card, Skeleton } from '@/components/ui'

// ============================================================================
// 💀 EventCardSkeleton Component
// ============================================================================

export function EventCardSkeleton() {
  return (
    <Card className="h-full">
      {/* Image placeholder */}
      <Skeleton className="aspect-[4/3]" />

      {/* Content placeholders */}
      <div className="p-4 space-y-3">
        {/* Date */}
        <Skeleton className="h-4 w-24" />
        {/* Title line 1 */}
        <Skeleton className="h-5 w-full" />
        {/* Title line 2 */}
        <Skeleton className="h-5 w-3/4" />
        {/* Venue */}
        <Skeleton className="h-4 w-32" />
        {/* Bottom row */}
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// 💀 EventListSkeleton Component
// ============================================================================

export interface EventListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number
}

export function EventListSkeleton({ count = 6 }: EventListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ============================================================================
// 💀 Compact Skeleton Variant
// ============================================================================

export function EventCardCompactSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      {/* Thumbnail */}
      <Skeleton className="w-20 h-20 shrink-0 rounded-lg" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}
