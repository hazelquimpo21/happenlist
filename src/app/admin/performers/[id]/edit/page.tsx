/**
 * SUPERADMIN PERFORMER EDIT PAGE
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminPerformerEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession, isSuperAdmin } from '@/lib/auth';

export const metadata = { title: 'Edit Performer' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperadminPerformerEditPage({ params }: PageProps) {
  const { id: performerId } = await params;

  const { session } = await getSession();
  if (!session) redirect('/auth/login?redirect=/admin/performers/' + performerId + '/edit');
  if (!isSuperAdmin(session.email)) redirect('/admin');

  // Service-role client — bypasses RLS so we can edit inactive rows too.
  const supabase = createAdminClient();
  const { data: performerData, error } = await supabase
    .from('performers')
    .select('*')
    .eq('id', performerId)
    .single();

  if (error || !performerData) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const performer = performerData as any;

  return (
    <div className="min-h-screen">
      <AdminHeader title="Edit Performer" description="Superadmin editing mode">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>
          <div className="flex-1" />
          <Link
            href={`/performer/${performer.slug}`}
            className="flex items-center gap-2 text-sm text-zinc hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Performer
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Performers', href: '/admin/performers' },
            { label: performer.name },
            { label: 'Edit' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SuperadminPerformerEditForm mode="edit" performer={performer} />
          </div>
          <div className="space-y-6">
            <Card padding="lg" className="border border-mist">
              <h3 className="font-medium text-ink mb-4">Performer Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc">ID</dt>
                  <dd className="text-ink font-mono text-xs">{performer.id.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc">Slug</dt>
                  <dd className="text-ink">{performer.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc">Active</dt>
                  <dd className="text-ink">{performer.is_active ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
