/**
 * SUPERADMIN VENUE EDIT PAGE
 * ==========================
 * Full edit page for superadmins to modify any venue.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, MapPin } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminVenueEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getSession, isSuperAdmin } from '@/lib/auth';

export const metadata = {
  title: 'Edit Venue',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminVenueEditPage({ params }: PageProps) {
  const { id: venueId } = await params;

  // Check authentication and superadmin status
  const { session } = await getSession();

  if (!session) {
    redirect('/auth/login?redirect=/admin/venues/' + venueId + '/edit');
  }

  if (!isSuperAdmin(session.email)) {
    redirect('/admin');
  }

  // Fetch venue
  const supabase = await createClient();
  const { data: venue, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', venueId)
    .single();

  if (error || !venue) {
    notFound();
  }

  // Format address for display
  const fullAddress = [venue.address_line, venue.city, venue.state, venue.postal_code]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Edit Venue"
        description="Superadmin editing mode"
      >
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>

          <div className="flex-1" />

          <Link
            href={`/venue/${venue.slug}`}
            className="flex items-center gap-2 text-sm text-stone hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Venue
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: venue.name },
            { label: 'Edit' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Edit form */}
          <div className="lg:col-span-2">
            <SuperadminVenueEditForm venue={venue} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card padding="lg" className="border border-sand">
              <h3 className="font-medium text-charcoal mb-4">Venue Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone">ID</dt>
                  <dd className="text-charcoal font-mono text-xs">{venue.id.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Slug</dt>
                  <dd className="text-charcoal">{venue.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Type</dt>
                  <dd className="text-charcoal capitalize">{venue.venue_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Active</dt>
                  <dd className="text-charcoal">{venue.is_active ? 'Yes' : 'No'}</dd>
                </div>
                {fullAddress && (
                  <div className="flex items-start gap-2 pt-2 border-t border-sand/50">
                    <MapPin className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                    <p className="text-charcoal text-xs">{fullAddress}</p>
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
                You are editing this venue as a superadmin. All changes are
                logged to the audit trail.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
