'use client';

import { useEffect, useState, useRef } from 'react';
import { Copy, Trash2, Plus, Loader2, AlertCircle, Check, ClipboardList, Calendar } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8 animate-slideDown">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Clipboard
          </h2>
          <p className="text-muted-foreground text-lg">Store and copy text snippets.</p>
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

        {/* Error banners */}
        {(deleteError || copyError) && (
          <Card className="border-destructive/50 bg-destructive/10 animate-scaleIn mb-4">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{deleteError ?? copyError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-16 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Loading your snippets...</p>
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/10 animate-scaleIn">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
              <Button variant="outline" className="mt-3" onClick={fetchTexts}>Retry</Button>
            </CardContent>
          </Card>
        ) : texts.length === 0 ? (
          <Card className="max-w-md mx-auto animate-scaleIn">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <ClipboardList className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No saved texts yet</h3>
              <p className="text-muted-foreground">Type something above and click Save.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="animate-slideUp">
            <div className="mb-6">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{texts.length}</span> snippet{texts.length > 1 ? 's' : ''} saved
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-stagger">
              {texts.map((text) => (
                <Card
                  key={text.id}
                  className="overflow-hidden group relative"
                >
                  {/* Delete button — top-right hover overlay */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="delete-overlay absolute top-2 right-2 z-10 h-8 w-8 shadow-lg"
                    onClick={() => handleDelete(text.id)}
                    disabled={deletingId === text.id}
                    title="Delete snippet"
                  >
                    {deletingId === text.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>

                  <CardContent className="pt-4 pb-3">
                    <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-sans leading-relaxed max-h-40 overflow-y-auto mb-3">
                      {text.content}
                    </pre>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(text.created_at)}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCopy(text)}
                    >
                      {copiedId === text.id ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
