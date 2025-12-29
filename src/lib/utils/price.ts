/**
 * PRICE UTILITIES
 * ===============
 * Formatting functions for event pricing.
 */

/**
 * Price data required for formatting.
 */
interface PriceData {
  price_type: string;
  price_low: number | null;
  price_high: number | null;
  is_free: boolean;
}

/**
 * Formats event price for display.
 *
 * @example
 * formatPrice({ price_type: 'free', is_free: true, ... })
 * // => 'Free'
 *
 * formatPrice({ price_type: 'fixed', price_low: 25, ... })
 * // => '$25'
 *
 * formatPrice({ price_type: 'range', price_low: 15, price_high: 45, ... })
 * // => '$15 - $45'
 */
export function formatPrice(data: PriceData): string {
  // Check is_free flag first
  if (data.is_free) {
    return 'Free';
  }

  // Handle by price type
  switch (data.price_type) {
    case 'free':
      return 'Free';

    case 'fixed':
      return data.price_low ? `$${formatNumber(data.price_low)}` : 'Free';

    case 'range':
      if (data.price_low && data.price_high) {
        return `$${formatNumber(data.price_low)} - $${formatNumber(data.price_high)}`;
      }
      if (data.price_low) {
        return `From $${formatNumber(data.price_low)}`;
      }
      return 'Prices vary';

    case 'varies':
      return 'Prices vary';

    case 'donation':
      return 'Pay what you can';

    default:
      // Fallback: show price_low if available
      return data.price_low ? `$${formatNumber(data.price_low)}` : '';
  }
}

/**
 * Formats a number, removing unnecessary decimals.
 */
function formatNumber(num: number): string {
  // If it's a whole number, don't show decimals
  if (num === Math.floor(num)) {
    return num.toString();
  }
  // Otherwise show 2 decimal places
  return num.toFixed(2);
}

/**
 * Checks if an event is free.
 */
export function isFreeEvent(data: PriceData): boolean {
  return data.is_free || data.price_type === 'free';
}

/**
 * Gets the CSS class for price display.
 */
export function getPriceClassName(data: PriceData): string {
  if (isFreeEvent(data)) {
    return 'text-sage font-medium'; // Green for free events
  }
  return 'text-charcoal';
}
