/**
 * SUPERADMIN ORGANIZER EDIT PAGE
 * ==============================
 * Full edit page for superadmins to modify any organizer.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminOrganizerEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getSession, isSuperAdmin } from '@/lib/auth';

export const metadata = {
  title: 'Edit Organizer',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminOrganizerEditPage({ params }: PageProps) {
  const { id: organizerId } = await params;

  // Check authentication and superadmin status
  const { session } = await getSession();

  if (!session) {
    redirect('/auth/login?redirect=/admin/organizers/' + organizerId + '/edit');
  }

  if (!isSuperAdmin(session.email)) {
    redirect('/admin');
  }

  // Fetch organizer
  const supabase = await createClient();
  const { data: organizer, error } = await supabase
    .from('organizers')
    .select('*')
    .eq('id', organizerId)
    .single();

  if (error || !organizer) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Edit Organizer"
        description="Superadmin editing mode"
      >
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>

          <div className="flex-1" />

          <Link
            href={`/organizer/${organizer.slug}`}
            className="flex items-center gap-2 text-sm text-stone hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizer
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: organizer.name },
            { label: 'Edit' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Edit form */}
          <div className="lg:col-span-2">
            <SuperadminOrganizerEditForm organizer={organizer} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card padding="lg" className="border border-sand">
              <h3 className="font-medium text-charcoal mb-4">Organizer Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone">ID</dt>
                  <dd className="text-charcoal font-mono text-xs">{organizer.id.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Slug</dt>
                  <dd className="text-charcoal">{organizer.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Active</dt>
                  <dd className="text-charcoal">{organizer.is_active ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone">Verified</dt>
                  <dd className="text-charcoal">{organizer.is_verified ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </Card>

            <Card padding="lg" className="border border-purple-200 bg-purple-50/50">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Superadmin Editing
              </h3>
              <p className="text-sm text-purple-700">
                You are editing this organizer as a superadmin. All changes are
                logged to the audit trail.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
