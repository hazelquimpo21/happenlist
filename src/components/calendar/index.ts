/**
 * CALENDAR COMPONENTS — BARREL EXPORTS
 * =====================================
 * Central export point for the calendar module.
 */

// Types
export type {
  DisplayItem,
  DisplayAction,
  DisplayCategory,
  CommitmentLevel,
  DisplayActionType,
  DisplayItemSource,
  RecommendationEventType,
  DateEventType,
  TimeGroup,
} from './display-item.types';

export {
  RECOMMENDATION_EVENT_TYPES,
  DATE_EVENT_TYPES,
} from './display-item.types';

// Utilities
export {
  toDisplayItems,
  sortDisplayItems,
  groupByTimePeriod,
  buildTimeline,
} from './smart-timeline.utils';

export type {
  RawCalendarEvent,
  RawEmailEvent,
} from './smart-timeline.utils';
