# Happenlist: Features Specification

## Overview

This document details the implementation of key features including filtering, search, hearts/bookmarks, and user authentication.

---

## Event Filtering

### Filter Types

| Filter | Type | URL Param | Database Field |
|--------|------|-----------|----------------|
| Search | Text | `q` | Full-text on title, description |
| Category | Select | `category` | `category_id` via slug |
| Date Range | Date picker | `from`, `to` | `instance_date` |
| Quick Date | Preset buttons | `date` | `instance_date` |
| Price | Checkbox/Range | `free`, `maxPrice` | `is_free`, `price_low` |
| Venue Type | Multi-select | `venueType` | `locations.venue_type` |

### Quick Date Presets

| Preset | Label | Logic |
|--------|-------|-------|
| `today` | Today | `instance_date = today` |
| `tomorrow` | Tomorrow | `instance_date = tomorrow` |
| `this-weekend` | This Weekend | `instance_date BETWEEN friday AND sunday` |
| `this-week` | This Week | `instance_date BETWEEN today AND end_of_week` |
| `this-month` | This Month | `instance_date in current month` |

### URL State Management

Filters are managed via URL search params for shareability and SEO:

**File:** `src/hooks/use-event-filters.ts`

```typescript
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface EventFilters {
  q?: string;
  category?: string;
  from?: string;
  to?: string;
  free?: boolean;
  maxPrice?: number;
  venueType?: string[];
  sort?: 'date-asc' | 'date-desc' | 'name-asc' | 'popular';
}

export function useEventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<EventFilters>(() => ({
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    free: searchParams.get('free') === 'true',
    maxPrice: searchParams.get('maxPrice') 
      ? parseInt(searchParams.get('maxPrice')!) 
      : undefined,
    venueType: searchParams.getAll('venueType'),
    sort: searchParams.get('sort') as EventFilters['sort'] || undefined,
  }), [searchParams]);

  const setFilters = useCallback((newFilters: Partial<EventFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === false || 
          (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.delete(key);
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, String(value));
      }
    });

    // Reset to page 1 when filters change
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = useMemo(() => {
    return !!(filters.q || filters.category || filters.from || 
              filters.to || filters.free || filters.maxPrice || 
              filters.venueType?.length);
  }, [filters]);

  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
  };
}
```

### Filter Sidebar Component

**File:** `src/components/filters/filter-sidebar.tsx`

```typescript
'use client';

import { useEventFilters } from '@/hooks/use-event-filters';
import { FilterDate } from './filter-date';
import { FilterCategory } from './filter-category';
import { FilterPrice } from './filter-price';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';

interface FilterSidebarProps {
  categories: Category[];
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useEventFilters();

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-h3">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <FilterDate
          from={filters.from}
          to={filters.to}
          onChange={(from, to) => setFilters({ from, to })}
        />

        <FilterCategory
          categories={categories}
          selected={filters.category}
          onChange={(category) => setFilters({ category })}
        />

        <FilterPrice
          isFree={filters.free}
          maxPrice={filters.maxPrice}
          onChange={(free, maxPrice) => setFilters({ free, maxPrice })}
        />
      </div>
    </aside>
  );
}
```

### Active Filter Pills

**File:** `src/components/filters/filter-pills.tsx`

```typescript
'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEventFilters } from '@/hooks/use-event-filters';
import { formatDateRange } from '@/lib/utils/dates';

export function FilterPills() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useEventFilters();

  if (!hasActiveFilters) return null;

  const pills = [];

  if (filters.category) {
    pills.push({
      key: 'category',
      label: filters.category,
      onRemove: () => setFilters({ category: undefined }),
    });
  }

  if (filters.from || filters.to) {
    pills.push({
      key: 'date',
      label: formatDateRange(filters.from, filters.to),
      onRemove: () => setFilters({ from: undefined, to: undefined }),
    });
  }

  if (filters.free) {
    pills.push({
      key: 'free',
      label: 'Free',
      onRemove: () => setFilters({ free: false }),
    });
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {pills.map((pill) => (
        <Badge key={pill.key} variant="category" className="gap-1">
          {pill.label}
          <button onClick={pill.onRemove} className="ml-1 hover:text-coral">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}

      {pills.length > 1 && (
        <button
          onClick={clearFilters}
          className="text-body-sm text-coral hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
```

---

## Search

### Search Architecture

1. **Header Search** - Quick search in header, shows dropdown suggestions
2. **Hero Search** - Large search on homepage
3. **Search Results Page** - Full results at `/search?q=...`

### Search Suggestions (Client-Side)

**File:** `src/components/search/search-bar.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { SearchSuggestions } from './search-suggestions';

interface SearchBarProps {
  variant?: 'default' | 'hero' | 'header';
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ 
  variant = 'default', 
  placeholder = 'Search events...',
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className={cn(
          'flex items-center gap-3 rounded-full bg-warm-white border border-sand',
          'focus-within:border-coral focus-within:ring-2 focus-within:ring-coral-light',
          variant === 'hero' && 'h-14 px-6',
          variant === 'header' && 'h-10 px-4',
          variant === 'default' && 'h-12 px-5',
        )}>
          <Search className="w-5 h-5 text-stone flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="flex-1 bg-transparent outline-none text-charcoal placeholder:text-stone"
          />
          {query && (
            <button type="button" onClick={handleClear}>
              <X className="w-5 h-5 text-stone hover:text-charcoal" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && debouncedQuery.length >= 2 && (
        <SearchSuggestions
          query={debouncedQuery}
          onSelect={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
```

### Search Suggestions Dropdown

**File:** `src/components/search/search-suggestions.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, User } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface SearchSuggestionsProps {
  query: string;
  onSelect: () => void;
}

interface SuggestionResults {
  events: Array<{ id: string; title: string; slug: string; instance_date: string }>;
  venues: Array<{ id: string; name: string; slug: string }>;
  organizers: Array<{ id: string; name: string; slug: string }>;
}

export function SearchSuggestions({ query, onSelect }: SearchSuggestionsProps) {
  const [results, setResults] = useState<SuggestionResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [query]);

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-warm-white rounded-lg shadow-dropdown p-4 z-dropdown">
        <Spinner />
      </div>
    );
  }

  if (!results) return null;

  const hasResults = results.events.length || results.venues.length || results.organizers.length;

  if (!hasResults) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-warm-white rounded-lg shadow-dropdown p-4 z-dropdown">
        <p className="text-stone text-center">No results for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-warm-white rounded-lg shadow-dropdown z-dropdown overflow-hidden">
      {results.events.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-sand/50 text-caption text-stone uppercase">Events</div>
          {results.events.map((event) => (
            <Link
              key={event.id}
              href={`/event/${event.slug}-${event.instance_date}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-3 hover:bg-cream"
            >
              <Calendar className="w-4 h-4 text-stone" />
              <span className="text-charcoal">{event.title}</span>
            </Link>
          ))}
        </div>
      )}

      {results.venues.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-sand/50 text-caption text-stone uppercase">Venues</div>
          {results.venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.slug}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-3 hover:bg-cream"
            >
              <MapPin className="w-4 h-4 text-stone" />
              <span className="text-charcoal">{venue.name}</span>
            </Link>
          ))}
        </div>
      )}

      {results.organizers.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-sand/50 text-caption text-stone uppercase">Organizers</div>
          {results.organizers.map((org) => (
            <Link
              key={org.id}
              href={`/organizer/${org.slug}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-3 hover:bg-cream"
            >
              <User className="w-4 h-4 text-stone" />
              <span className="text-charcoal">{org.name}</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        onClick={onSelect}
        className="block px-4 py-3 text-center text-coral hover:bg-cream border-t border-sand"
      >
        See all results for "{query}"
      </Link>
    </div>
  );
}
```

---

## Hearts / Saved Events (Phase 4)

### Heart Button Component

**File:** `src/components/hearts/heart-button.tsx`

```typescript
'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeartButtonProps {
  eventId: string;
  initialHearted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay';
  isAuthenticated?: boolean;
}

export function HeartButton({
  eventId,
  initialHearted = false,
  size = 'md',
  variant = 'default',
  isAuthenticated = false,
}: HeartButtonProps) {
  const router = useRouter();
  const [isHearted, setIsHearted] = useState(initialHearted);
  const [isPending, startTransition] = useTransition();

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=/event/${eventId}`);
      return;
    }

    // Optimistic update
    setIsHearted(!isHearted);

    startTransition(async () => {
      try {
        const res = await fetch('/api/hearts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        });

        if (!res.ok) {
          // Revert on error
          setIsHearted(isHearted);
        }
      } catch (error) {
        // Revert on error
        setIsHearted(isHearted);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'transition-all',
        variant === 'overlay' && 'p-2 rounded-full bg-warm-white/80 backdrop-blur-sm hover:bg-warm-white',
        variant === 'default' && 'p-1 hover:scale-110',
        isPending && 'opacity-50',
      )}
      aria-label={isHearted ? 'Remove from saved' : 'Save event'}
    >
      <Heart
        className={cn(
          iconSize,
          'transition-all',
          isHearted 
            ? 'fill-coral text-coral scale-110' 
            : 'fill-none text-stone hover:text-coral',
        )}
      />
    </button>
  );
}
```

### Heart Hook (with Auth Check)

**File:** `src/hooks/use-heart.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useHeart(eventId: string) {
  const [isHearted, setIsHearted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkHeartStatus = async () => {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('hearts')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

      setIsHearted(!!data);
      setIsLoading(false);
    };

    checkHeartStatus();
  }, [eventId]);

  return { isHearted, isLoading, isAuthenticated };
}
```

---

## User Authentication (Phase 3) ✅ IMPLEMENTED

### Magic Link Authentication

Happenlist uses passwordless magic link authentication for simplicity and security.

**Flow:**
1. User enters email on `/auth/login`
2. Supabase sends magic link email
3. User clicks link → `/auth/callback` handles token
4. User is redirected to original destination

**File:** `src/lib/auth/session.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

// Get current session (for Server Components)
export async function getSession(): Promise<{
  session: Session | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { session: null, error: error?.message || null };
  }

  return {
    session: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name,
    },
    error: null,
  };
}

// Require authentication (throws redirect)
export async function requireAuth(redirectTo?: string) {
  const { session } = await getSession();
  if (!session) {
    redirect(`/auth/login?redirect=${redirectTo || '/'}`);
  }
  return session;
}

// Require admin (throws redirect if not admin)
export async function requireAdminAuth() {
  const { session } = await getSession();
  if (!session) {
    redirect('/auth/login?redirect=/admin');
  }
  if (!isAdmin(session.email)) {
    redirect('/');
  }
  return session;
}
```

**File:** `src/lib/auth/is-admin.ts`

```typescript
// Admin check via environment variable
export function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}
```

### Auth Provider

**File:** `src/components/auth/auth-provider.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Protected Routes Middleware

**File:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedRoutes = ['/my', '/dashboard'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Check if accessing protected route without auth
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/my/:path*', '/dashboard/:path*'],
};
```

---

## Infinite Scroll / Pagination

### Infinite Scroll Hook

**File:** `src/hooks/use-infinite-scroll.ts`

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: `${threshold}px`,
    });

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  return { sentinelRef };
}
```

### Usage in Events Page

```typescript
'use client';

import { useState } from 'react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { EventGrid } from '@/components/events';

export function EventsList({ initialEvents, total }) {
  const [events, setEvents] = useState(initialEvents);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = events.length < total;

  const loadMore = async () => {
    setIsLoading(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/events?page=${nextPage}`);
    const { events: newEvents } = await res.json();
    setEvents([...events, ...newEvents]);
    setPage(nextPage);
    setIsLoading(false);
  };

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
  });

  return (
    <>
      <EventGrid events={events} />
      <div ref={sentinelRef} className="h-10" />
      {isLoading && <Spinner />}
    </>
  );
}
```

---

## Debounce Hook

**File:** `src/hooks/use-debounce.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## Event Submission (Phase 3) ✅ IMPLEMENTED

### Overview

The event submission system allows community members to submit events for review and publication.

**User Flow:**
1. User signs in via magic link
2. User navigates to `/submit/new`
3. Multi-step form (7 steps) with auto-save
4. User reviews and submits
5. Admin reviews in queue
6. User notified of outcome

### Form Steps

| Step | Name | Fields |
|------|------|--------|
| 1 | Basic Info | Title, category, description |
| 2 | Event Type | Single event, series, or recurring |
| 3 | Date & Time | Date picker, time, duration |
| 4 | Location | Venue search, new address, or virtual |
| 5 | Pricing | Free, fixed price, range, or varies |
| 6 | Image | Image URL or upload |
| 7 | Review | Preview all info before submit |

### Event Status Flow

```
┌─────────┐     submit      ┌────────────────┐
│  draft  │ ───────────────►│ pending_review │
└─────────┘                  └───────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌───────────┐    ┌────────────┐    ┌──────────────────┐
            │ published │    │  rejected  │    │ changes_requested│
            └───────────┘    └────────────┘    └────────┬─────────┘
                                                        │
                                                        │ edit & resubmit
                                                        │
                                                        ▼
                                               ┌────────────────┐
                                               │ pending_review │
                                               └────────────────┘
```

### Status Labels & Colors

```typescript
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-stone/20 text-stone',
  pending_review: 'bg-amber-100 text-amber-800',
  published: 'bg-sage/20 text-sage-dark',
  changes_requested: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-stone/20 text-stone',
  postponed: 'bg-amber-100 text-amber-800',
};
```

### Form Wrapper Component

**File:** `src/components/submit/form-wrapper.tsx`

```typescript
'use client';

// Handles:
// - Step navigation (back/next)
// - Step validation before proceeding
// - Auto-save on step changes
// - Final submission
// - Last saved timestamp display

interface FormWrapperProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  draftData: EventDraftData;
  completedSteps: number[];
  onSave: () => Promise<void>;
  onSubmit: () => Promise<void>;
  isSaving: boolean;
  isSubmitting: boolean;
  lastSaved?: Date;
  children: React.ReactNode;
}

export function FormWrapper({
  currentStep,
  setCurrentStep,
  draftData,
  completedSteps,
  onSave,
  onSubmit,
  isSaving,
  isSubmitting,
  lastSaved,
  children,
}: FormWrapperProps) {
  // Validate current step before allowing next
  const canProceed = validateStep(currentStep, draftData);

  const handleNext = async () => {
    if (!canProceed) return;
    await onSave();
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === TOTAL_STEPS) {
      await onSubmit();
    }
  };

  return (
    <Container>
      <StepProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <div className="py-8">
        {children}
      </div>

      <FormNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        canProceed={canProceed}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        lastSaved={lastSaved}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </Container>
  );
}
```

### Step Validation

**File:** `src/types/submission.ts`

```typescript
// Step 1: Basic Info
export function validateStep1(data: EventDraftData): boolean {
  return !!(data.title?.trim() && data.category_id);
}

// Step 2: Event Type
export function validateStep2(data: EventDraftData): boolean {
  if (!data.event_mode) return false;
  if (data.event_mode === 'series' && !data.series_id && !data.series_title) {
    return false;
  }
  return true;
}

// Step 3: Date/Time
export function validateStep3(data: EventDraftData): boolean {
  return !!(data.instance_date && data.start_time);
}

// Step 4: Location
export function validateStep4(data: EventDraftData): boolean {
  if (!data.location_mode) return false;
  if (data.location_mode === 'venue') return !!data.location_id;
  if (data.location_mode === 'address') return !!(data.address_line && data.city);
  if (data.location_mode === 'virtual') return true;
  if (data.location_mode === 'tbd') return true;
  return false;
}

// Step 5: Pricing
export function validateStep5(data: EventDraftData): boolean {
  if (!data.price_type) return false;
  if (data.price_type === 'fixed' && !data.price_low) return false;
  if (data.price_type === 'range' && (!data.price_low || !data.price_high)) return false;
  return true;
}
```

### Admin Actions

**File:** `src/data/admin/event-actions.ts`

```typescript
// Approve events
export async function approveEvents(params: {
  eventIds: string[];
  adminEmail: string;
}): Promise<{ succeeded: string[]; failed: string[] }> {
  // Updates status → published
  // Sets reviewed_at, reviewed_by
  // Logs to admin_audit_log
}

// Reject events
export async function rejectEvents(params: {
  eventIds: string[];
  reason: string;
  adminEmail: string;
}): Promise<{ succeeded: string[]; failed: string[] }> {
  // Updates status → rejected
  // Sets rejection_reason
  // Logs to admin_audit_log
}

// Request changes
export async function requestEventChanges(params: {
  eventId: string;
  message: string;
  adminEmail: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Updates status → changes_requested
  // Sets change_request_message
  // Logs to admin_audit_log
}

// Soft delete
export async function softDeleteEvent(params: {
  eventId: string;
  reason?: string;
  adminEmail: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Sets deleted_at, deleted_by, delete_reason
  // Logs to admin_audit_log
}

// Restore deleted event
export async function restoreEvent(params: {
  eventId: string;
  adminEmail: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Clears deleted_at, deleted_by
  // Logs to admin_audit_log
}
```

### Console Logging

The submission system uses emoji-prefixed logging for easy debugging:

```
📝 [createDraft] Creating draft for user@example.com
✅ [createDraft] Draft created: draft-123

💾 [updateDraft] Saving draft: draft-123, step: 3
✅ [updateDraft] Draft updated

📤 [submitEvent] Submitting event from draft: draft-123
🏠 [submitEvent] Creating new location: Art Studio MKE
📚 [submitEvent] Creating new series: Pottery 101
✅ [submitEvent] Event submitted: event-456

🔍 [getUserSubmissions] Fetching for user@example.com
✅ [getUserSubmissions] Found 5 submissions

✅ [approveEvents] Approved 3 events by admin@example.com
⚠️ [rejectEvents] Rejected event-789: "Not appropriate for platform"
📝 [requestEventChanges] Changes requested for event-012
```
