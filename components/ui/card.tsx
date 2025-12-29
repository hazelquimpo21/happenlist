// ============================================================================
// 🃏 HAPPENLIST - Card Component
// ============================================================================
// A container component for grouping related content.
// Includes optional hover effect for interactive cards.
//
// Usage:
//   <Card>
//     <CardHeader>Title</CardHeader>
//     <CardContent>Content here</CardContent>
//   </Card>
//
//   <Card hover>Clickable card with hover effect</Card>
// ============================================================================

import { cn } from '@/lib/utils/cn'

// ============================================================================
// 🃏 Card Component
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover lift effect and shadow transition */
  hover?: boolean
}

function Card({ className, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base styles
        'bg-surface rounded-xl shadow-sm',
        'border border-border',
        'overflow-hidden',
        // Hover effect (optional)
        hover && [
          'transition-all duration-200',
          'hover:shadow-md hover:-translate-y-0.5',
        ],
        className
      )}
      {...props}
    />
  )
}

// ============================================================================
// 📦 Card Sub-Components
// ============================================================================

/**
 * Card header section with padding.
 */
function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 md:p-6', className)} {...props} />
}

/**
 * Card content section with padding (no top padding if after header).
 */
function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 md:p-6 pt-0', className)} {...props} />
}

/**
 * Card footer section for actions.
 */
function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-4 md:p-6 pt-0 flex items-center gap-2', className)}
      {...props}
    />
  )
}

/**
 * Card title text.
 */
function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-heading-md text-text-primary', className)}
      {...props}
    />
  )
}

/**
 * Card description text.
 */
function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-body-sm text-text-secondary', className)} {...props} />
  )
}

// ============================================================================
// 📤 Exports
// ============================================================================

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription }
