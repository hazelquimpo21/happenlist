/**
 * InlineEditText
 * ===============
 * Click-to-edit text wrapper. Shows the value as styled text by default;
 * clicking (or Enter/Space-keyboard activation) flips it into an input.
 *
 * Behaviors:
 *   - Esc cancels and reverts to the saved value
 *   - Enter (single-line) or Cmd+Enter (multiline) saves
 *   - Blur saves
 *   - Empty value handling left to the caller (it can validate in onSave)
 *
 * Designed for the hero card on admin edit pages — fix a typo in the title
 * without scrolling to the form below.
 *
 * @module components/admin/form-shell/inline-edit-text
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onSave: (next: string) => void;
  /** Optional async save indicator. */
  saving?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Aria label when the static value is empty. */
  emptyLabel?: string;
}

export function InlineEditText({
  value,
  onSave,
  saving = false,
  multiline = false,
  placeholder,
  className,
  inputClassName,
  emptyLabel = 'Click to edit',
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'group inline-flex items-start gap-2 text-left rounded -mx-1 px-1 hover:bg-cloud/40 transition-colors',
          className,
        )}
      >
        <span className={cn(value ? '' : 'italic text-silver')}>
          {value || emptyLabel}
        </span>
        <Pencil className="w-3.5 h-3.5 text-silver opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 shrink-0" />
      </button>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
        }}
        rows={3}
        placeholder={placeholder}
        disabled={saving}
        className={cn(
          'w-full px-2 py-1 -mx-2 -my-1 border border-blue rounded-md bg-pure text-ink',
          'focus:ring-2 focus:ring-blue/30 outline-none resize-none',
          inputClassName,
        )}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancel();
        if (e.key === 'Enter') commit();
      }}
      placeholder={placeholder}
      disabled={saving}
      className={cn(
        'inline-block px-2 py-1 -mx-2 -my-1 border border-blue rounded-md bg-pure text-ink',
        'focus:ring-2 focus:ring-blue/30 outline-none w-full',
        inputClassName,
      )}
    />
  );
}
