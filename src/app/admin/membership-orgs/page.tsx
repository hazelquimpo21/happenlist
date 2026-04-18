/**
 * ADMIN MEMBERSHIP ORGS LIST PAGE
 */

import { EntityListPage } from '@/components/admin';

export const metadata = { title: 'Membership Orgs — Admin' };

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminMembershipOrgsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <EntityListPage kind="membership_org" searchParams={sp} extraFilters={[]} />
  );
}
