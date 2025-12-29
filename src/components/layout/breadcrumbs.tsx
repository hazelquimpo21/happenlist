/**
 * BREADCRUMBS COMPONENT
 * =====================
 * Navigation breadcrumb trail.
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link href (if not provided, renders as text) */
  href?: string;
}

interface BreadcrumbsProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Breadcrumb navigation component.
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: 'Events', href: '/events' },
 *     { label: 'Music', href: '/events/music' },
 *     { label: 'Jazz at the Lake' },
 *   ]}
 * />
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-body-sm', className)}
    >
      {/* Home link */}
      <Link
        href="/"
        className="text-stone hover:text-coral transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-1">
          {/* Separator */}
          <ChevronRight className="w-4 h-4 text-sand flex-shrink-0" />

          {/* Item */}
          {item.href ? (
            <Link
              href={item.href}
              className="text-stone hover:text-coral transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-charcoal truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
