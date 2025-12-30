/**
 * ABOUT PAGE
 * ==========
 * Information about Happenlist and its mission.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, MapPin, Users, Calendar } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button } from '@/components/ui';
import { ROUTES, SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About',
  description: `Learn about ${SITE_CONFIG.name} - your guide to discovering local events, concerts, festivals, and more.`,
};

/**
 * About page - explains what Happenlist is and its mission.
 */
export default function AboutPage() {
  console.log('📖 [AboutPage] Rendering about page');

  return (
    <>
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="bg-warm-white py-16 md:py-24 border-b border-sand">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-display text-charcoal mb-6">
              About <span className="text-coral">Happenlist</span>
            </h1>
            <p className="text-body-lg text-stone">
              We believe everyone deserves to know what&apos;s happening in their
              community. That&apos;s why we built Happenlist - a simple, beautiful
              way to discover local events.
            </p>
          </div>
        </Container>
      </section>

      {/* ============================================
          MISSION SECTION
          ============================================ */}
      <section className="py-16">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-h2 text-charcoal mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-body text-stone mb-6">
              Finding events shouldn&apos;t be hard. You shouldn&apos;t have to check
              a dozen different websites, scroll through endless social media
              feeds, or miss out on amazing experiences just because you
              didn&apos;t hear about them in time.
            </p>
            <p className="text-body text-stone mb-6">
              Happenlist brings together events from across your city into one
              clean, easy-to-browse experience. From live music and art shows
              to workshops, festivals, and community gatherings - we make sure
              you never miss what matters to you.
            </p>
          </div>
        </Container>
      </section>

      {/* ============================================
          VALUES SECTION
          ============================================ */}
      <section className="py-16 bg-warm-white">
        <Container>
          <h2 className="font-display text-h2 text-charcoal mb-12 text-center">
            What We Value
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Local First */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-display text-h4 text-charcoal mb-2">
                Local First
              </h3>
              <p className="text-small text-stone">
                We focus on what&apos;s happening in your neighborhood, not
                across the globe.
              </p>
            </div>

            {/* Community */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-display text-h4 text-charcoal mb-2">
                Community
              </h3>
              <p className="text-small text-stone">
                Events bring people together. We&apos;re here to help those
                connections happen.
              </p>
            </div>

            {/* Simplicity */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-display text-h4 text-charcoal mb-2">
                Simplicity
              </h3>
              <p className="text-small text-stone">
                No clutter, no noise. Just the events you care about, easy to
                find and browse.
              </p>
            </div>

            {/* Passion */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <Heart className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-display text-h4 text-charcoal mb-2">
                Passion
              </h3>
              <p className="text-small text-stone">
                Built by people who love discovering new experiences and
                supporting local creators.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================
          CTA SECTION
          ============================================ */}
      <section className="py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-display text-h2 text-charcoal mb-4">
              Ready to explore?
            </h2>
            <p className="text-body text-stone mb-8 max-w-lg mx-auto">
              Start discovering events happening in your area today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button href={ROUTES.events} variant="primary">
                Browse Events
              </Button>
              <Button href={ROUTES.contact} variant="secondary">
                Get in Touch
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
