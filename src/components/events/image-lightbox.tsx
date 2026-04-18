/**
 * <ImageLightbox> — click-to-zoom wrapper for hero / card images.
 *
 * Thin client-only wrapper: takes `src`, `alt`, and `children` (the visible
 * trigger). Children keep their own styling — lightbox just adds tap-to-open
 * behavior and a fullscreen Radix Dialog with the full image.
 *
 * Escape or backdrop click closes. No download button (use FlyerLightbox for
 * flyers where download is relevant).
 *
 * Why a new component vs reusing FlyerLightbox?
 *   FlyerLightbox imposes its own thumbnail styling (aspect-[3/4] rounded-lg
 *   border-mist). This wrapper is unopinionated — any trigger shape works.
 *
 * Cross-file coupling:
 *   - src/components/events/poster-hero.tsx — wraps the hero image card
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  children: React.ReactNode;
  /** Aria label on the trigger button (default: "View full image") */
  label?: string;
}

export function ImageLightbox({
  src,
  alt,
  children,
  label = 'View full image',
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="block w-full text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-pure focus-visible:ring-offset-2"
        >
          {children}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/90 animate-fade-in" />
        <Dialog.Content
          className="fixed inset-0 z-[61] flex items-center justify-center p-4 md:p-10 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <div
            className="relative max-w-6xl w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1600}
              height={1600}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              priority
            />
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 md:top-6 md:right-6 bg-pure text-ink rounded-full p-2 shadow-lg hover:bg-cream transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
