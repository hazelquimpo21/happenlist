/**
 * =============================================================================
 * /admin/signals-calibration — agreement-rate dashboard
 * =============================================================================
 *
 * Tagging-expansion Stage 4 follow-up. Reads aggregated stats from
 * signal_reviews (admin SignalsReviewPanel writes there) and shows:
 *
 *   - Per-dimension agreement rate (looks_right / total) — the AI agreement
 *     metric, sorted lowest-first so dimensions needing prompt iteration
 *     bubble to the top.
 *   - Per-reviewer activity counts.
 *   - Recent-activity feed with deep links to the events.
 *
 * Used to decide whether the four sliders are calibrated enough to expose
 * publicly (Stage 4 ships them admin-only). The Public Slider Filter ship
 * happens AFTER agreement rates settle ≥75% across all four sliders on a
 * meaningful sample.
 *
 * Auth: standard admin (not superadmin). Looks-right/Flag clicks come from
 * any admin, so any admin should be able to see the rollup.
 *
 * Cross-file coupling:
 *   - src/data/admin/get-signals-calibration.ts — data fetch + helpers
 *   - src/data/admin/signal-reviews.ts — write side (the data this aggregates)
 *   - src/components/superadmin/signals-review-panel.tsx — where rows come from
 * =============================================================================
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatMKEPattern } from '@/lib/utils/dates';
import { Activity, BarChart3, Users, AlertTriangle } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { Card } from '@/components/ui/card';
import { getSession, isAdmin } from '@/lib/auth';
import {
  getSignalsCalibration,
  agreementBand,
  type DimensionStats,
  type ReviewerStats,
  type CalibrationActivityRow,
} from '@/data/admin';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Signals Calibration' };
export const dynamic = 'force-dynamic';

const TONE_CLASSES: Record<'green' | 'amber' | 'red' | 'gray', string> = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-stone-100 text-stone-700',
};

const DIMENSION_LABELS: Record<string, string> = {
  accessibility: 'Accessibility tags',
  sensory: 'Sensory tags',
  leave_with: 'Leave-with tags',
  social_mode: 'Social mode',
  energy_needed: 'Energy needed',
  social_intensity: 'Slider · Social intensity',
  structure: 'Slider · Structure',
  commitment: 'Slider · Commitment',
  spend_level: 'Slider · Spend level',
};

export default async function SignalsCalibrationPage() {
  const { session } = await getSession();
  if (!session) {
    redirect('/auth/login?redirect=/admin/signals-calibration');
  }
  if (!isAdmin(session.email)) {
    redirect('/admin');
  }

  const data = await getSignalsCalibration();
  const flaggedDimensionCount = data.perDimension.filter(
    (d) => d.total > 0 && (d.agreementRate ?? 1) < 0.5,
  ).length;

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Signals Calibration"
        description="Agreement rates per signal dimension. Use this to decide which dimensions are calibrated enough to expose publicly."
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <AdminBreadcrumbs items={[{ label: 'Signals Calibration' }]} />

        {/* ── Top stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-blue" />}
            label="Total reviews"
            value={data.totalReviews}
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-emerald" />}
            label="Events reviewed"
            value={data.uniqueEvents}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-purple-600" />}
            label="Reviewers"
            value={data.uniqueReviewers}
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            label="Dims < 50% agreement"
            value={flaggedDimensionCount}
            tone={flaggedDimensionCount > 0 ? 'warn' : 'ok'}
          />
        </div>

        {/* ── Per-dimension table ─────────────────────────────────── */}
        <Card padding="lg" className="border border-mist">
          <h2 className="text-base font-semibold text-ink mb-1">
            Per-dimension agreement
          </h2>
          <p className="text-xs text-zinc mb-4">
            Agreement = looks-right ÷ total. Sorted lowest-first so
            dimensions needing prompt iteration bubble up. Sliders are
            admin-only until agreement settles ≥ 75% across all four.
          </p>

          {data.perDimension.length === 0 ? (
            <p className="text-sm text-zinc/70 italic">
              No reviews yet. Open an admin event page and use the Signals
              Review panel to start populating data.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-zinc uppercase tracking-wide border-b border-mist">
                    <th className="py-2 pr-4">Dimension</th>
                    <th className="py-2 px-2 text-right">Agreement</th>
                    <th className="py-2 px-2 text-right">Looks right</th>
                    <th className="py-2 px-2 text-right">Flagged</th>
                    <th className="py-2 px-2 text-right">Overrides</th>
                    <th className="py-2 pl-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perDimension.map((stats) => (
                    <DimensionRow key={stats.dimension} stats={stats} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Per-reviewer table ──────────────────────────────────── */}
        {data.perReviewer.length > 0 && (
          <Card padding="lg" className="border border-mist">
            <h2 className="text-base font-semibold text-ink mb-4">Top reviewers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-zinc uppercase tracking-wide border-b border-mist">
                    <th className="py-2 pr-4">Reviewer</th>
                    <th className="py-2 px-2 text-right">Total</th>
                    <th className="py-2 px-2 text-right">Looks right</th>
                    <th className="py-2 px-2 text-right">Flagged</th>
                    <th className="py-2 pl-2 text-right">Overrides</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perReviewer.map((r) => (
                    <ReviewerRow key={r.reviewer} stats={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Recent activity ─────────────────────────────────────── */}
        {data.recentActivity.length > 0 && (
          <Card padding="lg" className="border border-mist">
            <h2 className="text-base font-semibold text-ink mb-4">Recent activity</h2>
            <ul className="divide-y divide-mist">
              {data.recentActivity.map((row) => (
                <ActivityRow key={row.id} row={row} />
              ))}
            </ul>
          </Card>
        )}

        <p className="text-[11px] text-zinc/70">
          Generated {formatMKEPattern(data.generatedAt, 'MMM d, yyyy h:mm a')}
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SUBCOMPONENTS
// -----------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  tone = 'ok',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: 'ok' | 'warn';
}) {
  return (
    <Card padding="md" className={cn('border border-mist', tone === 'warn' && value > 0 && 'border-red-200 bg-red-50/30')}>
      <div className="flex items-center gap-2 text-xs font-medium text-zinc">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value.toLocaleString()}</p>
    </Card>
  );
}

function DimensionRow({ stats }: { stats: DimensionStats }) {
  const band = agreementBand(stats.agreementRate);
  const label = DIMENSION_LABELS[stats.dimension] ?? stats.dimension;
  return (
    <tr className="border-b border-mist last:border-b-0">
      <td className="py-2 pr-4 text-ink">{label}</td>
      <td className="py-2 px-2 text-right">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
            TONE_CLASSES[band.tone],
          )}
        >
          {band.label}
        </span>
      </td>
      <td className="py-2 px-2 text-right text-emerald-700">{stats.looksRight}</td>
      <td className="py-2 px-2 text-right text-amber-700">{stats.flagged}</td>
      <td className="py-2 px-2 text-right text-blue-700">{stats.overrides}</td>
      <td className="py-2 pl-2 text-right text-zinc font-medium">{stats.total}</td>
    </tr>
  );
}

function ReviewerRow({ stats }: { stats: ReviewerStats }) {
  return (
    <tr className="border-b border-mist last:border-b-0">
      <td className="py-2 pr-4 text-ink font-mono text-xs">{stats.reviewer}</td>
      <td className="py-2 px-2 text-right text-zinc font-semibold">{stats.total}</td>
      <td className="py-2 px-2 text-right text-emerald-700">{stats.looksRight}</td>
      <td className="py-2 px-2 text-right text-amber-700">{stats.flagged}</td>
      <td className="py-2 pl-2 text-right text-blue-700">{stats.overrides}</td>
    </tr>
  );
}

function ActivityRow({ row }: { row: CalibrationActivityRow }) {
  const verdictColor: Record<string, string> = {
    looks_right: 'text-emerald-700',
    flagged: 'text-amber-700',
    override: 'text-blue-700',
  };
  const verdictLabel: Record<string, string> = {
    looks_right: '✓ Looks right',
    flagged: '⚑ Flagged',
    override: '✎ Override',
  };
  return (
    <li className="py-2.5 flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-ink truncate">
          <span className="font-mono text-xs text-zinc">{row.reviewer}</span>{' '}
          <span className={cn('font-medium', verdictColor[row.verdict] ?? 'text-zinc')}>
            {verdictLabel[row.verdict] ?? row.verdict}
          </span>{' '}
          on <span className="text-zinc">{DIMENSION_LABELS[row.dimension] ?? row.dimension}</span>{' '}
          for{' '}
          {row.event_slug && row.event_title ? (
            <Link
              href={`/admin/events/${row.event_id}`}
              className="text-blue hover:underline"
            >
              {row.event_title}
            </Link>
          ) : (
            <span className="text-zinc font-mono text-xs">{row.event_id.slice(0, 8)}…</span>
          )}
        </p>
        {row.note && <p className="text-xs text-zinc mt-0.5 truncate">{row.note}</p>}
      </div>
      <p className="text-[11px] text-zinc/70 flex-shrink-0">
        {formatMKEPattern(row.reviewed_at, 'MMM d, h:mm a')}
      </p>
    </li>
  );
}
