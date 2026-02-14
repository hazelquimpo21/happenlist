/**
 * SUPERADMIN SERIES EDIT PAGE
 * ===========================
 * Full edit page for superadmins to modify any series.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminSeriesEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getSession, isSuperAdmin } from '@/lib/auth';

export const metadata = {
  title: 'Edit Series',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminSeriesEditPage({ params }: PageProps) {
  const { id: seriesId } = await params;

  // Check authentication and superadmin status
  const { session } = await getSession();

  if (!session) {
    redirect('/auth/login?redirect=/admin/series/' + seriesId + '/edit');
  }

  if (!isSuperAdmin(session.email)) {
    redirect('/admin');
  }

  // Fetch series
  const supabase = await createClient();
  const { data: series, error } = await supabase
    .from('series')
    .select('*')
    .eq('id', seriesId)
    .single();

  if (error || !series) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Edit Series"
        description="Superadmin editing mode"
      >
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>

          <div className="flex-1" />

          <Link
            href={`/series/${series.slug}`}
            className="flex items-center gap-2 text-sm text-stone hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Series
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: series.title },
            { label: 'Edit' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Edit form */}
          <div className="lg:col-span-2">
            <SuperadminSeriesEditForm series={series} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card padding="lg" className="border border-sand">
              <h3 className="font-medium text-charcoal mb-4">Series Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone">ID</dt>
                  <dd className="text-charcoal font-mono text-xs">{series.id.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Slug</dt>
                  <dd className="text-charcoal">{series.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Type</dt>
                  <dd className="text-charcoal capitalize">{series.series_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Status</dt>
                  <dd className="text-charcoal capitalize">{series.status}</dd>
                </div>
                {series.total_sessions && (
                  <div className="flex justify-between">
                    <dt className="text-stone">Sessions</dt>
                    <dd className="text-charcoal">{series.total_sessions}</dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card padding="lg" className="border border-purple-200 bg-purple-50/50">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Superadmin Editing
              </h3>
              <p className="text-sm text-purple-700">
                You are editing this series as a superadmin. All changes are
                logged to the audit trail.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
