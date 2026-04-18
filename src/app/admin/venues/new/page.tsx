/**
 * ADMIN NEW VENUE PAGE
 * ====================
 * Superadmin-only create page for `locations`. Reuses SuperadminVenueEditForm
 * in mode='create'.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminVenueEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSession, isSuperAdmin } from '@/lib/auth';

export const metadata = { title: 'New Venue' };

export default async function AdminNewVenuePage() {
  const { session } = await getSession();
  if (!session) redirect('/auth/login?redirect=/admin/venues/new');
  if (!isSuperAdmin(session.email)) redirect('/admin');

  return (
    <div className="min-h-screen">
      <AdminHeader title="New Venue" description="Create a new venue record">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>
          <div className="flex-1" />
          <Link
            href="/admin/venues"
            className="flex items-center gap-2 text-sm text-zinc hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Venues
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Venues', href: '/admin/venues' },
            { label: 'New' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SuperadminVenueEditForm mode="create" />
          </div>
          <div className="space-y-6">
            <Card padding="lg" className="border border-purple-200 bg-purple-50/50">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Superadmin Creation
              </h3>
              <p className="text-sm text-purple-700">
                `name` and `city` are required. Slug is auto-generated from the
                name. You&apos;ll be redirected to the edit page on save.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
