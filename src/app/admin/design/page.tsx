/**
 * ADMIN FORM SHELL — DEMO ROUTE
 * ==============================
 * Renders every primitive in components/admin/form-shell/* with mock data
 * so we can see the Phase A foundation before wiring it into the real Edit
 * Event and Edit Series pages.
 *
 * Auth: superadmin only. Hidden from sidebar.
 *
 * Remove or guard once Phase B/C ship if it adds noise.
 *
 * @module app/admin/design
 */
import { redirect } from 'next/navigation';
import { Eye, RefreshCw, Save, Trash2 } from 'lucide-react';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ShapeBadge } from '@/components/admin/shape-badge';
import {
  CommandBar,
  HeroCard,
  FormSection,
  SectionTOC,
  QuickChecklist,
  StatusPill,
  WhatChangedCard,
} from '@/components/admin/form-shell';
import {
  EVENT_FORM_SECTIONS,
  SERIES_FORM_TABS,
} from '@/lib/constants/admin-form-sections';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { DemoStatusAndMode } from './demo-status-and-mode';

export const metadata = { title: 'Form Shell Demo' };

export default async function FormShellDemoPage() {
  const { session } = await getSession();
  if (!session) redirect('/auth/login?redirect=/admin/design');
  if (!isSuperAdmin(session.email)) redirect('/admin');

  // Mock dirty state for the TOC
  const mockDirtyBySection = {
    basics: true,
    when: false,
    where: true,
    who: false,
    audience: false,
    vibe: false,
    money: false,
    series: false,
    system: false,
    danger: false,
  };

  const accentHex = getCategoryColor('music').accent;

  return (
    <div>
      <CommandBar
        backHref="/admin"
        backLabel="Admin"
        title="Demo: Form Shell Primitives"
        badges={
          <>
            <ShapeBadge seriesId={null} parentEventId={null} childEventCount={0} hours={null} compact />
            <StatusPill status="pending_review" />
          </>
        }
        actions={<DemoStatusAndMode />}
      />

      <div className="px-6 py-6 space-y-6 max-w-7xl">
        <HeroCard
          accentHex={accentHex}
          imageUrl={null}
          imageAlt="Mock event"
          badges={
            <>
              <ShapeBadge seriesId={null} parentEventId={null} childEventCount={0} hours={null} compact />
              <StatusPill status="pending_review" />
            </>
          }
          headerRight={
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Preview
            </Button>
          }
          title="Mock Concert at Cactus Club"
          subtitle={
            <>
              <span>Sat · Apr 4 · 7:00 PM CT</span>
              <span>Cactus Club · Bay View, MI</span>
              <span>Hosted by Foo Music</span>
            </>
          }
          footer={
            <>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentHex }} />
                Music
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald/15 text-emerald text-[11px] font-medium">
                Free
              </span>
            </>
          }
        />

        <QuickChecklist
          items={[
            { key: 'image', label: 'Has image', ok: false, jumpTo: 'basics' },
            { key: 'short', label: 'Short description', ok: true, jumpTo: 'basics' },
            { key: 'date', label: 'Date in future', ok: true, jumpTo: 'when' },
            { key: 'venue', label: 'Has venue', ok: true, jumpTo: 'where' },
            { key: 'category', label: 'Has category', ok: false, jumpTo: 'basics' },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-6 items-start">
          <SectionTOC sections={EVENT_FORM_SECTIONS} dirtyBySection={mockDirtyBySection} />

          <div className="space-y-4 min-w-0">
            {EVENT_FORM_SECTIONS.map((s) => (
              <FormSection
                key={s.id}
                id={s.id}
                title={s.label}
                description={s.description}
                icon={s.icon}
                accent={s.accent}
                dirtyCount={mockDirtyBySection[s.id as keyof typeof mockDirtyBySection] ? 2 : 0}
                defaultOpen={s.defaultOpen}
                storageScope="demo"
              >
                <div className="text-sm text-zinc">
                  Section content for <code className="px-1 bg-cloud rounded">{s.id}</code>.
                  Replace with the real fields in Phase B.
                </div>
              </FormSection>
            ))}
          </div>

          <aside className="space-y-4">
            <WhatChangedCard
              changes={[
                { key: 'title', label: 'Title', section: 'basics', before: 'Old name', after: 'New name' },
                { key: 'venue', label: 'Venue', section: 'where', before: 'Other venue', after: 'Cactus Club' },
              ]}
            />
            <div className="rounded-xl border border-mist bg-pure p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc mb-3">
                Series tabs preview
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {SERIES_FORM_TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cloud/60 text-xs"
                    >
                      <Icon className="w-3 h-3" />
                      {t.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border border-mist bg-pure p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc">
                Status palette
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status="draft" />
                <StatusPill status="pending_review" />
                <StatusPill status="changes_requested" />
                <StatusPill status="published" />
                <StatusPill status="rejected" />
                <StatusPill status="cancelled" />
              </div>
            </div>
          </aside>
        </div>

        <div className="rounded-xl border border-mist bg-pure p-6 space-y-3">
          <p className="text-sm font-semibold text-ink">Demo footer actions</p>
          <div className="flex items-center justify-between">
            <Button variant="secondary" className="gap-2 text-rose hover:bg-rose/10">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Re-fetch
              </Button>
              <Button className="gap-2 bg-blue hover:bg-blue/90 text-white">
                <Save className="w-4 h-4" />
                Save changes (2)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
