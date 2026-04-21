'use client';

/**
 * EVENT IMAGE EDITOR
 * ==================
 * Image upload control for the superadmin event edit form.
 *
 * Two upload paths:
 * - File picker: reads the chosen file as base64, POSTs to the API
 * - URL paste: POSTs the URL as `sourceUrl`, server-side fetches + re-hosts
 *
 * The API returns a Supabase /render/image/ URL with width/quality params,
 * so the previewed and saved URL is already resize+WebP-ready. The component
 * only manages working state — saving image_url to the DB happens through
 * the parent form's main Save button.
 *
 * Coupling:
 * - POST /api/superadmin/events/[id]/image — upload endpoint
 * - parent form holds image_url in formState and includes it in the diff
 */

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';

interface EventImageEditorProps {
  eventId: string;
  value: string;
  onChange: (next: string) => void;
}

const MAX_CLIENT_FILE_BYTES = 5 * 1024 * 1024; // mirror server cap

export function EventImageEditor({ eventId, value, onChange }: EventImageEditorProps) {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBase64 = useCallback(
    async (base64: string) => {
      setIsUploading(true);
      setError(null);
      try {
        const response = await fetch(`/api/superadmin/events/${eventId}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64 }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }
        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [eventId, onChange]
  );

  const uploadUrl = useCallback(
    async (sourceUrl: string) => {
      setIsUploading(true);
      setError(null);
      try {
        const response = await fetch(`/api/superadmin/events/${eventId}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }
        onChange(data.url);
        setUrlInput('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [eventId, onChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_CLIENT_FILE_BYTES) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max 5 MB)`);
        e.target.value = '';
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          uploadBase64(result);
        }
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsDataURL(file);

      // reset so the same file can be re-picked after a remove
      e.target.value = '';
    },
    [uploadBase64]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">Event Image</p>
        <p className="text-[11px] text-zinc">
          Auto-resized to max 1600px wide · WebP-served when supported
        </p>
      </div>

      {/* Preview */}
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-mist bg-cloud/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Event hero"
            className="w-full max-h-72 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={isUploading}
            className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-pure/90 backdrop-blur text-xs font-medium text-red-600 hover:bg-pure shadow-sm border border-mist disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-mist bg-cloud/20 p-6 text-center">
          <ImagePlus className="w-8 h-8 text-zinc mx-auto mb-2" />
          <p className="text-sm text-zinc">No image yet</p>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex border border-mist rounded-lg overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 transition-colors ${
            mode === 'file' ? 'bg-blue text-white' : 'bg-pure text-zinc hover:bg-cloud'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 transition-colors ${
            mode === 'url' ? 'bg-blue text-white' : 'bg-pure text-zinc hover:bg-cloud'
          }`}
        >
          <Link2 className="w-4 h-4" />
          From URL
        </button>
      </div>

      {/* Mode body */}
      {mode === 'file' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-zinc file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-cloud file:text-ink hover:file:bg-mist disabled:opacity-50"
          />
          <p className="text-[11px] text-zinc mt-1">
            JPG, PNG, WebP, or GIF — up to 5 MB
          </p>
        </div>
      )}

      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={isUploading}
            className="flex-1 px-3 py-2 border border-mist rounded-lg text-sm focus:border-blue focus:ring-1 focus:ring-blue outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => urlInput.trim() && uploadUrl(urlInput.trim())}
            disabled={isUploading || !urlInput.trim()}
            className="px-4 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Re-host
          </button>
        </div>
      )}

      {/* Status */}
      {isUploading && mode === 'file' && (
        <p className="text-xs text-zinc flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Uploading…
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
