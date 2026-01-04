/**
 * SUBMIT DATA MODULE
 * ===================
 * Data functions for the event submission flow.
 *
 * @module data/submit
 */

// Draft management
export {
  createDraft,
  updateDraft,
  getDraft,
  getUserDrafts,
  deleteDraft,
} from './draft-actions';
export type { CreateDraftParams, UpdateDraftParams, DraftResult } from './draft-actions';

// Event submission
export { submitEvent, resubmitEvent } from './submit-event';
export type { SubmitEventParams, SubmitEventResult } from './submit-event';

// User submissions
export {
  getUserSubmissions,
  getSubmissionById,
  getSubmissionCounts,
  getSubmissionsNeedingAction,
  getRecentSubmissions,
} from './get-submissions';
export type { GetSubmissionsParams, SubmissionsResult } from './get-submissions';

// Series search
export { searchSeries, getRecentSeries, getSeriesForLink } from './search-series';
export type { SeriesSearchResult, SearchSeriesParams } from './search-series';
