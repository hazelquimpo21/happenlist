// ============================================================================
// 📍 HAPPENLIST - Venue Form Component
// ============================================================================
// Reusable form for creating and editing venues.
// ============================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import {
  MapPin,
  Globe,
  Image as ImageIcon,
  Save,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button, Input, Card, Label } from '@/components/ui'
import { createVenue, updateVenue } from '@/lib/actions/venues'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Venue } from '@/types'

// ============================================================================
// 📋 Props Interface
// ============================================================================

export interface VenueFormProps {
  /** Existing venue data (for editing) */
  venue?: Venue | null
}

// ============================================================================
// 📍 Venue Form Component
// ============================================================================

export function VenueForm({ venue }: VenueFormProps) {
  const router = useRouter()
  const isEditing = !!venue

  // Form state
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setFieldErrors({})

    const input = {
      name: formData.get('name') as string,
      address: formData.get('address') as string || undefined,
      city: formData.get('city') as string || undefined,
      zip: formData.get('zip') as string || undefined,
      website_url: formData.get('website_url') as string || undefined,
      image_url: formData.get('image_url') as string || undefined,
    }

    logger.info('📍 Submitting venue form', { isEditing, name: input.name })

    const result = isEditing
      ? await updateVenue(venue.id, input)
      : await createVenue(input)

    if (!result.success) {
      setError(result.error || 'Something went wrong. Please try again.')
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
      }
      logger.warn('📍 Venue form submission failed', { error: result.error })
      return
    }

    logger.info('✅ Venue saved successfully')
    router.push(ROUTES.adminVenues)
    router.refresh()
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
          📍 Basic Information
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Venue Details
        </h2>

        {/* Name */}
        <div>
          <Label htmlFor="name" required>
            Venue Name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={venue?.name}
            placeholder="e.g., The Pabst Theater"
            error={fieldErrors.name?.[0]}
            className="mt-1.5"
          />
        </div>

        {/* Address */}
        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={venue?.address ?? ''}
            placeholder="e.g., 144 E Wells St"
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* City */}
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={venue?.city ?? ''}
              placeholder="Milwaukee"
              className="mt-1.5"
            />
          </div>

          {/* Zip */}
          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              name="zip"
              defaultValue={venue?.zip ?? ''}
              placeholder="53202"
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>

      {/* ========================================
          🔗 Links & Images
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Links & Images
        </h2>

        {/* Website */}
        <div>
          <Label htmlFor="website_url">Website</Label>
          <Input
            id="website_url"
            name="website_url"
            type="url"
            defaultValue={venue?.website_url ?? ''}
            placeholder="https://example.com"
            className="mt-1.5"
          />
        </div>

        {/* Image URL */}
        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            name="image_url"
            type="url"
            defaultValue={venue?.image_url ?? ''}
            placeholder="https://example.com/venue.jpg"
            className="mt-1.5"
          />
          <p className="helper-text">A photo of the venue</p>
        </div>
      </Card>

      {/* ========================================
          📤 Form Actions
          ======================================== */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.adminVenues)}
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
          {isEditing ? 'Update Venue' : 'Create Venue'}
        </>
      )}
    </Button>
  )
}
