/**
 * SECTION HEADER COMPONENT
 * ========================
 * Header for event sections with optional "View all" link.
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Alias for description */
  subtitle?: string;
  /** View all link */
  viewAllHref?: string;
  /** View all label */
  viewAllLabel?: string;
  /** Custom action element (replaces viewAllHref) */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Section header with optional view all link.
 *
 * @example
 * <SectionHeader
 *   title="This Weekend"
 *   viewAllHref="/events/this-weekend"
 * />
 */
export function SectionHeader({
  title,
  description,
  subtitle,
  viewAllHref,
  viewAllLabel = 'See all',
  action,
  className,
}: SectionHeaderProps) {
  // Allow subtitle as alias for description
  const displayDescription = description || subtitle;

  return (
    <div
      className={cn(
        'flex items-end justify-between gap-4 mb-6',
        className
      )}
    >
      <div>
        <h2 className="font-body text-h2 text-ink">{title}</h2>
        {displayDescription && (
          <p className="text-zinc text-body-sm mt-1">{displayDescription}</p>
        )}
      </div>

      {action ? (
        <div className="flex-shrink-0">{action}</div>
      ) : viewAllHref ? (
        <Link
          href={viewAllHref}
          className={cn(
            'inline-flex items-center gap-1',
            'text-blue text-body-sm font-semibold',
            'hover:text-blue-dark transition-colors',
            'flex-shrink-0'
          )}
        >
          {viewAllLabel}
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : null}
    </div>
  );
}
