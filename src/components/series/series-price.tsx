/**
 * SERIES PRICE COMPONENT
 * ======================
 * Displays series pricing information.
 * Handles various pricing models: free, fixed, range, per_session.
 */

import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PriceData {
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
}

interface SeriesPriceProps {
  /** Series data with price fields */
  series: PriceData;
  /** Display size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a number as currency (USD).
 */
function formatCurrency(amount: number): string {
  // Remove cents if whole number
  if (amount === Math.floor(amount)) {
    return `$${amount}`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Generate the price display text based on pricing model.
 */
function formatSeriesPrice(data: PriceData): string {
  // Free events
  if (data.is_free || data.price_type === 'free') {
    return 'Free';
  }

  // Per session pricing (show per-session rate)
  if (data.price_type === 'per_session') {
    if (data.price_low) {
      return `${formatCurrency(data.price_low)}/session`;
    }
    return 'Per session';
  }

  // Fixed price
  if (data.price_type === 'fixed' && data.price_low) {
    return formatCurrency(data.price_low);
  }

  // Price range
  if (data.price_type === 'range' && data.price_low && data.price_high) {
    return `${formatCurrency(data.price_low)} – ${formatCurrency(data.price_high)}`;
  }

  // Variable pricing
  if (data.price_type === 'varies') {
    return 'Prices vary';
  }

  // Donation
  if (data.price_type === 'donation') {
    return 'Pay what you can';
  }

  // Fallback: show low price if available
  if (data.price_low) {
    return `From ${formatCurrency(data.price_low)}`;
  }

  // No price info available
  return '';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Displays series pricing with appropriate styling.
 *
 * @example
 * ```tsx
 * <SeriesPrice series={series} />
 * <SeriesPrice series={series} size="lg" />
 * ```
 */
export function SeriesPrice({ series, size = 'md', className }: SeriesPriceProps) {
  const priceText = formatSeriesPrice(series);

  if (!priceText) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-body-sm',
    md: 'text-body',
    lg: 'text-h3',
  };

  // Free events get special styling
  const isFree = series.is_free || series.price_type === 'free';

  return (
    <p
      className={cn(
        sizeClasses[size],
        isFree ? 'text-sage font-medium' : 'text-charcoal font-semibold',
        className
      )}
    >
      {priceText}
    </p>
  );
}

// ============================================================================
// UTILITY EXPORT
// ============================================================================

/**
 * Format series price to string (for use outside component).
 */
export { formatSeriesPrice };
