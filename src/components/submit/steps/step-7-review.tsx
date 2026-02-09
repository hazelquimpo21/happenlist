/**
 * STEP 7: REVIEW
 * ================
 * Final step of the event submission form.
 *
 * Shows:
 *   - Summary of all entered data
 *   - Validation status
 *   - Submit button
 *
 * @module components/submit/steps/step-7-review
 */

'use client';

import {
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Ticket,
  Image as ImageIcon,
  Layers,
  FileText,
  Edit,
} from 'lucide-react';
import { StepHeader } from '../step-progress';
import { Button } from '@/components/ui';
import type { EventDraftData, SeriesDraftData } from '@/types/submission';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  EVENT_MODE_LABELS,
  LOCATION_MODE_LABELS,
  PRICE_TYPE_LABELS,
} from '@/types/submission';
import {
  ATTENDANCE_MODE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from '@/lib/constants/series-limits';
import { formatAgeRange } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface Category {
  id: string;
  name: string;
}

interface Step7Props {
  draftData: EventDraftData;
  seriesDraftData: SeriesDraftData | null;
  categories: Category[];
  onEditStep: (step: number) => void;
}

// ============================================================================
// REVIEW SECTION COMPONENT
// ============================================================================

interface ReviewSectionProps {
  title: string;
  icon: React.ReactNode;
  isValid: boolean;
  errors: string[];
  onEdit: () => void;
  children: React.ReactNode;
}

function ReviewSection({ title, icon, isValid, errors, onEdit, children }: ReviewSectionProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        isValid ? 'border-sand bg-warm-white' : 'border-red-300 bg-red-50'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className={cn('mr-2', isValid ? 'text-sage' : 'text-red-500')}>
            {isValid ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </span>
          <span className="mr-2 text-stone">{icon}</span>
          <h3 className="font-medium text-charcoal">{title}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
      </div>

      {errors.length > 0 && (
        <ul className="mb-3 text-sm text-red-600 space-y-1">
          {errors.map((error, i) => (
            <li key={i}>• {error}</li>
          ))}
        </ul>
      )}

      <div className="text-sm text-charcoal">{children}</div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step7Review({ draftData, seriesDraftData, categories, onEditStep }: Step7Props) {
  // ========== Validation ==========
  const step1Validation = validateStep1(draftData);
  const step2Validation = validateStep2(draftData);
  const step3Validation = validateStep3(draftData);
  const step4Validation = validateStep4(draftData);
  const step5Validation = validateStep5(draftData);

  const allValid =
    step1Validation.valid &&
    step2Validation.valid &&
    step3Validation.valid &&
    step4Validation.valid &&
    step5Validation.valid;

  // ========== Helpers ==========
  const getCategoryName = (id: string | undefined) => {
    if (!id) return 'Not selected';
    return categories.find((c) => c.id === id)?.name || 'Unknown';
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return 'Not set';
    try {
      return format(new Date(datetime), 'EEEE, MMMM d, yyyy @ h:mm a');
    } catch {
      return datetime;
    }
  };

  const formatPrice = () => {
    if (!draftData.price_type) return 'Not set';
    if (draftData.price_type === 'free') return 'Free';
    if (draftData.price_type === 'fixed' && draftData.price_low !== undefined) {
      return `$${draftData.price_low.toFixed(2)}`;
    }
    if (
      draftData.price_type === 'range' &&
      draftData.price_low !== undefined &&
      draftData.price_high !== undefined
    ) {
      return `$${draftData.price_low.toFixed(2)} - $${draftData.price_high.toFixed(2)}`;
    }
    return PRICE_TYPE_LABELS[draftData.price_type] || 'Not set';
  };

  return (
    <div className="space-y-6">
      <StepHeader
        step={7}
        title="Review & Submit"
        description="Check everything looks good before submitting"
      />

      {/* ========== Overall Status ========== */}
      <div
        className={cn(
          'p-4 rounded-lg flex items-center',
          allValid ? 'bg-sage/10 border border-sage/30' : 'bg-red-50 border border-red-200'
        )}
      >
        {allValid ? (
          <>
            <CheckCircle className="w-6 h-6 text-sage mr-3" />
            <div>
              <p className="font-medium text-charcoal">Ready to submit!</p>
              <p className="text-sm text-stone">All required information is complete.</p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <p className="font-medium text-charcoal">Please fix the issues below</p>
              <p className="text-sm text-stone">Some required information is missing.</p>
            </div>
          </>
        )}
      </div>

      {/* ========== Section Reviews ========== */}
      <div className="space-y-4">
        {/* Basic Info */}
        <ReviewSection
          title="Basic Info"
          icon={<FileText className="w-4 h-4" />}
          isValid={step1Validation.valid}
          errors={step1Validation.errors}
          onEdit={() => onEditStep(1)}
        >
          <div className="space-y-2">
            <div>
              <span className="text-stone">Title:</span>{' '}
              <span className="font-medium">{draftData.title || 'Not set'}</span>
            </div>
            <div>
              <span className="text-stone">Category:</span>{' '}
              <span className="font-medium">{getCategoryName(draftData.category_id)}</span>
            </div>
            {draftData.short_description && (
              <div>
                <span className="text-stone">Summary:</span>{' '}
                <span>{draftData.short_description}</span>
              </div>
            )}
          </div>
        </ReviewSection>

        {/* Event Type */}
        <ReviewSection
          title="Event Type"
          icon={<Layers className="w-4 h-4" />}
          isValid={step2Validation.valid}
          errors={step2Validation.errors}
          onEdit={() => onEditStep(2)}
        >
          <div className="space-y-2">
            <div>
              <span className="text-stone">Type:</span>{' '}
              <span className="font-medium">
                {draftData.event_mode
                  ? EVENT_MODE_LABELS[draftData.event_mode].title
                  : 'Not selected'}
              </span>
            </div>
            {seriesDraftData?.title && (
              <div>
                <span className="text-stone">New Series:</span>{' '}
                <span className="font-medium">{seriesDraftData.title}</span>
                {seriesDraftData.series_type && (
                  <span className="text-stone ml-1">({seriesDraftData.series_type})</span>
                )}
              </div>
            )}
            {seriesDraftData?.attendance_mode && (
              <div>
                <span className="text-stone">Attendance:</span>{' '}
                <span className="font-medium">
                  {ATTENDANCE_MODE_OPTIONS.find((o) => o.value === seriesDraftData.attendance_mode)?.label || seriesDraftData.attendance_mode}
                </span>
              </div>
            )}
            {(seriesDraftData?.age_low != null || seriesDraftData?.age_high != null) && (
              <div>
                <span className="text-stone">Age Range:</span>{' '}
                <span className="font-medium">
                  {formatAgeRange(seriesDraftData.age_low ?? null, seriesDraftData.age_high ?? null) || 'All ages'}
                </span>
              </div>
            )}
            {seriesDraftData?.skill_level && (
              <div>
                <span className="text-stone">Skill Level:</span>{' '}
                <span className="font-medium">
                  {SKILL_LEVEL_OPTIONS.find((o) => o.value === seriesDraftData.skill_level)?.label || seriesDraftData.skill_level}
                </span>
              </div>
            )}
            {seriesDraftData?.core_start_time && (
              <div>
                <span className="text-stone">Core Hours:</span>{' '}
                <span className="font-medium">
                  {seriesDraftData.core_start_time}
                  {seriesDraftData.core_end_time && ` – ${seriesDraftData.core_end_time}`}
                </span>
              </div>
            )}
            {(seriesDraftData?.extended_start_time || seriesDraftData?.extended_end_time) && (
              <div>
                <span className="text-stone">Extended Care:</span>{' '}
                <span className="font-medium">
                  {seriesDraftData.extended_start_time && `Before: ${seriesDraftData.extended_start_time}`}
                  {seriesDraftData.extended_start_time && seriesDraftData.extended_end_time && ' / '}
                  {seriesDraftData.extended_end_time && `After: ${seriesDraftData.extended_end_time}`}
                </span>
              </div>
            )}
            {seriesDraftData?.days_of_week && seriesDraftData.days_of_week.length > 0 && (
              <div>
                <span className="text-stone">Days:</span>{' '}
                <span className="font-medium">
                  {seriesDraftData.days_of_week.map((d) =>
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
                  ).join(', ')}
                </span>
              </div>
            )}
          </div>
        </ReviewSection>

        {/* Date & Time */}
        <ReviewSection
          title="Date & Time"
          icon={<Calendar className="w-4 h-4" />}
          isValid={step3Validation.valid}
          errors={step3Validation.errors}
          onEdit={() => onEditStep(3)}
        >
          <div className="space-y-2">
            <div>
              <span className="text-stone">Starts:</span>{' '}
              <span className="font-medium">{formatDateTime(draftData.start_datetime)}</span>
            </div>
            {draftData.end_datetime && (
              <div>
                <span className="text-stone">Ends:</span>{' '}
                <span>{formatDateTime(draftData.end_datetime)}</span>
              </div>
            )}
            {draftData.is_all_day && (
              <div className="text-sage font-medium">All-day event</div>
            )}
          </div>
        </ReviewSection>

        {/* Location */}
        <ReviewSection
          title="Location"
          icon={<MapPin className="w-4 h-4" />}
          isValid={step4Validation.valid}
          errors={step4Validation.errors}
          onEdit={() => onEditStep(4)}
        >
          <div>
            <span className="text-stone">Type:</span>{' '}
            <span className="font-medium">
              {draftData.location_mode
                ? LOCATION_MODE_LABELS[draftData.location_mode].title
                : 'Not selected'}
            </span>
            {draftData.location_mode === 'new' && draftData.new_location?.name && (
              <div className="mt-1">
                <span className="font-medium">{draftData.new_location.name}</span>
                {draftData.new_location.address_line && (
                  <span>, {draftData.new_location.address_line}</span>
                )}
                {draftData.new_location.city && <span>, {draftData.new_location.city}</span>}
              </div>
            )}
          </div>
        </ReviewSection>

        {/* Pricing */}
        <ReviewSection
          title="Pricing"
          icon={<Ticket className="w-4 h-4" />}
          isValid={step5Validation.valid}
          errors={step5Validation.errors}
          onEdit={() => onEditStep(5)}
        >
          <div className="space-y-2">
            <div>
              <span className="text-stone">Price:</span>{' '}
              <span className="font-medium">{formatPrice()}</span>
            </div>
            {seriesDraftData?.per_session_price != null && seriesDraftData.per_session_price > 0 && (
              <div>
                <span className="text-stone">Per Session:</span>{' '}
                <span className="font-medium">${seriesDraftData.per_session_price}</span>
              </div>
            )}
            {seriesDraftData?.materials_fee != null && seriesDraftData.materials_fee > 0 && (
              <div>
                <span className="text-stone">Materials Fee:</span>{' '}
                <span className="font-medium">${seriesDraftData.materials_fee}</span>
              </div>
            )}
            {seriesDraftData?.pricing_notes && (
              <div>
                <span className="text-stone">Pricing Notes:</span>{' '}
                <span>{seriesDraftData.pricing_notes}</span>
              </div>
            )}
            {draftData.price_details && (
              <div>
                <span className="text-stone">Details:</span> <span>{draftData.price_details}</span>
              </div>
            )}
            {draftData.ticket_url && (
              <div>
                <span className="text-stone">Ticket URL:</span>{' '}
                <a
                  href={draftData.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral hover:underline"
                >
                  {draftData.ticket_url.slice(0, 40)}...
                </a>
              </div>
            )}
          </div>
        </ReviewSection>

        {/* Image */}
        <ReviewSection
          title="Image"
          icon={<ImageIcon className="w-4 h-4" />}
          isValid={true}
          errors={[]}
          onEdit={() => onEditStep(6)}
        >
          {draftData.image_url ? (
            <div className="flex items-center space-x-4">
              <div className="w-24 h-16 rounded overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draftData.image_url}
                  alt="Event"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sage">Image added</span>
            </div>
          ) : (
            <span className="text-stone">No image (a default will be used)</span>
          )}
        </ReviewSection>
      </div>

      {/* ========== What Happens Next ========== */}
      <div className="p-4 bg-cream rounded-lg border border-sand">
        <h4 className="font-medium text-charcoal mb-2">What happens after you submit?</h4>
        <ol className="text-sm text-stone space-y-2">
          <li className="flex items-start">
            <span className="bg-coral text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
              1
            </span>
            <span>Your event goes to our review queue</span>
          </li>
          <li className="flex items-start">
            <span className="bg-coral text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
              2
            </span>
            <span>We review it within 24 hours (usually much faster!)</span>
          </li>
          <li className="flex items-start">
            <span className="bg-coral text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
              3
            </span>
            <span>You&apos;ll get an email when it&apos;s approved</span>
          </li>
          <li className="flex items-start">
            <span className="bg-sage text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
              ✓
            </span>
            <span>Your event goes live on Happenlist!</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
