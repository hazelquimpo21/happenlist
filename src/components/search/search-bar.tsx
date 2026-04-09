/**
 * SEARCH BAR COMPONENT
 * ====================
 * Search input with form submission to search page.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface SearchBarProps {
  /** Initial search value */
  initialValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus the input */
  autoFocus?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

/**
 * Search input bar with form submission.
 *
 * @example
 * <SearchBar placeholder="Search events..." />
 *
 * @example
 * <SearchBar initialValue="music" size="lg" autoFocus />
 */
export function SearchBar({
  initialValue = '',
  placeholder = 'Search events, venues, organizers...',
  autoFocus = false,
  size = 'md',
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);

  console.log('🔍 [SearchBar] Rendering with query:', query);

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        console.log('🔍 [SearchBar] Submitting search:', trimmedQuery);
        router.push(ROUTES.searchWithQuery(trimmedQuery));
      }
    },
    [query, router]
  );

  /**
   * Clear the search input.
   */
  const handleClear = useCallback(() => {
    setQuery('');
    console.log('🔍 [SearchBar] Cleared search');
  }, []);

  // Size styles
  const sizeStyles = {
    sm: 'h-10 text-body-sm pl-10 pr-10',
    md: 'h-12 text-body pl-12 pr-12',
    lg: 'h-14 text-body pl-14 pr-14',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconPositions = {
    sm: 'left-3',
    md: 'left-4',
    lg: 'left-4',
  };

  const clearPositions = {
    sm: 'right-3',
    md: 'right-4',
    lg: 'right-4',
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      {/* Search icon */}
      <Search
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-zinc pointer-events-none',
          iconSizes[size],
          iconPositions[size]
        )}
      />

      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full rounded-lg border border-mist bg-pure',
          'text-ink placeholder:text-zinc',
          'focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent',
          'transition-all duration-fast',
          sizeStyles[size]
        )}
      />

      {/* Clear button */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 p-1 rounded-full',
            'text-zinc hover:text-ink hover:bg-cloud',
            'transition-colors duration-fast',
            clearPositions[size]
          )}
          aria-label="Clear search"
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </form>
  );
}
