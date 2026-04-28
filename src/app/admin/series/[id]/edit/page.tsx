/**
 * SUPERADMIN SERIES EDIT PAGE
 * ============================
 * Auth gate + data fetch. The actual layout (command bar, hero, tabs,
 * sidebar) lives inside SuperadminSeriesEditForm so the form can stay
 * cohesive across full-page and embed contexts.
 *
 * @module app/admin/series/[id]/edit
 */
import { notFound, redirect } from 'next/navigation';
import { SuperadminSeriesEditForm } from '@/components/superadmin';
import { createClient } from '@/lib/supabase/server';
import { getSession, isSuperAdmin } from '@/lib/auth';

export const metadata = { title: 'Edit Series' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminSeriesEditPage({ params }: PageProps) {
  const { id: seriesId } = await params;

  const { session } = await getSession();
  if (!session) redirect('/auth/login?redirect=/admin/series/' + seriesId + '/edit');
  if (!isSuperAdmin(session.email)) redirect('/admin');

  const supabase = await createClient();
  const [seriesRes, totalEventsRes, activeEventsRes] = await Promise.all([
    supabase.from('series').select('*').eq('id', seriesId).single(),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('series_id', seriesId),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('series_id', seriesId)
      .neq('status', 'cancelled'),
  ]);

  const seriesData = seriesRes.data;
  if (seriesRes.error || !seriesData) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series = seriesData as any;
  const totalEventsCount = totalEventsRes.count ?? 0;
  const activeEventsCount = activeEventsRes.count ?? 0;

  // Re-key on updated_at so a save → router.refresh() roundtrip remounts
  // the form with a fresh dirty-diff baseline.
  const formKey = `${series.id}:${series.updated_at ?? ''}`;

  return (
    <SuperadminSeriesEditForm
      key={formKey}
      series={series}
      totalEventsCount={totalEventsCount}
      activeEventsCount={activeEventsCount}
    />
  );
}
