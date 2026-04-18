/**
 * ADMIN PERFORMERS LIST PAGE
 */

import { EntityListPage } from '@/components/admin';

export const metadata = { title: 'Performers — Admin' };

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPerformersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <EntityListPage
      kind="performer"
      searchParams={sp}
      extraFilters={[]}
    />
  );
}
