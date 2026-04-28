/**
 * ADMIN FORM SHELL — barrel
 * ==========================
 * Shared primitives used by the admin Edit Event and Edit Series pages.
 * Pages compose these — they don't render markup directly.
 *
 * @module components/admin/form-shell
 */

export { CommandBar } from './command-bar';
export { CommandBarStatusSelect } from './command-bar-status-select';
export { CompactToggle, useEditMode, type EditMode } from './compact-toggle';
export { DirtyDot } from './dirty-dot';
export { FieldRow, inputClass } from './field-row';
export { FormSection } from './form-section';
export { HeroCard } from './hero-card';
export { InlineEditText } from './inline-edit-text';
export { MiniCalendar, type MiniCalendarMark } from './mini-calendar';
export { QuickChecklist, type ChecklistItem } from './quick-checklist';
export { SectionTOC } from './section-toc';
export { StatusPill } from './status-pill';
export { TabBar } from './tab-bar';
export { WhatChangedCard } from './what-changed-card';
