// ============================================================================
// 📝 HAPPENLIST - Event Form Component
// ============================================================================
// Reusable form for creating and editing events.
// Uses controlled inputs with React Hook Form and Zod validation.
// ============================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  Link as LinkIcon,
  Image as ImageIcon,
  Tag,
  Save,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button, Input, Card, Label } from '@/components/ui'
import { Textarea } from '@/components/ui/textarea'
import { createEvent, updateEvent } from '@/lib/actions/events'
import { ROUTES, EVENT_STATUSES, EVENT_STATUS_CONFIG } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { EventWithRelations, Category, Venue, Organizer, Tag as TagType } from '@/types'

// ============================================================================
// 📋 Props Interface
// ============================================================================

export interface EventFormProps {
  /** Existing event data (for editing) */
  event?: EventWithRelations | null
  /** Available categories for dropdown */
  categories: Category[]
  /** Available venues for dropdown */
  venues: Venue[]
  /** Available organizers for dropdown */
  organizers: Organizer[]
  /** Available tags for selection */
  tags: TagType[]
}

// ============================================================================
// 📝 Event Form Component
// ============================================================================

export function EventForm({
  event,
  categories,
  venues,
  organizers,
  tags,
}: EventFormProps) {
  const router = useRouter()
  const isEditing = !!event

  // Form state
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [selectedTags, setSelectedTags] = useState<string[]>(
    event?.tags?.map((t) => t.id) ?? []
  )

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setFieldErrors({})

    // Build the input object
    const input = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      start_at: formData.get('start_at') as string,
      end_at: formData.get('end_at') as string || undefined,
      category_id: formData.get('category_id') as string,
      venue_id: formData.get('venue_id') as string,
      organizer_id: formData.get('organizer_id') as string || undefined,
      event_type: (formData.get('event_type') as string) || 'single',
      status: (formData.get('status') as string) || 'draft',
      is_free: formData.get('is_free') === 'on',
      price_min: formData.get('price_min')
        ? Number(formData.get('price_min'))
        : undefined,
      price_max: formData.get('price_max')
        ? Number(formData.get('price_max'))
        : undefined,
      is_featured: formData.get('is_featured') === 'on',
      ticket_url: formData.get('ticket_url') as string || undefined,
      website_url: formData.get('website_url') as string || undefined,
      image_url: formData.get('image_url') as string || undefined,
      flyer_url: formData.get('flyer_url') as string || undefined,
      tag_ids: selectedTags,
    }

    logger.info('📝 Submitting event form', {
      isEditing,
      title: input.title,
    })

    const result = isEditing
      ? await updateEvent(event.id, input)
      : await createEvent(input)

    if (!result.success) {
      setError(result.error || 'Something went wrong. Please try again.')
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
      }
      logger.warn('📝 Event form submission failed', { error: result.error })
      return
    }

    logger.info('✅ Event saved successfully')

    // Redirect on success
    router.push(ROUTES.adminEvents)
    router.refresh()
  }

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Global Error */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3 text-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {/* ========================================
          📋 Basic Information
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Basic Information
        </h2>

        {/* Title */}
        <div>
          <Label htmlFor="title" required>
            Event Title
          </Label>
          <Input
            id="title"
            name="title"
            defaultValue={event?.title}
            placeholder="e.g., Milwaukee Jazz Festival 2025"
            error={fieldErrors.title?.[0]}
            className="mt-1.5"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={event?.description ?? ''}
            placeholder="Describe your event..."
            rows={4}
            className="mt-1.5"
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category_id" required>
            Category
          </Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={event?.category_id ?? ''}
            className="mt-1.5 input w-full"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {fieldErrors.category_id && (
            <p className="error-text">{fieldErrors.category_id[0]}</p>
          )}
        </div>
      </Card>

      {/* ========================================
          📅 Date & Time
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Date & Time
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date/Time */}
          <div>
            <Label htmlFor="start_at" required>
              Start Date & Time
            </Label>
            <Input
              id="start_at"
              name="start_at"
              type="datetime-local"
              defaultValue={
                event?.start_at
                  ? new Date(event.start_at).toISOString().slice(0, 16)
                  : ''
              }
              error={fieldErrors.start_at?.[0]}
              className="mt-1.5"
            />
          </div>

          {/* End Date/Time */}
          <div>
            <Label htmlFor="end_at">End Date & Time</Label>
            <Input
              id="end_at"
              name="end_at"
              type="datetime-local"
              defaultValue={
                event?.end_at
                  ? new Date(event.end_at).toISOString().slice(0, 16)
                  : ''
              }
              className="mt-1.5"
            />
            <p className="helper-text">Optional - for multi-day events</p>
          </div>
        </div>

        {/* Event Type */}
        <div>
          <Label htmlFor="event_type">Event Type</Label>
          <select
            id="event_type"
            name="event_type"
            defaultValue={event?.event_type ?? 'single'}
            className="mt-1.5 input w-full"
          >
            <option value="single">Single Event</option>
            <option value="recurring">Recurring Event</option>
            <option value="multi_day">Multi-Day Event</option>
          </select>
        </div>
      </Card>

      {/* ========================================
          📍 Location & Organizer
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Location & Organizer
        </h2>

        {/* Venue */}
        <div>
          <Label htmlFor="venue_id" required>
            Venue
          </Label>
          <select
            id="venue_id"
            name="venue_id"
            defaultValue={event?.venue_id ?? ''}
            className="mt-1.5 input w-full"
            required
          >
            <option value="">Select a venue</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
          {fieldErrors.venue_id && (
            <p className="error-text">{fieldErrors.venue_id[0]}</p>
          )}
        </div>

        {/* Organizer */}
        <div>
          <Label htmlFor="organizer_id">Organizer</Label>
          <select
            id="organizer_id"
            name="organizer_id"
            defaultValue={event?.organizer_id ?? ''}
            className="mt-1.5 input w-full"
          >
            <option value="">Select an organizer (optional)</option>
            {organizers.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* ========================================
          💰 Pricing
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Pricing
        </h2>

        {/* Is Free Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_free"
            defaultChecked={event?.is_free ?? false}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-body-md text-text-primary">
            This is a free event
          </span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Min Price */}
          <div>
            <Label htmlFor="price_min">Minimum Price ($)</Label>
            <Input
              id="price_min"
              name="price_min"
              type="number"
              step="0.01"
              min="0"
              defaultValue={event?.price_min ?? ''}
              placeholder="0.00"
              className="mt-1.5"
            />
          </div>

          {/* Max Price */}
          <div>
            <Label htmlFor="price_max">Maximum Price ($)</Label>
            <Input
              id="price_max"
              name="price_max"
              type="number"
              step="0.01"
              min="0"
              defaultValue={event?.price_max ?? ''}
              placeholder="0.00"
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>

      {/* ========================================
          🔗 Links
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary" />
          Links
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ticket URL */}
          <div>
            <Label htmlFor="ticket_url">Ticket URL</Label>
            <Input
              id="ticket_url"
              name="ticket_url"
              type="url"
              defaultValue={event?.ticket_url ?? ''}
              placeholder="https://tickets.example.com"
              className="mt-1.5"
            />
          </div>

          {/* Website URL */}
          <div>
            <Label htmlFor="website_url">Event Website</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              defaultValue={event?.website_url ?? ''}
              placeholder="https://example.com"
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>

      {/* ========================================
          🖼️ Images
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Images
        </h2>
        <p className="text-body-sm text-text-secondary">
          Enter image URLs for the event. Image upload coming soon!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thumbnail Image */}
          <div>
            <Label htmlFor="image_url">Thumbnail Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              defaultValue={event?.image_url ?? ''}
              placeholder="https://example.com/image.jpg"
              className="mt-1.5"
            />
          </div>

          {/* Flyer Image */}
          <div>
            <Label htmlFor="flyer_url">Flyer Image URL</Label>
            <Input
              id="flyer_url"
              name="flyer_url"
              type="url"
              defaultValue={event?.flyer_url ?? ''}
              placeholder="https://example.com/flyer.jpg"
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>

      {/* ========================================
          🏷️ Tags
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Tags
        </h2>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-border'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </Card>

      {/* ========================================
          ⚙️ Publishing Options
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary">
          Publishing Options
        </h2>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={event?.status ?? 'draft'}
            className="mt-1.5 input w-full"
          >
            {EVENT_STATUSES.filter((s) => s !== 'archived').map((status) => {
              const config = EVENT_STATUS_CONFIG[status]
              return (
                <option key={status} value={status}>
                  {config.label}
                </option>
              )
            })}
          </select>
        </div>

        {/* Featured Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={event?.is_featured ?? false}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-body-md text-text-primary">
            Feature this event on the homepage
          </span>
        </label>
      </Card>

      {/* ========================================
          📤 Form Actions
          ======================================== */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.adminEvents)}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  )
}

// ============================================================================
// 📤 Submit Button with Loading State
// ============================================================================

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? 'Update Event' : 'Create Event'}
        </>
      )}
    </Button>
  )
}
