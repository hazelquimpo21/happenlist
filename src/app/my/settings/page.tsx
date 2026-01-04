/**
 * PROFILE SETTINGS PAGE
 * =====================
 * User account settings and preferences.
 *
 * ROUTE: /my/settings
 *
 * FEATURES:
 *   - Update display name
 *   - Update avatar
 *   - Notification preferences
 *   - Account info
 *
 * 🔒 REQUIRES: User must be authenticated
 *
 * @module app/my/settings/page
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Container } from '@/components/layout';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/data/user';
import { ProfileSettingsForm } from './profile-form';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your Happenlist account settings and preferences.',
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function SettingsPage() {
  // ---------------------------------------------------------------------------
  // 1. CHECK AUTH
  // ---------------------------------------------------------------------------

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/my/settings');
  }

  // ---------------------------------------------------------------------------
  // 2. FETCH PROFILE
  // ---------------------------------------------------------------------------

  const result = await getProfile(user.id);
  const profile = result.success ? result.profile : null;

  // ---------------------------------------------------------------------------
  // 3. RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="py-8 md:py-12">
      <Container>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-h2 md:text-h1 text-charcoal mb-2">
            ⚙️ Settings
          </h1>
          <p className="text-stone text-body">
            Manage your account and preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <section className="bg-white rounded-xl border border-sand p-6">
              <h2 className="font-display text-h4 text-charcoal mb-6">
                👤 Profile
              </h2>
              <ProfileSettingsForm profile={profile} userEmail={user.email || ''} />
            </section>

            {/* Notification Preferences */}
            <section className="bg-white rounded-xl border border-sand p-6">
              <h2 className="font-display text-h4 text-charcoal mb-6">
                🔔 Notifications
              </h2>
              <div className="space-y-4 text-stone">
                <p>Email notification settings coming soon!</p>
                <ul className="list-disc list-inside text-body-sm space-y-1">
                  <li>Get notified when your events are approved</li>
                  <li>Weekly digest of events you might like</li>
                  <li>Updates from organizers you follow</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info Card */}
            <div className="bg-white rounded-xl border border-sand p-6">
              <h3 className="font-display text-h5 text-charcoal mb-4">
                📧 Account
              </h3>
              <dl className="space-y-3 text-body-sm">
                <div>
                  <dt className="text-stone mb-0.5">Email</dt>
                  <dd className="text-charcoal font-medium break-all">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone mb-0.5">Member since</dt>
                  <dd className="text-charcoal">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-sand p-6">
              <h3 className="font-display text-h5 text-charcoal mb-4">
                🔗 Quick Links
              </h3>
              <nav className="space-y-2">
                <SettingsLink href="/my/hearts">
                  ❤️ My Saved Events
                </SettingsLink>
                <SettingsLink href="/my/submissions">
                  📝 My Submissions
                </SettingsLink>
                <SettingsLink href="/submit/new">
                  ➕ Submit an Event
                </SettingsLink>
              </nav>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h3 className="font-display text-h5 text-red-700 mb-2">
                ⚠️ Danger Zone
              </h3>
              <p className="text-body-sm text-red-600 mb-4">
                Need to delete your account? Contact us and we&apos;ll help.
              </p>
              <a
                href="/contact"
                className="text-body-sm text-red-700 hover:underline"
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SettingsLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="block py-2 px-3 -mx-3 rounded-lg text-stone hover:text-charcoal hover:bg-sand/50 transition-colors"
    >
      {children}
    </a>
  );
}
