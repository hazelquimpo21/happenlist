/**
 * MiniCalendar
 * =============
 * Horizontally-scrollable run of small month grids, with each instance date
 * shown as a colored dot. Used for:
 *
 *   - Recurrence preview ("here's what 'every Saturday' will produce")
 *   - Regenerate-dates diff (keep / add / drop visualization)
 *
 * Dates outside the rendered month range scroll the grid right. The
 * component intentionally renders just enough months to cover the date
 * span; max 12.
 *
 * @module components/admin/form-shell/mini-calendar
 */
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export type MiniCalendarStatus = 'keep' | 'add' | 'drop' | 'plain';

export interface MiniCalendarMark {
  /** YYYY-MM-DD. Treated as a local date (timezone-agnostic). */
  date: string;
  status?: MiniCalendarStatus;
  label?: string;
}

interface Props {
  marks: MiniCalendarMark[];
  /** Override the start month. Defaults to the earliest date in marks. */
  startMonth?: Date;
  /** Override the end month. Defaults to the latest date in marks. */
  endMonth?: Date;
  /** Max months to render (cap to prevent runaway grids). Default 6. */
  maxMonths?: number;
  className?: string;
}

const STATUS_DOT: Record<MiniCalendarStatus, string> = {
  keep: 'bg-emerald',
  add: 'bg-blue animate-pulse',
  drop: 'bg-zinc/40 line-through',
  plain: 'bg-blue',
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MiniCalendar({
  marks,
  startMonth,
  endMonth,
  maxMonths = 6,
  className,
}: Props) {
  const months = useMemo(() => {
    if (marks.length === 0) return [];
    const sorted = [...marks].sort((a, b) => a.date.localeCompare(b.date));
    const first = startMonth ?? parseLocalDate(sorted[0].date);
    const last = endMonth ?? parseLocalDate(sorted[sorted.length - 1].date);
    const out: Date[] = [];
    let cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    while (
      out.length < maxMonths &&
      (cursor.getFullYear() < last.getFullYear() ||
        (cursor.getFullYear() === last.getFullYear() && cursor.getMonth() <= last.getMonth()))
    ) {
      out.push(new Date(cursor));
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return out;
  }, [marks, startMonth, endMonth, maxMonths]);

  const markByDate = useMemo(() => {
    const map = new Map<string, MiniCalendarMark>();
    for (const m of marks) map.set(m.date, m);
    return map;
  }, [marks]);

  if (months.length === 0) {
    return (
      <p className={cn('text-xs text-zinc italic', className)}>
        No dates to preview.
      </p>
    );
  }

  return (
    <div className={cn('flex gap-3 overflow-x-auto pb-1', className)}>
      {months.map((m) => (
        <MonthGrid key={`${m.getFullYear()}-${m.getMonth()}`} month={m} markByDate={markByDate} />
      ))}
    </div>
  );
}

interface MonthGridProps {
  month: Date;
  markByDate: Map<string, MiniCalendarMark>;
}

function MonthGrid({ month, markByDate }: MonthGridProps) {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="shrink-0 rounded-lg border border-mist bg-pure p-2.5">
      <div className="text-[11px] font-semibold text-zinc text-center mb-1.5">
        {monthLabel}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[9px] text-silver text-center mb-0.5">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={`wd-${i}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (day == null) return <span key={idx} className="w-5 h-5" />;
          const iso = `${year}-${pad(monthIdx + 1)}-${pad(day)}`;
          const mark = markByDate.get(iso);
          return (
            <div
              key={idx}
              title={mark?.label ?? iso}
              className={cn(
                'w-5 h-5 flex items-center justify-center text-[9px] rounded-full',
                mark
                  ? cn('text-pure font-medium', STATUS_DOT[mark.status ?? 'plain'])
                  : 'text-silver',
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
