'use client';

import { useEffect, useState, useRef } from 'react';
import { Copy, Trash2, Plus, Loader2, AlertCircle, Check, ClipboardList } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';

interface StoredText {
  id: number;
  content: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClipboardPage() {
  const [texts, setTexts] = useState<StoredText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function fetchTexts() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/texts');
      if (!res.ok) throw new Error('Failed to load texts');
      const data = await res.json();
      setTexts(data.texts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTexts();
  }, []);

  async function handleSave() {
    if (!input.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      const data = await res.json();
      setTexts((prev) => [data.text, ...prev]);
      setInput('');
      textareaRef.current?.focus();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/texts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTexts((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setDeleteError('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCopy(text: StoredText) {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(text.content);
      setCopiedId(text.id);
      setTimeout(() => setCopiedId((prev) => (prev === text.id ? null : prev)), 1500);
    } catch {
      setCopyError('Copy failed. Please copy the text manually.');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-indigo-500" />
            Clipboard
          </h1>
          <p className="mt-2 text-muted-foreground">Store and copy text snippets.</p>
        </div>

        {/* Input area */}
        <div className="rounded-xl border bg-card p-4 shadow-sm mb-8">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type your text here…"
            rows={6}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          />
          {saveError && (
            <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {saveError}
            </p>
          )}
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !input.trim()}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Saved texts list */}
        {(deleteError || copyError) && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {deleteError ?? copyError}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-lg font-medium text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchTexts}>Retry</Button>
          </div>
        ) : texts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 opacity-40" />
            <p className="text-lg font-medium">No saved texts yet</p>
            <p className="text-sm">Type something above and click Save.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {texts.map((text) => (
              <li
                key={text.id}
                className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3"
              >
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-sans leading-relaxed max-h-64 overflow-y-auto">
                  {text.content}
                </pre>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{formatDate(text.created_at)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(text)}
                      className="flex items-center gap-1"
                    >
                      {copiedId === text.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(text.id)}
                      disabled={deletingId === text.id}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      {deletingId === text.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
