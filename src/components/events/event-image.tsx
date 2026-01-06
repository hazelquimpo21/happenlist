/**
 * EVENT IMAGE COMPONENT
 * =====================
 * 🖼️ A smart image component for event cards that:
 *    - Uses Next.js Image for optimization (lazy loading, WebP, responsive)
 *    - Shows a beautiful gradient placeholder while loading
 *    - Falls back to a letter placeholder if no valid image URL
 *    - Validates image URLs to avoid broken images
 *
 * WHY THIS EXISTS:
 *   Scraped event data sometimes contains page URLs instead of image URLs.
 *   This component safely handles those cases with graceful fallbacks.
 *
 * USAGE:
 *   <EventImage
 *     src={event.image_url}
 *     fallbackSrc={event.thumbnail_url}
 *     alt={event.title}
 *     fallbackLetter={event.title[0]}
 *   />
 */

'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getBestImageUrl } from '@/lib/utils/image';

// =============================================================================
// 📋 TYPES
// =============================================================================

interface EventImageProps {
  /** Primary image URL (usually image_url or thumbnail_url) */
  src?: string | null;
  /** Fallback image URL if primary fails */
  fallbackSrc?: string | null;
  /** Alt text for accessibility */
  alt: string;
  /** Letter to show if no valid image (usually first letter of title) */
  fallbackLetter?: string;
  /** Aspect ratio class (e.g., 'aspect-video', 'aspect-[4/3]') */
  aspectRatio?: string;
  /** Fill the parent container */
  fill?: boolean;
  /** Image priority for LCP optimization */
  priority?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Container CSS classes */
  containerClassName?: string;
}

// =============================================================================
// 🎨 GRADIENT BACKGROUNDS
// =============================================================================

/**
 * Beautiful gradient backgrounds for placeholders.
 * We cycle through these based on the first letter for visual variety.
 */
const PLACEHOLDER_GRADIENTS = [
  'from-coral/20 to-sand/40',        // Warm coral
  'from-sage/20 to-sand/40',         // Fresh sage
  'from-stone/10 to-sand/30',        // Neutral stone
  'from-blue-100 to-sand/40',        // Calm blue
  'from-purple-100 to-sand/40',      // Creative purple
  'from-amber-100 to-sand/40',       // Energetic amber
  'from-rose-100 to-sand/40',        // Playful rose
  'from-emerald-100 to-sand/40',     // Natural emerald
];

/**
 * Get a consistent gradient based on the first letter.
 * Same letter = same gradient (for visual consistency).
 */
function getGradientForLetter(letter: string): string {
  const index = letter.toUpperCase().charCodeAt(0) % PLACEHOLDER_GRADIENTS.length;
  return PLACEHOLDER_GRADIENTS[index];
}

// =============================================================================
// 🖼️ EVENT IMAGE COMPONENT
// =============================================================================

function EventImageComponent({
  src,
  fallbackSrc,
  alt,
  fallbackLetter = '?',
  aspectRatio = 'aspect-video',
  fill = true,
  priority = false,
  className,
  containerClassName,
}: EventImageProps) {
  // -------------------------------------------------------------------------
  // 🎯 STATE: Track loading and error states
  // -------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(() => {
    // Start with the best valid image URL
    return getBestImageUrl(src, fallbackSrc);
  });

  // -------------------------------------------------------------------------
  // 🔄 HANDLERS: Image load and error events
  // -------------------------------------------------------------------------

  /**
   * Called when image successfully loads.
   * Fades in the image smoothly.
   */
  const handleLoad = () => {
    setIsLoading(false);
  };

  /**
   * Called when image fails to load.
   * Tries fallback, or shows placeholder.
   */
  const handleError = () => {
    console.warn(`⚠️ [EventImage] Failed to load: ${currentSrc}`);

    // If we have a fallback and haven't tried it yet, try it
    if (currentSrc === src && fallbackSrc && fallbackSrc !== src) {
      const validFallback = getBestImageUrl(fallbackSrc);
      if (validFallback) {
        console.log(`🔄 [EventImage] Trying fallback: ${validFallback}`);
        setCurrentSrc(validFallback);
        return;
      }
    }

    // No valid images - show placeholder
    setHasError(true);
    setIsLoading(false);
  };

  // -------------------------------------------------------------------------
  // 🎨 RENDER: Letter Placeholder
  // -------------------------------------------------------------------------

  /**
   * Beautiful placeholder with gradient background and centered letter.
   * Used when no valid image is available or image fails to load.
   */
  const renderPlaceholder = () => {
    const letter = fallbackLetter?.charAt(0).toUpperCase() || '?';
    const gradient = getGradientForLetter(letter);

    return (
      <div
        className={cn(
          'w-full h-full flex items-center justify-center',
          'bg-gradient-to-br',
          gradient,
          containerClassName
        )}
        aria-label={`Placeholder for ${alt}`}
      >
        <span className="text-stone/50 text-4xl md:text-5xl font-display font-semibold select-none">
          {letter}
        </span>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // 🎨 RENDER: Main Component
  // -------------------------------------------------------------------------

  // Show placeholder if no valid image or error occurred
  if (!currentSrc || hasError) {
    return (
      <div className={cn('relative overflow-hidden', aspectRatio, containerClassName)}>
        {renderPlaceholder()}
      </div>
    );
  }

  // Show image with loading state
  return (
    <div className={cn('relative overflow-hidden', aspectRatio, containerClassName)}>
      {/* 🎭 Loading placeholder - shown while image loads */}
      {isLoading && (
        <div className="absolute inset-0 z-10">
          {renderPlaceholder()}
          {/* Shimmer animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}

      {/* 🖼️ Actual image */}
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// =============================================================================
// 📤 EXPORTS
// =============================================================================

/**
 * Memoized EventImage component.
 * Prevents unnecessary re-renders when parent updates.
 *
 * 💡 PERFORMANCE TIP:
 *    This component only re-renders when its props change.
 *    In a grid of 24 events, this prevents 23 unnecessary re-renders
 *    when one event's data updates.
 */
export const EventImage = memo(EventImageComponent);
EventImage.displayName = 'EventImage';
