/**
 * STEP 6: IMAGE
 * ===============
 * Sixth step of the event submission form.
 *
 * Options:
 *   - Upload image
 *   - Paste image URL
 *   - Skip (use default)
 *
 * @module components/submit/steps/step-6-image
 */

'use client';

import { useState } from 'react';
import { Image as ImageIcon, Link, Upload, X } from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input, Button } from '@/components/ui';
import type { EventDraftData } from '@/types/submission';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Step6Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step6Image({ draftData, updateData }: Step6Props) {
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // ========== Validate Image URL ==========
  const validateImageUrl = async (url: string) => {
    if (!url) {
      setImageError(null);
      return;
    }

    setIsValidating(true);
    setImageError(null);

    try {
      // Check if URL is valid
      new URL(url);

      // Try to load the image
      const img = new window.Image();
      img.onload = () => {
        setIsValidating(false);
        updateData({ image_url: url });
      };
      img.onerror = () => {
        setIsValidating(false);
        setImageError('Could not load image from this URL');
      };
      img.src = url;
    } catch {
      setIsValidating(false);
      setImageError('Please enter a valid URL');
    }
  };

  // ========== Clear Image ==========
  const clearImage = () => {
    updateData({ image_url: undefined, thumbnail_url: undefined });
    setImageError(null);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        step={6}
        title="Event Image"
        description="Add a photo to make your event stand out (optional)"
      />

      {/* ========== Image Mode Toggle ========== */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setImageMode('url')}
          className={cn(
            'flex items-center px-4 py-2 rounded-lg border transition-all',
            imageMode === 'url'
              ? 'border-coral bg-coral/10 text-coral'
              : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
          )}
        >
          <Link className="w-4 h-4 mr-2" />
          Image URL
        </button>
        <button
          type="button"
          onClick={() => setImageMode('upload')}
          className={cn(
            'flex items-center px-4 py-2 rounded-lg border transition-all',
            imageMode === 'upload'
              ? 'border-coral bg-coral/10 text-coral'
              : 'border-sand bg-warm-white text-charcoal hover:border-coral/50'
          )}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </button>
      </div>

      {/* ========== URL Input ========== */}
      {imageMode === 'url' && (
        <div>
          <label
            htmlFor="image_url"
            className="block text-sm font-medium text-charcoal mb-1"
          >
            Image URL
          </label>
          <Input
            id="image_url"
            type="url"
            value={draftData.image_url || ''}
            onChange={(e) => {
              const url = e.target.value;
              updateData({ image_url: url || undefined });
              if (url.length > 10) {
                validateImageUrl(url);
              }
            }}
            placeholder="https://example.com/event-image.jpg"
            className={imageError ? 'border-red-500' : ''}
          />
          {imageError && (
            <p className="text-sm text-red-600 mt-1">{imageError}</p>
          )}
          {isValidating && (
            <p className="text-sm text-stone mt-1">Validating image...</p>
          )}
          <p className="text-xs text-stone mt-1">
            Paste a direct link to your event image (from your website, social media, etc.)
          </p>
        </div>
      )}

      {/* ========== Upload (coming soon) ========== */}
      {imageMode === 'upload' && (
        <div className="p-8 border-2 border-dashed border-sand rounded-lg text-center bg-cream">
          <Upload className="w-10 h-10 text-stone mx-auto mb-3" />
          <p className="text-charcoal font-medium">Upload coming soon!</p>
          <p className="text-sm text-stone mt-1">
            For now, please use an image URL from your website or social media.
          </p>
        </div>
      )}

      {/* ========== Image Preview ========== */}
      {draftData.image_url && !imageError && (
        <div className="relative">
          <label className="block text-sm font-medium text-charcoal mb-2">
            Preview
          </label>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draftData.image_url}
              alt="Event preview"
              className="w-full h-full object-cover"
              onError={() => setImageError('Failed to load image')}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-charcoal/80 text-white rounded-full hover:bg-charcoal transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========== No Image Placeholder ========== */}
      {!draftData.image_url && (
        <div className="aspect-video rounded-lg bg-sand flex flex-col items-center justify-center">
          <ImageIcon className="w-12 h-12 text-stone mb-2" />
          <p className="text-stone font-medium">No image selected</p>
          <p className="text-sm text-stone/70">
            A default category image will be used
          </p>
        </div>
      )}

      {/* ========== Image Tips ========== */}
      <div className="p-4 bg-cream rounded-lg border border-sand">
        <h4 className="font-medium text-charcoal mb-2 flex items-center">
          <ImageIcon className="w-4 h-4 mr-2" />
          Image Tips
        </h4>
        <ul className="text-sm text-stone space-y-1">
          <li>• Use a landscape (horizontal) image for best results</li>
          <li>• Recommended size: 1200 x 630 pixels</li>
          <li>• High-quality photos of your event work best</li>
          <li>• Avoid text-heavy images (they scale poorly)</li>
        </ul>
      </div>
    </div>
  );
}
