'use client';

/**
 * FILTER PILLS
 * ============
 * Horizontal scrolling pills for quick navigation.
 * Sits at the bottom of the hero section.
 *
 * Inspo: Groove scrolling tags, Rappid category pills
 */

import Link from 'next/link';

interface FilterPill {
  label: string;
  href: string;
}

interface FilterPillsProps {
  pills: FilterPill[];
  className?: string;
}

export function FilterPills({ pills, className = '' }: FilterPillsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-1 ${className}`}>
      {pills.map((pill) => (
        <Link
          key={pill.href}
          href={pill.href}
          className="inline-flex items-center px-4 py-2 rounded-full text-body-sm font-medium
                     bg-slate text-pure/80 hover:bg-blue hover:text-pure
                     whitespace-nowrap transition-colors flex-shrink-0"
        >
          {pill.label}
        </Link>
      ))}
    </div>
  );
}
