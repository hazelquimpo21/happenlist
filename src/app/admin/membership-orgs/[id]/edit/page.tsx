/**
 * SUPERADMIN MEMBERSHIP ORG EDIT PAGE
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminMembershipOrgEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { getOrganizersForPicker } from '@/data/admin/get-organizers-for-picker';

export const metadata = { title: 'Edit Membership Org' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminMembershipOrgEditPage({ params }: PageProps) {
  const { id } = await params;

  const { session } = await getSession();
  if (!session) redirect('/auth/login?redirect=/admin/membership-orgs/' + id + '/edit');
  if (!isSuperAdmin(session.email)) redirect('/admin');

  const supabase = createAdminClient();
  const [{ data: orgData, error }, organizers] = await Promise.all([
    supabase.from('membership_organizations').select('*').eq('id', id).single(),
    getOrganizersForPicker(),
  ]);

  if (error || !orgData) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = orgData as any;

  return (
    <div className="min-h-screen">
      <AdminHeader title="Edit Membership Org" description="Superadmin editing mode">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>
          <div className="flex-1" />
          <Link
            href={`/membership/${org.slug}`}
            className="flex items-center gap-2 text-sm text-zinc hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Membership Org
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Membership Orgs', href: '/admin/membership-orgs' },
            { label: org.name },
            { label: 'Edit' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SuperadminMembershipOrgEditForm
              mode="edit"
              membershipOrg={org}
              organizers={organizers}
            />
          </div>
          <div className="space-y-6">
            <Card padding="lg" className="border border-mist">
              <h3 className="font-medium text-ink mb-4">Membership Org Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc">ID</dt>
                  <dd className="text-ink font-mono text-xs">{org.id.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc">Slug</dt>
                  <dd className="text-ink">{org.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc">Active</dt>
                  <dd className="text-ink">{org.is_active ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
