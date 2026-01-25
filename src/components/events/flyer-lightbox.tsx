/**
 * FLYER LIGHTBOX COMPONENT
 * ========================
 * Displays event flyer thumbnail that opens in a fullscreen lightbox.
 * Uses Radix Dialog for accessible modal behavior.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Maximize2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlyerLightboxProps {
  /** URL of the flyer image */
  flyerUrl: string;
  /** Alt text for the image */
  alt: string;
  /** Event title for download filename */
  eventTitle?: string;
  /** Additional CSS classes for the thumbnail */
  className?: string;
}

/**
 * Displays a flyer thumbnail that opens in a lightbox when clicked.
 *
 * @example
 * <FlyerLightbox 
 *   flyerUrl={event.flyer_url} 
 *   alt={`${event.title} flyer`}
 *   eventTitle={event.title}
 * />
 */
export function FlyerLightbox({
  flyerUrl,
  alt,
  eventTitle,
  className,
}: FlyerLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Thumbnail trigger */}
      <Dialog.Trigger asChild>
        <button
          className={cn(
            'group relative overflow-hidden rounded-lg border-2 border-sand',
            'hover:border-coral transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2',
            className
          )}
          aria-label="View full flyer"
        >
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={flyerUrl}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors flex items-center justify-center">
              <Maximize2 
                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" 
              />
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-charcoal/80 to-transparent p-2">
            <span className="text-white text-body-sm font-medium">
              View Flyer
            </span>
          </div>
        </button>
      </Dialog.Trigger>

      {/* Lightbox modal */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal/90 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-charcoal/50 hover:bg-charcoal/70 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </Dialog.Close>

          {/* Download button */}
          {eventTitle && (
            <a
              href={flyerUrl}
              download={`${eventTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-flyer`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-16 z-10 p-2 rounded-full bg-charcoal/50 hover:bg-charcoal/70 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Download flyer"
            >
              <Download className="w-6 h-6" />
            </a>
          )}

          {/* Full-size image */}
          <div className="relative w-full h-full max-w-4xl max-h-full">
            <Image
              src={flyerUrl}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Title at bottom */}
          <Dialog.Title className="sr-only">
            {alt}
          </Dialog.Title>
          
          <Dialog.Description className="absolute bottom-4 left-4 right-4 text-center text-white text-body-sm opacity-70">
            Click outside or press ESC to close
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}





