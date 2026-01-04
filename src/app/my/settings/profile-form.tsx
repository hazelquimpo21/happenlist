/**
 * PROFILE SETTINGS FORM
 * =====================
 * Client component for updating profile settings.
 *
 * Features:
 *   - Edit display name
 *   - View account info
 *   - Auto-save with debounce (optional)
 *   - Toast notifications for feedback
 *
 * @module app/my/settings/profile-form
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { User, Save, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/user';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileSettingsFormProps {
  /** Current profile data (null if not yet created) */
  profile: Profile | null;

  /** User's email (from auth) */
  userEmail: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProfileSettingsForm({
  profile,
  userEmail,
}: ProfileSettingsFormProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [displayName, setDisplayName] = useState(
    profile?.display_name || userEmail.split('@')[0] || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Handle display name change
   */
  const handleDisplayNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDisplayName(value);
      setHasChanges(value !== (profile?.display_name || ''));
    },
    [profile?.display_name]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!hasChanges) return;

      setIsLoading(true);

      try {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            display_name: displayName.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save');
        }

        setHasChanges(false);
        toast.success('Profile updated!', {
          description: 'Your changes have been saved.',
          duration: 3000,
        });
      } catch (error) {
        console.error('Profile update failed:', error);
        toast.error('Couldn\'t save changes', {
          description: 'Please try again in a moment.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [displayName, hasChanges]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Placeholder */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            'bg-coral/10 text-coral text-xl font-display font-medium'
          )}
        >
          {displayName.slice(0, 2).toUpperCase() || <User className="w-6 h-6" />}
        </div>
        <div>
          <p className="text-body font-medium text-charcoal">
            {displayName || 'Your Name'}
          </p>
          <p className="text-body-sm text-stone">{userEmail}</p>
        </div>
      </div>

      {/* Display Name Field */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-body-sm font-medium text-charcoal mb-1.5"
        >
          Display Name
        </label>
        <Input
          id="display_name"
          type="text"
          value={displayName}
          onChange={handleDisplayNameChange}
          placeholder="How should we call you?"
          maxLength={50}
          className="max-w-md"
        />
        <p className="mt-1.5 text-body-xs text-stone">
          This is how your name appears on the site.
        </p>
      </div>

      {/* Timezone (Read-only for now) */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-body-sm font-medium text-charcoal mb-1.5"
        >
          Timezone
        </label>
        <Input
          id="timezone"
          type="text"
          value={profile?.timezone || 'America/Chicago'}
          disabled
          className="max-w-md bg-sand/30"
        />
        <p className="mt-1.5 text-body-xs text-stone">
          Used for event time display. Auto-detected from your browser.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={!hasChanges || isLoading}
          leftIcon={
            isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )
          }
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>

        {hasChanges && (
          <span className="text-body-sm text-stone">
            You have unsaved changes
          </span>
        )}
      </div>
    </form>
  );
}
