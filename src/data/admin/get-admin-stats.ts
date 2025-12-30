/**
 * GET ADMIN STATS
 * ================
 * Fetches statistics for the admin dashboard.
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger } from '@/lib/utils/logger';
import type { Database } from '@/lib/supabase/types';

export type AuditLogEntry = Database['public']['Tables']['admin_audit_log']['Row'];

// Temporary interface until migration is run and types regenerated
interface EventWithAdminFields {
  status: string;
  source: string;
  scraped_at: string | null;
  reviewed_at: string | null;
}

export interface AdminStats {
  pendingReviewCount: number;
  publishedCount: number;
  draftCount: number;
  rejectedCount: number;
  scrapedCount: number;
  scrapedPendingCount: number;
  scrapedLast24h: number;
  reviewedLast24h: number;
  totalCount: number;
}

/**
 * Fetch admin dashboard statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  const timer = adminDataLogger.time('getAdminStats', { action: 'fetch_stats' });

  try {
    const supabase = await createClient();

    // Fetch all counts in a single query for efficiency
    const { data, error } = await supabase
      .from('events')
      .select('status, source, scraped_at, reviewed_at', { count: 'exact' });

    if (error) {
      timer.error('Failed to fetch event stats', error);
      throw error;
    }

    // Type assertion until migration is run
    const events = (data || []) as EventWithAdminFields[];
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats: AdminStats = {
      pendingReviewCount: events.filter((e) => e.status === 'pending_review').length,
      publishedCount: events.filter((e) => e.status === 'published').length,
      draftCount: events.filter((e) => e.status === 'draft').length,
      rejectedCount: events.filter((e) => e.status === 'rejected').length,
      scrapedCount: events.filter((e) => e.source !== 'manual').length,
      scrapedPendingCount: events.filter(
        (e) => e.source !== 'manual' && e.status === 'pending_review'
      ).length,
      scrapedLast24h: events.filter(
        (e) => e.scraped_at && new Date(e.scraped_at) > yesterday
      ).length,
      reviewedLast24h: events.filter(
        (e) => e.reviewed_at && new Date(e.reviewed_at) > yesterday
      ).length,
      totalCount: events.length,
    };

    timer.success('Fetched admin stats', {
      metadata: {
        pending: stats.pendingReviewCount,
        published: stats.publishedCount,
        total: stats.totalCount,
      },
    });

    return stats;
  } catch (error) {
    timer.error('Failed to fetch admin stats', error);
    throw error;
  }
}

/**
 * Fetch recent activity for the admin dashboard
 */
export async function getRecentActivity(limit: number = 10): Promise<AuditLogEntry[]> {
  const timer = adminDataLogger.time('getRecentActivity', { action: 'fetch' });

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      timer.error('Failed to fetch recent activity', error);
      throw error;
    }

    timer.success(`Fetched ${data?.length || 0} recent activities`);
    return data || [];
  } catch (error) {
    timer.error('Failed to fetch recent activity', error);
    throw error;
  }
}
