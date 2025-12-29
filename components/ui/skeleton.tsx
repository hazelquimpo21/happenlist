// ============================================================================
// 💀 HAPPENLIST - Skeleton Component
// ============================================================================
// A loading placeholder with shimmer animation.
// Use to show content is loading while maintaining layout.
//
// Usage:
//   <Skeleton className="h-4 w-32" />           // Text line
//   <Skeleton className="h-48 w-full" />        // Image placeholder
//   <Skeleton className="h-12 w-12 rounded-full" />  // Avatar
// ============================================================================

import { cn } from '@/lib/utils/cn'

// ============================================================================
// 💀 Skeleton Component
// ============================================================================

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Base styles - gradient background with shimmer
        'animate-shimmer rounded-md',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

// ============================================================================
// 📤 Exports
// ============================================================================

export { Skeleton }
