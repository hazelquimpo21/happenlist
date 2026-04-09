/**
 * MEMBERSHIPS DIRECTORY PAGE
 * ==========================
 * Browse membership organizations and discover which memberships
 * give the most event benefits in Milwaukee.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Ticket } from 'lucide-react';
import { Container, Breadcrumbs } from '@/components/layout';
import { getMembershipOrgs } from '@/data/membership';

export const metadata: Metadata = {
  title: 'Memberships',
  description: 'Discover which Milwaukee memberships give you the most event perks — free admission, discounts, early access, and more.',
};

interface MembershipsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function MembershipsPage({ searchParams }: MembershipsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  const { orgs, total } = await getMembershipOrgs({ page, limit: 24 });

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ label: 'Memberships' }]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-body text-h1 text-ink mb-2">Memberships</h1>
        <p className="text-zinc text-body max-w-2xl">
          Discover which Milwaukee memberships give you the most event perks.
          Free admission, member pricing, early access, and more.
        </p>
      </div>

      {/* Org grid */}
      {orgs.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-zinc/40 mx-auto mb-4" />
          <h2 className="font-body text-h3 text-ink mb-2">
            No memberships yet
          </h2>
          <p className="text-zinc">
            Check back soon as we add membership organizations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/membership/${org.slug}`}
              className="group p-5 rounded-xl bg-pure border border-mist hover:shadow-card-lifted hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {org.logo_url ? (
                    <Image
                      src={org.logo_url}
                      alt={org.name}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink group-hover:text-blue transition-colors truncate">
                    {org.name}
                  </p>
                  {org.description && (
                    <p className="text-xs text-zinc line-clamp-1 mt-0.5">{org.description}</p>
                  )}
                </div>
              </div>
              {org.event_count > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <Ticket className="w-3.5 h-3.5" />
                  {org.event_count} {org.event_count === 1 ? 'event' : 'events'} with member benefits
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 24 && (
        <div className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/memberships?page=${page - 1}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-zinc">
            Page {page} of {Math.ceil(total / 24)}
          </span>
          {page * 24 < total && (
            <Link
              href={`/memberships?page=${page + 1}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </Container>
  );
}
