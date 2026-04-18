/**
 * <SeriesDetailsAccordion> — collapsible "more details" about the parent series.
 *
 * Most visitors don't need this. It was a tall bordered grid in the old
 * design, taking up prime vertical real estate. Now a native <details>
 * accordion that's collapsed by default.
 *
 * Fields come from the series row (not the event). Each field hides if null.
 * Hides the whole accordion if nothing would render inside.
 */

import { SectionLabel } from '@/components/ui';
import {
  formatAgeRange,
  formatTimeDisplay,
  getSeriesTypeInfo,
  getAttendanceModeLabel,
  getSkillLevelLabel,
} from '@/types';

interface SeriesInfo {
  series_type: string;
  skill_level?: string | null;
  attendance_mode?: string | null;
  per_session_price?: number | null;
  materials_fee?: number | null;
  pricing_notes?: string | null;
  age_low?: number | null;
  age_high?: number | null;
  age_details?: string | null;
  days_of_week?: number[] | null;
  core_start_time?: string | null;
  core_end_time?: string | null;
  total_sessions?: number | null;
  sessions_remaining?: number | null;
  extended_care_details?: string | null;
  extended_start_time?: string | null;
  extended_end_time?: string | null;
}

interface Props {
  seriesInfo: SeriesInfo;
}

function hasAnyDetails(s: SeriesInfo): boolean {
  return !!(
    s.skill_level ||
    s.per_session_price != null ||
    s.materials_fee != null ||
    s.pricing_notes ||
    s.age_details ||
    s.extended_care_details ||
    (s.days_of_week && s.days_of_week.length > 0) ||
    (s.age_low != null && s.age_high != null) ||
    s.total_sessions
  );
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel size="xs" className="mb-1">
        {label}
      </SectionLabel>
      {children}
    </div>
  );
}

export function SeriesDetailsAccordion({ seriesInfo }: Props) {
  if (!hasAnyDetails(seriesInfo)) return null;

  return (
    <details className="group border-t-2 border-ink pt-5">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
        <span className="font-extrabold text-lg text-ink">
          {getSeriesTypeInfo(seriesInfo.series_type).label} details
        </span>
        <span className="font-mono text-xs font-bold tracking-widest uppercase text-zinc group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {seriesInfo.skill_level && (
          <Field label="Skill level">
            <p className="text-ink">{getSkillLevelLabel(seriesInfo.skill_level)}</p>
          </Field>
        )}
        {seriesInfo.attendance_mode && (
          <Field label="Attendance">
            <p className="text-ink">{getAttendanceModeLabel(seriesInfo.attendance_mode)}</p>
          </Field>
        )}
        {seriesInfo.per_session_price != null && (
          <Field label="Drop-in price">
            <p className="text-ink">${seriesInfo.per_session_price} per session</p>
          </Field>
        )}
        {seriesInfo.materials_fee != null && (
          <Field label="Materials fee">
            <p className="text-ink">${seriesInfo.materials_fee}</p>
          </Field>
        )}
        {seriesInfo.pricing_notes && (
          <div className="sm:col-span-2">
            <Field label="Pricing notes">
              <p className="text-ink">{seriesInfo.pricing_notes}</p>
            </Field>
          </div>
        )}
        {(seriesInfo.age_low != null || seriesInfo.age_high != null) && (
          <Field label="Age range">
            <p className="text-ink">{formatAgeRange(seriesInfo.age_low, seriesInfo.age_high)}</p>
            {seriesInfo.age_details && (
              <p className="text-zinc text-xs mt-0.5">{seriesInfo.age_details}</p>
            )}
          </Field>
        )}
        {seriesInfo.days_of_week && seriesInfo.days_of_week.length > 0 && (
          <Field label="Schedule">
            <p className="text-ink">
              {seriesInfo.days_of_week.map((d) => DAY_ABBR[d]).join(', ')}
              {seriesInfo.core_start_time && seriesInfo.core_end_time && (
                <span className="text-zinc">
                  {' · '}
                  {formatTimeDisplay(seriesInfo.core_start_time)} –{' '}
                  {formatTimeDisplay(seriesInfo.core_end_time)}
                </span>
              )}
            </p>
          </Field>
        )}
        {seriesInfo.total_sessions && (
          <Field label="Sessions">
            <p className="text-ink">
              {seriesInfo.total_sessions} total
              {seriesInfo.sessions_remaining != null &&
                seriesInfo.sessions_remaining < seriesInfo.total_sessions && (
                  <span className="text-zinc">
                    {' · '}
                    {seriesInfo.sessions_remaining} remaining
                  </span>
                )}
            </p>
          </Field>
        )}
        {seriesInfo.extended_care_details && (
          <div className="sm:col-span-2">
            <Field label="Extended care">
              <p className="text-ink">{seriesInfo.extended_care_details}</p>
              {seriesInfo.extended_start_time && seriesInfo.extended_end_time && (
                <p className="text-zinc text-xs mt-0.5">
                  {formatTimeDisplay(seriesInfo.extended_start_time)} –{' '}
                  {formatTimeDisplay(seriesInfo.extended_end_time)}
                </p>
              )}
            </Field>
          </div>
        )}
      </div>
    </details>
  );
}
