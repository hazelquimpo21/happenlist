'use client';

/**
 * Demo helper — small client island for the form-shell demo route. Hosts the
 * status select + compact toggle so the server page can stay otherwise
 * static.
 *
 * Uses local state for the compact toggle (NOT `useEditMode`) so demo
 * interactions don't pollute the real edit pages' localStorage preference.
 */

import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandBarStatusSelect,
  CompactToggle,
  type EditMode,
} from '@/components/admin/form-shell';
import type { EventStatus } from '@/lib/constants/admin-status-palette';

export function DemoStatusAndMode() {
  const [status, setStatus] = useState<EventStatus>('pending_review');
  const [mode, setMode] = useState<EditMode>('full');

  return (
    <>
      <CompactToggle value={mode} onChange={setMode} />
      <Button variant="ghost" size="sm" className="gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" />
        Re-fetch
      </Button>
      <CommandBarStatusSelect value={status} onChange={setStatus} />
      <Button size="sm" className="gap-1.5 bg-blue hover:bg-blue/90 text-white">
        <Save className="w-3.5 h-3.5" />
        Save (2)
      </Button>
    </>
  );
}
