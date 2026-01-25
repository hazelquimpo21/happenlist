/**
 * ADMIN EVENT FILTERS
 * ===================
 * Client-side filter components for admin events page.
 * These need to be client components because they use onChange handlers.
 */
'use client';

import { useRouter } from 'next/navigation';
import { Filter, ArrowUpDown } from 'lucide-react';

interface AdminEventFiltersProps {
  currentSource?: string;
  currentOrderBy: string;
  currentOrderDir: string;
  currentStatus?: string;
}

export function AdminEventFilters({
  currentSource,
  currentOrderBy,
  currentOrderDir,
  currentStatus,
}: AdminEventFiltersProps) {
  const router = useRouter();

  // Build filter URL helper
  const buildFilterUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    const baseParams = {
      status: currentStatus,
      source: currentSource,
      orderBy: currentOrderBy,
      orderDir: currentOrderDir,
      ...params,
    };
    
    Object.entries(baseParams).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    return `/admin/events?${newParams.toString()}`;
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newUrl = buildFilterUrl({
      source: value === 'all' ? undefined : value,
      page: undefined,
    });
    router.push(newUrl);
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newUrl = buildFilterUrl({
      orderBy: value,
      page: undefined,
    });
    router.push(newUrl);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Source filter */}
      <div className="relative">
        <select
          className="appearance-none bg-warm-white border border-sand rounded-lg px-4 py-2 pr-10 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none cursor-pointer"
          defaultValue={currentSource || 'all'}
          onChange={handleSourceChange}
        >
          <option value="all">All Sources</option>
          <option value="scraper">Scraped</option>
          <option value="manual">Manual</option>
          <option value="api">API</option>
          <option value="import">Import</option>
        </select>
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          className="appearance-none bg-warm-white border border-sand rounded-lg px-4 py-2 pr-10 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none cursor-pointer"
          defaultValue={currentOrderBy}
          onChange={handleOrderChange}
        >
          <option value="created_at">Created Date</option>
          <option value="start_datetime">Event Date</option>
          <option value="title">Title</option>
          <option value="scraped_at">Scraped Date</option>
        </select>
        <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone pointer-events-none" />
      </div>
    </div>
  );
}





