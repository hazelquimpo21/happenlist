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
 * @module components/submit/steps/step-5-pricing
 */

'use client';

import { Gift, DollarSign, Ticket, ExternalLink, Heart } from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Input } from '@/components/ui';
import type { EventDraftData, PriceType } from '@/types/submission';
import { PRICE_TYPE_LABELS } from '@/types/submission';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Step5Props {
  draftData: EventDraftData;
  updateData: (updates: Partial<EventDraftData>) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step5Pricing({ draftData, updateData }: Step5Props) {
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
            Ticket Price <span className="text-coral">*</span>
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

      {/* ========== Ticket URL ========== */}
      <div>
        <label
          htmlFor="ticket_url"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          <span className="flex items-center">
            <ExternalLink className="w-4 h-4 mr-1" />
            Ticket/Registration URL
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
          {draftData.location_mode === 'online'
            ? 'For online events, you can use this for the meeting link'
            : 'Where can people buy tickets or register?'}
        </p>
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
