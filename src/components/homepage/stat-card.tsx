/**
 * STAT CARD
 * =========
 * Color-block stat display. Giant number + short label.
 * Typography IS the design. No image.
 *
 * Two-tone variant: number in one color, label in another.
 * Inspo: AIHub "95.5+", Trigger split-color cards
 */

import Link from 'next/link';

interface StatCardProps {
  number: string | number;
  label: string;
  href?: string;
  /** Top color (number area) */
  colorTop?: string;
  /** Bottom color (label area). If not set, uses colorTop */
  colorBottom?: string;
  className?: string;
}

export function StatCard({
  number,
  label,
  href,
  colorTop = '#008bd2',
  colorBottom,
  className = '',
}: StatCardProps) {
  const isTwoTone = colorBottom && colorBottom !== colorTop;

  const content = (
    <div
      className={`rounded-lg overflow-hidden h-full flex flex-col ${className}`}
      style={!isTwoTone ? { backgroundColor: colorTop } : undefined}
    >
      {isTwoTone ? (
        <>
          <div className="flex-1 flex items-end justify-center px-5 pt-6 pb-2" style={{ backgroundColor: colorTop }}>
            <span className="text-stat text-pure font-extrabold tabular-nums">
              {number}
            </span>
          </div>
          <div className="px-5 pt-2 pb-5 text-center" style={{ backgroundColor: colorBottom }}>
            <span className="text-body-sm text-pure/90 font-medium">{label}</span>
            {href && (
              <span className="block mt-2 text-caption text-pure/70 font-semibold hover:text-pure transition-colors">
                Browse →
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center">
          <span className="text-stat text-pure font-extrabold tabular-nums">
            {number}
          </span>
          <span className="text-body-sm text-pure/80 font-medium mt-1">{label}</span>
          {href && (
            <span className="mt-3 text-caption text-pure/70 font-semibold hover:text-pure transition-colors">
              Browse →
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
