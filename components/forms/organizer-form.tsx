// ============================================================================
// 👥 HAPPENLIST - Organizer Form Component
// ============================================================================
// Reusable form for creating and editing organizers.
// ============================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import {
  Users,
  Globe,
  Image as ImageIcon,
  Save,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button, Input, Card, Label } from '@/components/ui'
import { Textarea } from '@/components/ui/textarea'
import { createOrganizer, updateOrganizer } from '@/lib/actions/organizers'
import { ROUTES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import type { Organizer } from '@/types'

// ============================================================================
// 📋 Props Interface
// ============================================================================

export interface OrganizerFormProps {
  /** Existing organizer data (for editing) */
  organizer?: Organizer | null
}

// ============================================================================
// 👥 Organizer Form Component
// ============================================================================

export function OrganizerForm({ organizer }: OrganizerFormProps) {
  const router = useRouter()
  const isEditing = !!organizer

  // Form state
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setFieldErrors({})

    const input = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      website_url: formData.get('website_url') as string || undefined,
      logo_url: formData.get('logo_url') as string || undefined,
    }

    logger.info('👥 Submitting organizer form', { isEditing, name: input.name })

    const result = isEditing
      ? await updateOrganizer(organizer.id, input)
      : await createOrganizer(input)

    if (!result.success) {
      setError(result.error || 'Something went wrong. Please try again.')
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
      }
      logger.warn('👥 Organizer form submission failed', { error: result.error })
      return
    }

    logger.info('✅ Organizer saved successfully')
    router.push(ROUTES.adminOrganizers)
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
          👥 Basic Information
          ======================================== */}
      <Card className="p-6 space-y-6">
        <h2 className="text-heading-sm font-semibold text-text-primary flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Organizer Details
        </h2>

        {/* Name */}
        <div>
          <Label htmlFor="name" required>
            Organizer Name
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={organizer?.name}
            placeholder="e.g., Milwaukee Jazz Alliance"
            error={fieldErrors.name?.[0]}
            className="mt-1.5"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={organizer?.description ?? ''}
            placeholder="Tell us about this organizer..."
            rows={4}
            className="mt-1.5"
          />
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
            defaultValue={organizer?.website_url ?? ''}
            placeholder="https://example.com"
            className="mt-1.5"
          />
        </div>

        {/* Logo URL */}
        <div>
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            name="logo_url"
            type="url"
            defaultValue={organizer?.logo_url ?? ''}
            placeholder="https://example.com/logo.png"
            className="mt-1.5"
          />
          <p className="helper-text">A square logo works best</p>
        </div>
      </Card>

      {/* ========================================
          📤 Form Actions
          ======================================== */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.adminOrganizers)}
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
          {isEditing ? 'Update Organizer' : 'Create Organizer'}
        </>
      )}
    </Button>
  )
}
