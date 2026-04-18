/**
 * <MemberBenefits> — linked membership orgs with per-event benefits.
 *
 * Restyled minimal — the old amber bordered panel was loud. Now a simple
 * SectionLabel + a list of rows with org logo + benefit chip.
 */

import Image from 'next/image';
import Link from 'next/link';
import { CreditCard, Shield } from 'lucide-react';
import { SectionLabel } from '@/components/ui';
import { getBenefitConfig } from '@/types';

interface Benefit {
  id: string;
  benefit_type: string;
  benefit_details?: string | null;
  member_price?: number | null;
  membership_organization: {
    name: string;
    slug: string;
    logo_url?: string | null;
  };
}

interface MemberBenefitsProps {
  benefits: Benefit[];
}

export function MemberBenefits({ benefits }: MemberBenefitsProps) {
  if (benefits.length === 0) return null;

  return (
    <section>
      <SectionLabel icon={CreditCard} className="mb-4">
        Member benefits
      </SectionLabel>
      <ul className="space-y-3">
        {benefits.map((emb) => {
          const config = getBenefitConfig(emb.benefit_type);
          return (
            <li key={emb.id} className="flex items-start gap-3 p-3 border border-mist">
              <Link href={`/membership/${emb.membership_organization.slug}`} className="flex-shrink-0">
                {emb.membership_organization.logo_url ? (
                  <Image
                    src={emb.membership_organization.logo_url}
                    alt={emb.membership_organization.name}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-cloud flex items-center justify-center">
                    <Shield className="w-5 h-5 text-zinc" />
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/membership/${emb.membership_organization.slug}`}
                    className="font-bold text-ink hover:text-blue transition-colors text-sm"
                  >
                    {emb.membership_organization.name}
                  </Link>
                  <span
                    className={`font-mono text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}
                  >
                    {emb.benefit_type === 'member_price' && emb.member_price
                      ? `$${emb.member_price} member price`
                      : config.label}
                  </span>
                </div>
                {emb.benefit_details && (
                  <p className="text-xs text-zinc mt-1">{emb.benefit_details}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
