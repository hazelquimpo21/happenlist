/**
 * <GettingIn> — access + attendance + membership info, stamped-row style.
 *
 * Replaces the old bordered "How to Attend" box. Uses:
 *   - <AccessBadge> for access_type display
 *   - getAttendanceModeEventDescription() for the warmer event-focused copy
 *     (single source of truth, lives in src/types/series.ts)
 *   - membership_details passed through verbatim when required
 */

import { DoorOpen, Shield, Users } from 'lucide-react';
import { AccessBadge } from '@/components/events';
import { SectionLabel } from '@/components/ui';
import { getAttendanceModeEventDescription } from '@/types';

interface GettingInProps {
  accessType?: string | null;
  attendanceMode?: string | null;
  hasTicketUrl: boolean;
  membershipRequired?: boolean | null;
  membershipDetails?: string | null;
  isFree?: boolean | null;
  accentColor: string;
}

export function GettingIn({
  accessType,
  attendanceMode,
  hasTicketUrl,
  membershipRequired,
  membershipDetails,
  isFree,
  accentColor,
}: GettingInProps) {
  if (!accessType && !attendanceMode && !membershipRequired) return null;

  const attendanceCopy = getAttendanceModeEventDescription(attendanceMode);

  return (
    <section>
      <SectionLabel icon={DoorOpen} color={accentColor} className="mb-4">
        Getting in
      </SectionLabel>
      <ul className="space-y-3">
        {accessType && (
          <li className="flex items-start gap-3">
            <Shield className="w-4 h-4 mt-0.5 text-zinc flex-shrink-0" aria-hidden="true" />
            <div>
              <AccessBadge accessType={accessType} isFree={isFree ?? undefined} />
              {accessType === 'ticketed' && hasTicketUrl && (
                <p className="text-xs text-zinc mt-1">Tickets available online</p>
              )}
            </div>
          </li>
        )}
        {attendanceCopy && (
          <li className="flex items-start gap-3">
            <Users className="w-4 h-4 mt-0.5 text-zinc flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-ink">{attendanceCopy}</p>
          </li>
        )}
        {membershipRequired && membershipDetails && (
          <li className="flex items-start gap-3">
            <Shield className="w-4 h-4 mt-0.5 text-zinc flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-ink">{membershipDetails}</p>
          </li>
        )}
      </ul>
    </section>
  );
}
