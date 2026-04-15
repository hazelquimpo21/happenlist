/**
 * ADMIN EVENT FILTERS
 * ===================
 * Client-side filter components for admin events page.
 * These need to be client components because they use onChange handlers.
 */
'use client';

import { useState } from 'react';
import { Filter, ArrowUpDown, Upload, Loader2, Repeat } from 'lucide-react';

interface AdminEventFiltersProps {
  currentSource?: string;
  currentOrderBy: string;
  currentOrderDir: string;
  currentStatus?: string;
  currentSeriesFilter?: string;
  currentSearch?: string;
}

export function AdminEventFilters({
  currentSource,
  currentOrderBy,
  currentOrderDir,
  currentStatus,
  currentSearch,
  currentSeriesFilter,
}: AdminEventFiltersProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleMigrateImages = async () => {
    if (isMigrating) return;

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      // First, do a dry run to see how many images need migration
      const previewResponse = await fetch('/api/admin/migrate-images');
      const preview = await previewResponse.json();

      if (preview.stats?.totalWithExternalImages === 0) {
        setMigrationResult({
          success: true,
          message: 'All images are already hosted in Supabase!',
        });
        setIsMigrating(false);
        return;
      }

      // Confirm migration
      const confirmMsg = `Migrate ${preview.stats.totalWithExternalImages} external images to Supabase Storage?`;
      if (!confirm(confirmMsg)) {
        setIsMigrating(false);
        return;
      }

      // Run the migration
      const response = await fetch('/api/admin/migrate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, limit: 50 }),
      });

      const result = await response.json();

      if (result.summary) {
        setMigrationResult({
          success: result.summary.failed === 0,
          message: `Migrated ${result.summary.successful} images. ${result.summary.failed} failed.`,
        });
      } else {
        setMigrationResult({
          success: false,
          message: result.error || 'Migration failed',
        });
      }

      // Refresh the page to show updated images
      window.location.reload();
    } catch {
      setMigrationResult({
        success: false,
        message: 'Failed to migrate images',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Build filter URL helper
  const buildFilterUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    const baseParams = {
      status: currentStatus,
      source: currentSource,
      q: currentSearch,
      series: currentSeriesFilter,
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
    window.location.href = newUrl;
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newUrl = buildFilterUrl({
      orderBy: value,
      page: undefined,
    });
    window.location.href = newUrl;
  };

  const handleSeriesFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newUrl = buildFilterUrl({
      series: value === 'all' ? undefined : value,
      page: undefined,
    });
    window.location.href = newUrl;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Series filter */}
      <div className="relative">
        <select
          className="appearance-none bg-pure border border-mist rounded-lg px-4 py-2 pr-10 text-sm focus:border-coral focus:ring-1 focus:ring-blue outline-none cursor-pointer"
          value={currentSeriesFilter || 'all'}
          onChange={handleSeriesFilterChange}
        >
          <option value="all">All Events</option>
          <option value="in_series">In a Series</option>
          <option value="no_series">Not in Series</option>
        </select>
        <Repeat className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none" />
      </div>

      {/* Source filter */}
      <div className="relative">
        <select
          className="appearance-none bg-pure border border-mist rounded-lg px-4 py-2 pr-10 text-sm focus:border-coral focus:ring-1 focus:ring-blue outline-none cursor-pointer"
          value={currentSource || 'all'}
          onChange={handleSourceChange}
        >
          <option value="all">All Sources</option>
          <option value="scraper">Scraped</option>
          <option value="manual">Manual</option>
          <option value="api">API</option>
          <option value="import">Import</option>
        </select>
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none" />
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          className="appearance-none bg-pure border border-mist rounded-lg px-4 py-2 pr-10 text-sm focus:border-coral focus:ring-1 focus:ring-blue outline-none cursor-pointer"
          value={currentOrderBy}
          onChange={handleOrderChange}
        >
          <option value="created_at">Created Date</option>
          <option value="start_datetime">Event Date</option>
          <option value="title">Title</option>
          <option value="scraped_at">Scraped Date</option>
        </select>
        <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc pointer-events-none" />
      </div>

      {/* Migrate Images Button */}
      <button
        onClick={handleMigrateImages}
        disabled={isMigrating}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue text-pure rounded-lg hover:bg-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Upload external images to Supabase Storage"
      >
        {isMigrating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {isMigrating ? 'Migrating...' : 'Migrate Images'}
      </button>

      {/* Migration result message */}
      {migrationResult && (
        <span
          className={`text-sm ${migrationResult.success ? 'text-green-600' : 'text-red-600'}`}
        >
          {migrationResult.message}
        </span>
      )}
    </div>
  );
}





