/**
 * useUnsavedChangesGuard
 * =======================
 * Warns the user when they attempt to leave the page with unsaved form
 * changes. Listens to:
 *
 *   1. `beforeunload` for tab close / hard navigation / refresh
 *   2. `popstate` for in-app browser-back navigation (best-effort — Next.js
 *      App Router does not expose a clean route-leave intercept yet, so we
 *      block the popstate and re-push if the user cancels)
 *
 * Caller passes a boolean that flips true when the form is dirty and false
 * after a successful save. The hook is a no-op when dirty is false.
 *
 * @module lib/admin/use-unsaved-changes-guard
 */
import { useEffect } from 'react';

export function useUnsavedChangesGuard(
  isDirty: boolean,
  message: string = 'You have unsaved changes. Leave anyway?',
) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers ignore custom strings but still show a generic
      // confirm. Setting returnValue is what triggers it.
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    const handlePopState = () => {
      const ok = window.confirm(message);
      if (!ok) {
        // Re-push current state to undo the back navigation. Imperfect (the
        // history stack still moved) but it visually keeps the user on the
        // page, and they can navigate away cleanly once they save.
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, message]);
}
