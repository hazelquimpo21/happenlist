/**
 * ADMIN ORGANIZERS LIST PAGE
 * ==========================
 * Thin wrapper — all logic lives in the shared EntityListPage.
 * Only concern here: which extra filter pills to show for this entity.
 */

import { EntityListPage } from '@/components/admin';

export const metadata = { title: 'Organizers — Admin' };

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminOrganizersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <EntityListPage
      kind="organizer"
      searchParams={sp}
      extraFilters={[
        {
          param: 'verified',
          label: 'Verified',
          options: [
            { value: undefined, label: 'Any' },
            { value: 'true', label: 'Verified' },
            { value: 'false', label: 'Unverified' },
          ],
        },
        {
          param: 'membership',
          label: 'Membership',
          options: [
            { value: undefined, label: 'Any' },
            { value: 'true', label: 'Membership orgs' },
          ],
        },
      ]}
    />
  );
}
