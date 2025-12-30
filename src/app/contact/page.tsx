/**
 * CONTACT PAGE
 * ============
 * Contact information and feedback form placeholder.
 */

import type { Metadata } from 'next';
import { Mail, MessageSquare, HelpCircle } from 'lucide-react';
import { Container } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with the ${SITE_CONFIG.name} team. We'd love to hear from you!`,
};

/**
 * Contact page - provides ways to reach the Happenlist team.
 */
export default function ContactPage() {
  console.log('📬 [ContactPage] Rendering contact page');

  return (
    <>
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="bg-warm-white py-16 md:py-24 border-b border-sand">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-display text-charcoal mb-6">
              Get in <span className="text-coral">Touch</span>
            </h1>
            <p className="text-body-lg text-stone">
              Have a question, feedback, or want to list your event? We&apos;d
              love to hear from you.
            </p>
          </div>
        </Container>
      </section>

      {/* ============================================
          CONTACT OPTIONS
          ============================================ */}
      <section className="py-16">
        <Container>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* General Inquiries */}
            <div className="bg-warm-white border border-sand rounded-lg p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <Mail className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-display text-h4 text-charcoal mb-2">
                General Inquiries
              </h3>
              <p className="text-small text-stone mb-4">
                Questions about Happenlist? Drop us a line.
              </p>
              <a
                href="mailto:hello@happenlist.com"
                className="text-coral hover:text-coral-dark font-medium"
              >
                hello@happenlist.com
              </a>
            </div>

            {/* Submit an Event */}
            <div className="bg-warm-white border border-sand rounded-lg p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-display text-h4 text-charcoal mb-2">
                Submit an Event
              </h3>
              <p className="text-small text-stone mb-4">
                Want your event listed? Let us know!
              </p>
              <a
                href="mailto:events@happenlist.com"
                className="text-coral hover:text-coral-dark font-medium"
              >
                events@happenlist.com
              </a>
            </div>

            {/* Support */}
            <div className="bg-warm-white border border-sand rounded-lg p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-display text-h4 text-charcoal mb-2">
                Support
              </h3>
              <p className="text-small text-stone mb-4">
                Need help with something? We&apos;re here for you.
              </p>
              <a
                href="mailto:support@happenlist.com"
                className="text-coral hover:text-coral-dark font-medium"
              >
                support@happenlist.com
              </a>
            </div>
          </div>

          {/* ============================================
              FEEDBACK FORM
              ============================================ */}
          <div className="max-w-xl mx-auto">
            <div className="bg-warm-white border border-sand rounded-lg p-8">
              <h2 className="font-display text-h3 text-charcoal mb-2 text-center">
                Send us a Message
              </h2>
              <p className="text-small text-stone mb-8 text-center">
                We read every message and try to respond within 24 hours.
              </p>

              {/*
                NOTE: This form is currently a placeholder.
                In production, this would submit to an API route or service like:
                - Formspree, Netlify Forms, or custom API
                - Email service (SendGrid, Postmark, etc.)
              */}
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-small font-medium text-charcoal mb-2"
                    >
                      Your Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-small font-medium text-charcoal mb-2"
                    >
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jane@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-small font-medium text-charcoal mb-2"
                  >
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="What's this about?"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-small font-medium text-charcoal mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    required
                    className="w-full px-4 py-2.5 border border-sand rounded-lg text-charcoal placeholder:text-stone/60 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-colors resize-none"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Send Message
                </Button>

                <p className="text-caption text-stone text-center">
                  By sending a message, you agree to our privacy policy.
                </p>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
