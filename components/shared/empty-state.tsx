// ============================================================================
// 📭 HAPPENLIST - Empty State Component
// ============================================================================
// A friendly message when no data is available.
// Use when a list or search returns no results.
//
// Usage:
//   <EmptyState
//     icon={<Calendar className="w-12 h-12" />}
//     title="No events found"
//     description="Try adjusting your filters"
//     action={<Button>Clear filters</Button>}
//   />
// ============================================================================

import { cn } from '@/lib/utils/cn'

// ============================================================================
// 📋 EmptyState Props
// ============================================================================

export interface EmptyStateProps {
  /** Icon to display (use Lucide icons) */
  icon?: React.ReactNode
  /** Main message title */
  title: string
  /** Supporting description text */
  description?: string
  /** Optional action button or link */
  action?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// 📭 EmptyState Component
// ============================================================================

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {/* Icon container */}
      {icon && (
        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4 text-text-tertiary">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-heading-md text-text-primary">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-body-md text-text-secondary mt-2 max-w-md">
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ============================================================================
// 📤 Exports
// ============================================================================

export { EmptyState }
