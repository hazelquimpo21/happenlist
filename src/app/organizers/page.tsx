/**
 * ORGANIZERS INDEX PAGE
 * =====================
 * Lists all event organizers.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui';
import { getOrganizers } from '@/data/organizers';
import { buildOrganizerUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Organizers',
  description: 'Discover event organizers. Find local organizations, venues, and creators hosting events.',
};

interface OrganizersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

/**
 * Organizers listing page.
 */
export default async function OrganizersPage({ searchParams }: OrganizersPageProps) {
  const params = await searchParams;

  console.log('👥 [OrganizersPage] Rendering organizers page');

  const page = parseInt(params.page || '1', 10);

  const { organizers, total } = await getOrganizers({
    search: params.q,
    page,
    limit: 24,
  });

  console.log(`✅ [OrganizersPage] Found ${organizers.length} organizers`);

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Organizers' }]}
        className="mb-6"
      />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-body text-h1 text-ink">Organizers</h1>
        <p className="text-zinc text-body mt-2">
          {total} {total === 1 ? 'organizer' : 'organizers'} hosting events
        </p>
      </div>

      {/* Organizers grid */}
      {organizers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizers.map((organizer) => (
            <Link key={organizer.id} href={buildOrganizerUrl(organizer)}>
              <Card
                className="h-full hover:shadow-card-hover transition-shadow"
                padding="lg"
              >
                <div className="flex items-start gap-4">
                  {/* Organizer logo */}
                  <div className="w-16 h-16 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {organizer.logo_url ? (
                      <Image
                        src={organizer.logo_url}
                        alt={organizer.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-blue" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-body text-h4 text-ink group-hover:text-blue transition-colors">
                      {organizer.name}
                    </h2>
                    {organizer.description && (
                      <p className="text-body-sm text-zinc mt-1 line-clamp-2">
                        {organizer.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <User className="w-12 h-12 text-zinc/40 mx-auto mb-4" />
          <h2 className="font-body text-h3 text-ink mb-2">
            No organizers found
          </h2>
          <p className="text-zinc">
            Check back soon for organizer listings!
          </p>
        </div>
      )}

      {/* Pagination */}
      {total > 24 && (
        <div className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/organizers?page=${page - 1}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-zinc">
            Page {page} of {Math.ceil(total / 24)}
          </span>
          {page * 24 < total && (
            <a
              href={`/organizers?page=${page + 1}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </Container>
  );
}
