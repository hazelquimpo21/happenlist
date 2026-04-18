/**
 * ADMIN NEW PERFORMER PAGE
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { SuperadminPerformerEditForm } from '@/components/superadmin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSession, isSuperAdmin } from '@/lib/auth';

export const metadata = { title: 'New Performer' };

export default async function AdminNewPerformerPage() {
  const { session } = await getSession();
  if (!session) redirect('/auth/login?redirect=/admin/performers/new');
  if (!isSuperAdmin(session.email)) redirect('/admin');

  return (
    <div className="min-h-screen">
      <AdminHeader title="New Performer" description="Create a new performer record">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Superadmin Mode
          </Badge>
          <div className="flex-1" />
          <Link
            href="/admin/performers"
            className="flex items-center gap-2 text-sm text-zinc hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Performers
          </Link>
        </div>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Performers', href: '/admin/performers' },
            { label: 'New' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SuperadminPerformerEditForm mode="create" />
          </div>
          <div className="space-y-6">
            <Card padding="lg" className="border border-purple-200 bg-purple-50/50">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Superadmin Creation
              </h3>
              <p className="text-sm text-purple-700">
                New performer. Slug is auto-generated. You&apos;ll be redirected
                to the edit page on save.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
