/**
 * ADMIN VENUES LIST PAGE
 * ======================
 * Locations table — 3,400+ rows — so the search + status filter + venue-type
 * pills are load-bearing. All logic lives in the shared EntityListPage.
 */

import { EntityListPage } from '@/components/admin';

export const metadata = { title: 'Venues — Admin' };

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminVenuesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <EntityListPage
      kind="venue"
      searchParams={sp}
      extraFilters={[
        {
          param: 'venueType',
          label: 'Type',
          options: [
            { value: undefined, label: 'All' },
            { value: 'venue', label: 'Venue' },
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
            { value: 'restaurant', label: 'Restaurant' },
            { value: 'bar', label: 'Bar' },
            { value: 'park', label: 'Park' },
            { value: 'other', label: 'Other' },
          ],
        },
      ]}
    />
  );
}
