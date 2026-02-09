/**
 * STEP 5: PRICING
 * =================
 * Fifth step of the event submission form.
 *
 * Collects:
 *   - Price type (free, fixed, range, varies, donation)
 *   - Price amount(s)
 *   - Ticket URL
 *   - Price details
 *
 * Phase D additions:
 *   - Per-session / drop-in price (for hybrid/drop-in attendance series)
 *   - Materials fee (optional, for classes/camps/workshops)
 *   - Pricing notes (early bird, discounts, sibling rates)
 *   - Series pricing fields stored on seriesDraftData
 *
 * @module components/submit/steps/step-5-pricing
 */

'use client';

import { Gift, DollarSign, Ticket, ExternalLink, Heart, Globe, Instagram, Facebook, ClipboardList, Package, FileText } from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import type { EventDraftData, PriceType, SeriesDraftData } from '@/types/submission';
import { PRICE_TYPE_LABELS } from '@/types/submission';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Step5Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
  /** Series draft data — needed for per-session pricing and materials fee */
  seriesDraftData?: SeriesDraftData | null;
  /** Update series draft data — for writing per-session pricing fields */
  updateSeriesData?: (data: SeriesDraftData | null) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step5Pricing({
  draftData,
  updateData,
  seriesDraftData,
  updateSeriesData,
}: Step5Props) {
  const isSeriesMode = draftData.event_mode === 'new_series';
  const attendanceMode = seriesDraftData?.attendance_mode;
  // Show per-session pricing when attendance is drop_in or hybrid
  const showPerSessionPrice = isSeriesMode && (attendanceMode === 'drop_in' || attendanceMode === 'hybrid');
  // Show materials fee for any new series
  const showMaterialsFee = isSeriesMode;
  // Show pricing notes for any new series
  const showPricingNotes = isSeriesMode;

  // Helper to merge series data updates
  const mergeSeriesData = (updates: Partial<SeriesDraftData>) => {
    if (!updateSeriesData || !seriesDraftData) return;
    updateSeriesData({
      ...seriesDraftData,
      ...updates,
    });
  };

  const priceOptions: { type: PriceType; icon: React.ReactNode; description: string }[] = [
    {
      type: 'free',
      icon: <Gift className="w-5 h-5" />,
      description: 'No cost to attend',
    },
    {
      type: 'fixed',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'One ticket price',
    },
    {
      type: 'range',
      icon: <Ticket className="w-5 h-5" />,
      description: 'Multiple price tiers',
    },
    {
      type: 'varies',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Check event page',
    },
    {
      type: 'donation',
      icon: <Heart className="w-5 h-5" />,
      description: 'Suggested donation',
    },
  ];

  return (
    <div className="space-y-6">
      <StepHeader
        step={5}
        title="Pricing"
        description="How much does it cost to attend?"
      />

      {/* ========== Price Type Selection ========== */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-3">
          Ticket Type <span className="text-coral">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {priceOptions.map(({ type, icon, description }) => {
            const isSelected = draftData.price_type === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  updateData({
                    price_type: type,
                    is_free: type === 'free',
                    // Clear prices for free events
                    ...(type === 'free' && { price_low: undefined, price_high: undefined }),
                  });
                }}
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg border text-center transition-all',
                  'hover:border-coral hover:bg-coral/5',
                  isSelected
                    ? 'border-coral bg-coral/10'
                    : 'border-sand bg-warm-white'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg mb-2',
                    isSelected ? 'bg-coral text-white' : 'bg-sand text-stone'
                  )}
                >
                  {icon}
                </div>
                <p className={cn(
                  'font-medium',
                  isSelected ? 'text-coral' : 'text-charcoal'
                )}>
                  {PRICE_TYPE_LABELS[type]}
                </p>
                <p className="text-xs text-stone mt-1">
                  {description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== Price Inputs ========== */}
      {draftData.price_type === 'fixed' && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-charcoal mb-1"
          >
            {isSeriesMode ? 'Series Price' : 'Ticket Price'} <span className="text-coral">*</span>
          </label>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone">$</span>
            <Input
              id="price"
              type="number"
              min={0}
              step={0.01}
              value={draftData.price_low ?? ''}
              onChange={(e) =>
                updateData({
                  price_low: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="25.00"
              className="pl-7"
            />
          </div>
          {isSeriesMode && (
            <p className="text-xs text-stone mt-1">
              Full series / registration price
            </p>
          )}
        </div>
      )}

      {draftData.price_type === 'range' && (
        <div className="p-4 bg-cream rounded-lg border border-sand space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price_low"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                Minimum Price <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone">$</span>
                <Input
                  id="price_low"
                  type="number"
                  min={0}
                  step={0.01}
                  value={draftData.price_low ?? ''}
                  onChange={(e) =>
                    updateData({
                      price_low: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="15.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="price_high"
                className="block text-sm font-medium text-charcoal mb-1"
              >
                Maximum Price <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone">$</span>
                <Input
                  id="price_high"
                  type="number"
                  min={0}
                  step={0.01}
                  value={draftData.price_high ?? ''}
                  onChange={(e) =>
                    updateData({
                      price_high: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="50.00"
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {draftData.price_type === 'donation' && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <label
            htmlFor="suggested_donation"
            className="block text-sm font-medium text-charcoal mb-1"
          >
            Suggested Donation (optional)
          </label>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone">$</span>
            <Input
              id="suggested_donation"
              type="number"
              min={0}
              step={0.01}
              value={draftData.price_low ?? ''}
              onChange={(e) =>
                updateData({
                  price_low: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="10.00"
              className="pl-7"
            />
          </div>
          <p className="text-xs text-stone mt-1">
            Leave blank for &quot;Pay what you can&quot;
          </p>
        </div>
      )}

      {/* ========== Price Details ========== */}
      {draftData.price_type && draftData.price_type !== 'free' && (
        <div>
          <label
            htmlFor="price_details"
            className="block text-sm font-medium text-charcoal mb-1"
          >
            Price Details (optional)
          </label>
          <Input
            id="price_details"
            type="text"
            value={draftData.price_details || ''}
            onChange={(e) => updateData({ price_details: e.target.value })}
            placeholder="e.g., Early bird $15, Door $25, VIP $50"
          />
          <p className="text-xs text-stone mt-1">
            Add extra details about pricing tiers or discounts
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* PHASE D: Series-Specific Pricing Fields                 */}
      {/* ====================================================== */}

      {/* Per-session / Drop-in price (only for drop_in or hybrid attendance) */}
      {showPerSessionPrice && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <label
            htmlFor="per_session_price"
            className="block text-sm font-medium text-charcoal mb-1 flex items-center"
          >
            <DollarSign className="w-4 h-4 mr-1.5" />
            Drop-in / Per-Session Price
          </label>
          <p className="text-xs text-stone mb-2">
            Price for attending a single session without full registration
          </p>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone">$</span>
            <Input
              id="per_session_price"
              type="number"
              min={0}
              step={0.01}
              value={seriesDraftData?.per_session_price ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : undefined;
                console.log(`💰 [Step5] Per-session price set: $${val ?? 'cleared'}`);
                mergeSeriesData({ per_session_price: val });
              }}
              placeholder="20.00"
              className="pl-7"
            />
          </div>
        </div>
      )}

      {/* Materials fee (for any new series) */}
      {showMaterialsFee && (
        <div className="p-4 bg-cream rounded-lg border border-sand">
          <label
            htmlFor="materials_fee"
            className="block text-sm font-medium text-charcoal mb-1 flex items-center"
          >
            <Package className="w-4 h-4 mr-1.5" />
            Materials / Supply Fee (optional)
          </label>
          <p className="text-xs text-stone mb-2">
            Separate fee for supplies, materials, or equipment
          </p>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone">$</span>
            <Input
              id="materials_fee"
              type="number"
              min={0}
              step={0.01}
              value={seriesDraftData?.materials_fee ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : undefined;
                console.log(`💰 [Step5] Materials fee set: $${val ?? 'cleared'}`);
                mergeSeriesData({ materials_fee: val });
              }}
              placeholder="15.00"
              className="pl-7"
            />
          </div>
        </div>
      )}

      {/* Pricing notes (for any new series) */}
      {showPricingNotes && (
        <div>
          <label
            htmlFor="pricing_notes"
            className="block text-sm font-medium text-charcoal mb-1 flex items-center"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Pricing Notes (optional)
          </label>
          <Input
            id="pricing_notes"
            type="text"
            value={seriesDraftData?.pricing_notes || ''}
            onChange={(e) => mergeSeriesData({ pricing_notes: e.target.value })}
            placeholder="e.g., Early bird: $180 before May 1. Sibling discount: 10%."
          />
          <p className="text-xs text-stone mt-1">
            Early bird rates, sibling discounts, scholarship info, etc.
          </p>
        </div>
      )}

      {/* ========== Ticket URL ========== */}
      <div>
        <label
          htmlFor="ticket_url"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          <span className="flex items-center">
            <Ticket className="w-4 h-4 mr-1" />
            Ticket Purchase URL
          </span>
        </label>
        <Input
          id="ticket_url"
          type="url"
          value={draftData.ticket_url || ''}
          onChange={(e) => updateData({ ticket_url: e.target.value })}
          placeholder="https://tickets.example.com/my-event"
        />
        <p className="text-xs text-stone mt-1">
          Where can people buy tickets? (e.g., Eventbrite, Ticketmaster)
        </p>
      </div>

      {/* ========== Registration URL (for free events/RSVPs) ========== */}
      <div>
        <label
          htmlFor="registration_url"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          <span className="flex items-center">
            <ClipboardList className="w-4 h-4 mr-1" />
            Registration / RSVP URL
          </span>
        </label>
        <Input
          id="registration_url"
          type="url"
          value={draftData.registration_url || ''}
          onChange={(e) => updateData({ registration_url: e.target.value })}
          placeholder="https://rsvp.example.com/my-event"
        />
        <p className="text-xs text-stone mt-1">
          {draftData.price_type === 'free'
            ? 'Free events often need RSVP — add the link here!'
            : 'For events that require registration separate from ticket purchase'}
        </p>
      </div>

      {/* ========== External Links Section ========== */}
      <div className="p-4 bg-cream rounded-lg border border-sand">
        <p className="text-sm font-medium text-charcoal mb-3 flex items-center">
          <Globe className="w-4 h-4 mr-2 text-coral" />
          Event Links (optional)
        </p>
        <p className="text-xs text-stone mb-4">
          Help attendees find more info about your event
        </p>
        <div className="space-y-4">
          {/* Event Website */}
          <div>
            <label
              htmlFor="website_url"
              className="block text-sm text-charcoal mb-1 flex items-center"
            >
              <Globe className="w-4 h-4 mr-1.5 text-coral" />
              Event Website
            </label>
            <Input
              id="website_url"
              type="url"
              value={draftData.website_url || ''}
              onChange={(e) => updateData({ website_url: e.target.value })}
              placeholder="https://myevent.com"
            />
          </div>

          {/* Instagram */}
          <div>
            <label
              htmlFor="instagram_url"
              className="block text-sm text-charcoal mb-1 flex items-center"
            >
              <Instagram className="w-4 h-4 mr-1.5 text-pink-500" />
              Instagram
            </label>
            <Input
              id="instagram_url"
              type="url"
              value={draftData.instagram_url || ''}
              onChange={(e) => updateData({ instagram_url: e.target.value })}
              placeholder="https://instagram.com/myevent"
            />
          </div>

          {/* Facebook */}
          <div>
            <label
              htmlFor="facebook_url"
              className="block text-sm text-charcoal mb-1 flex items-center"
            >
              <Facebook className="w-4 h-4 mr-1.5 text-blue-600" />
              Facebook Event
            </label>
            <Input
              id="facebook_url"
              type="url"
              value={draftData.facebook_url || ''}
              onChange={(e) => updateData({ facebook_url: e.target.value })}
              placeholder="https://facebook.com/events/123456"
            />
          </div>
        </div>
      </div>

      {/* ========== Free Event Message ========== */}
      {draftData.price_type === 'free' && (
        <div className="p-4 bg-sage/10 border border-sage/30 rounded-lg">
          <div className="flex items-center">
            <Gift className="w-5 h-5 text-sage mr-2" />
            <p className="text-sm text-charcoal">
              <span className="font-medium">Free events</span> are highlighted in search
              results and often get more attendees!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
