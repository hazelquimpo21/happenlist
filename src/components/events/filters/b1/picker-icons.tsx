/**
 * B1 PICKER ICONS
 * ===============
 * The 5 line-style icons used inside the B1 segmented picker + its popovers.
 * Spec: 14px leading glyph per segment (tag, clock, sparkles, wallet),
 * 16px magnifying-glass inside the blue CTA button.
 *
 * We avoid lucide-react here so the picker stays visually consistent with
 * the rest of the Happenlist icon set (1.8px stroke, rounded caps, 24×24 vb,
 * currentColor). Size via the `size` prop; stroke width inherits from the
 * defaults.
 */

import { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base: Omit<SVGProps<SVGSVGElement>, 'children'> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function withSize(size: number | undefined, props: SVGProps<SVGSVGElement>) {
  const s = size ?? 14;
  return { ...base, width: s, height: s, ...props };
}

/** Category segment — price tag */
export function IconTag({ size, ...rest }: IconProps) {
  return (
    <svg {...withSize(size, rest)}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

/** When segment — clock */
export function IconClock({ size, ...rest }: IconProps) {
  return (
    <svg {...withSize(size, rest)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

/** Good-for segment — sparkles */
export function IconSparkles({ size, ...rest }: IconProps) {
  return (
    <svg {...withSize(size, rest)}>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
      <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z" />
    </svg>
  );
}

/** Budget segment — wallet */
export function IconWallet({ size, ...rest }: IconProps) {
  return (
    <svg {...withSize(size, rest)}>
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M16 12h4" />
      <path d="M3 9h13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3" />
    </svg>
  );
}

/** CTA — magnifying glass */
export function IconSearch({ size, ...rest }: IconProps) {
  return (
    <svg {...withSize(size ?? 16, rest)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

/** Chevron used in compact More-button affordance */
export function IconChevronDown({ size, ...rest }: IconProps) {
  return (
    <svg {...withSize(size ?? 14, rest)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
