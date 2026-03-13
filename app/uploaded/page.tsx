'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Upload,
  ZoomIn,
  Calendar,
  HardDrive,
  CheckSquare,
  Square,
  X,
  Search,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  File as FileIcon,
  FolderOpen,
} from 'lucide-react';
import ImageViewer from '../components/ImageViewer';
import VideoViewer from '../components/VideoViewer';
import { downloadFile } from '../../lib/download';
import { getFileCategoryFromUrl, getCategoryLabel, type FileCategory } from '@/lib/file-types';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface UploadedFile {
  id: number;
  filename: string;
  original_name: string;
  size: number;
  upload_date: string;
  url: string;
}

const CATEGORY_FILTERS: { value: FileCategory | 'all'; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'image',    label: 'Images' },
  { value: 'video',    label: 'Videos' },
  { value: 'audio',    label: 'Audio' },
  { value: 'pdf',      label: 'PDFs' },
  { value: 'document', label: 'Docs' },
  { value: 'archive',  label: 'Archives' },
];

/**
 * Next.js Image with an automatic icon fallback when the image fails to load
 * (e.g. broken URL, CORS error, or the asset was deleted from Cloudinary).
 */
function ImageWithFallback({
  src,
  alt,
  fileName,
  category,
}: {
  src: string;
  alt: string;
  fileName: string;
  category: FileCategory;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <FileThumbnail category={category} fileName={fileName} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-contain transition-transform duration-300 group-hover:scale-105"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={() => setFailed(true)}
    />
  );
}

/** Icon + colour for non-image file category thumbnails */
function FileThumbnail({ category, fileName }: { category: FileCategory; fileName: string }) {
  const cfg: Record<FileCategory, { icon: React.ElementType; bg: string; text: string; label: string }> = {
    video:    { icon: FileVideo,   bg: 'bg-blue-500/10',   text: 'text-blue-500',   label: 'VIDEO' },
    audio:    { icon: FileAudio,   bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'AUDIO' },
    pdf:      { icon: FileText,    bg: 'bg-red-500/10',    text: 'text-red-500',    label: 'PDF' },
    document: { icon: FileText,    bg: 'bg-sky-500/10',    text: 'text-sky-500',    label: 'DOC' },
    archive:  { icon: FileArchive, bg: 'bg-amber-500/10',  text: 'text-amber-500',  label: 'ZIP' },
    other:    { icon: FileIcon,        bg: 'bg-muted',         text: 'text-muted-foreground', label: 'FILE' },
    // 'image' is a valid fallback: ImageWithFallback passes category='image' here when the image fails to load
    image:    { icon: FileIcon,        bg: 'bg-muted',         text: 'text-muted-foreground', label: 'IMG' },
  };
  const { icon: Icon, bg, text, label } = cfg[category] ?? cfg.other;
  const ext = fileName.split('.').pop()?.toUpperCase() ?? label;
  return (
    <div className={`flex flex-col items-center justify-center h-full gap-2 ${bg}`}>
      <Icon className={`h-10 w-10 ${text}`} />
      <span className={`text-xs font-bold uppercase tracking-wider ${text}`}>{ext}</span>
    </div>
  );
}

export default function UploadedPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FileCategory | 'all'>('all');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/images');
      const data = await response.json();

      if (response.ok) {
        setFiles(data.images);
      } else {
        setError(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError('Failed to fetch files: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  /** Filtered + searched list derived from full file list */
  const displayedFiles = useMemo(() => {
    return files.filter(file => {
      const category = getFileCategoryFromUrl(file.url, file.original_name);
      const matchesCategory = filterCategory === 'all' || category === filterCategory;
      const matchesSearch = file.original_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [files, filterCategory, searchQuery]);

  const handleDelete = useCallback(async (fileId: number, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeletingId(fileId);
    try {
      const response = await fetch(`/api/images/${fileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        setSelectedFile((prev) => prev?.id === fileId ? null : prev);
      } else {
        alert(data.error || 'Failed to delete file');
      }
    } catch (err) {
      alert('Failed to delete file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleFileClick = useCallback((file: UploadedFile) => {
    const category = getFileCategoryFromUrl(file.url, file.original_name);
    if (category === 'image' || category === 'video') {
      setSelectedFile(file);
    } else if (category === 'pdf' || category === 'audio') {
      window.open(file.url, '_blank');
    } else {
      downloadFile(file.url, file.original_name);
    }
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleDeleteFromViewer = useCallback(() => {
    if (selectedFile) {
      handleDelete(selectedFile.id, selectedFile.original_name);
    }
  }, [selectedFile, handleDelete]);

  const handleDownload = useCallback(async (fileUrl: string, fileName: string) => {
    await downloadFile(fileUrl, fileName);
  }, []);

  // Selection handlers
  const toggleSelection = useCallback((fileId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allDisplayedSelected = displayedFiles.length > 0 && displayedFiles.every(f => selectedIds.has(f.id));
    if (allDisplayedSelected) {
      // Deselect all currently displayed files (keep any outside the current filter)
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        displayedFiles.forEach(f => newSet.delete(f.id));
        return newSet;
      });
    } else {
      // Select all currently displayed files
      setSelectedIds(prev => new Set([...prev, ...displayedFiles.map(f => f.id)]));
    }
  }, [displayedFiles, selectedIds]);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
    setBulkDeleteError(null);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    setBulkDeleteError(null);
    const idsToDelete = Array.from(selectedIds);
    const failedDeletes: number[] = [];

    try {
      await Promise.all(
        idsToDelete.map(async (fileId) => {
          try {
            const response = await fetch(`/api/images/${fileId}`, {
              method: 'DELETE',
            });
            if (!response.ok) {
              failedDeletes.push(fileId);
            }
          } catch {
            failedDeletes.push(fileId);
          }
        })
      );

      const successfullyDeleted = idsToDelete.filter(id => !failedDeletes.includes(id));
      setFiles(prev => prev.filter(f => !successfullyDeleted.includes(f.id)));
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      setIsSelectMode(false);

      if (failedDeletes.length > 0) {
        setBulkDeleteError(`Failed to delete ${failedDeletes.length} file(s). Please try again.`);
      }
    } catch (err) {
      setBulkDeleteError('Failed to delete files: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setShowBulkDeleteDialog(false);
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds]);

  const selectedFileCategory = selectedFile
    ? getFileCategoryFromUrl(selectedFile.url, selectedFile.original_name)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8 animate-slideDown">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Your Files
          </h2>
          <p className="text-muted-foreground text-lg">
            All your uploaded files are stored here
          </p>
        </div>

        {loading && (
          <div className="text-center py-16 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Loading your files...</p>
          </div>
        )}

        {error && (
          <Card className="border-destructive/50 bg-destructive/10 animate-scaleIn">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {bulkDeleteError && (
          <Card className="border-destructive/50 bg-destructive/10 animate-scaleIn mb-4">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{bulkDeleteError}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setBulkDeleteError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && files.length === 0 && (
          <Card className="max-w-md mx-auto animate-scaleIn">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <FolderOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No files uploaded yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Upload some files to see them here
              </p>
              <Button asChild>
                <Link href="/" className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && files.length > 0 && (
          <div className="animate-slideUp">
            {/* ── Search + Filter bar ── */}
            <div className="mb-6 flex flex-col gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by file name…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category filter chips */}
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_FILTERS.map(({ value, label }) => {
                  const count = value === 'all'
                    ? files.length
                    : files.filter(f => getFileCategoryFromUrl(f.url, f.original_name) === value).length;
                  if (value !== 'all' && count === 0) return null;
                  return (
                    <button
                      key={value}
                      onClick={() => setFilterCategory(value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                        filterCategory === value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {label}
                      <span className={`ml-1.5 text-xs ${filterCategory === value ? 'opacity-80' : 'opacity-60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <p className="text-muted-foreground">
                {displayedFiles.length !== files.length ? (
                  <>
                    Showing <span className="font-medium text-foreground">{displayedFiles.length}</span> of{' '}
                    <span className="font-medium text-foreground">{files.length}</span> files
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">{files.length}</span>{' '}
                    file{files.length > 1 ? 's' : ''} in gallery
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                {isSelectMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2"
                    >
                      {displayedFiles.length > 0 && displayedFiles.every(f => selectedIds.has(f.id)) ? (
                        <>
                          <CheckSquare className="h-4 w-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4" />
                          Select All
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteDialog(true)}
                      disabled={selectedIds.size === 0}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete ({selectedIds.size})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exitSelectMode}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectMode(true)}
                    className="flex items-center gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Select
                  </Button>
                )}
              </div>
            </div>

            {/* ── Empty filtered state ── */}
            {displayedFiles.length === 0 && (
              <Card className="max-w-md mx-auto animate-scaleIn">
                <CardContent className="pt-12 pb-8 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No files match your filter</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting the search or category filter.</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── File grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-stagger">
              {displayedFiles.map((file) => {
                const category = getFileCategoryFromUrl(file.url, file.original_name);
                return (
                  <Card
                    key={file.id}
                    className={`image-card overflow-hidden cursor-pointer group relative ${
                      selectedIds.has(file.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                    }`}
                  >
                    {/* Checkbox - visible in select mode */}
                    {isSelectMode && (
                      <div 
                        className="absolute top-2 left-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(file.id)}
                          onCheckedChange={() => toggleSelection(file.id)}
                          className="shadow-lg bg-background"
                        />
                      </div>
                    )}
                    
                    {/* Delete button */}
                    {!isSelectMode && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="delete-overlay absolute top-2 right-2 z-10 h-8 w-8 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id, file.original_name);
                        }}
                        disabled={deletingId === file.id}
                        title="Delete file"
                      >
                        {deletingId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {/* Thumbnail area */}
                    <div
                      className="relative h-48 bg-muted dark:bg-muted/50"
                      onClick={() => isSelectMode ? toggleSelection(file.id) : handleFileClick(file)}
                    >
                      {category === 'image' ? (
                        <>
                          <ImageWithFallback
                            src={file.url}
                            alt={file.original_name}
                            fileName={file.original_name}
                            category={category}
                          />
                          {!isSelectMode && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                                <ZoomIn className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <FileThumbnail category={category} fileName={file.original_name} />
                      )}

                      {/* Selection overlay */}
                      {isSelectMode && selectedIds.has(file.id) && (
                        <div className="absolute inset-0 bg-primary/10 transition-all duration-300" />
                      )}
                    </div>

                    <CardContent 
                      className="py-3 cursor-pointer" 
                      onClick={() => isSelectMode ? toggleSelection(file.id) : handleFileClick(file)}
                    >
                      <h3 className="text-sm font-medium truncate mb-1">
                        {file.original_name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          {getCategoryLabel(category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(file.upload_date).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.url, file.original_name);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Image viewer */}
        {selectedFile && selectedFileCategory === 'image' && (
          <ImageViewer
            key={selectedFile.id}
            isOpen
            imageUrl={selectedFile.url}
            imageName={selectedFile.original_name}
            onClose={handleCloseViewer}
            onDelete={handleDeleteFromViewer}
            isDeleting={deletingId === selectedFile.id}
          />
        )}

        {/* Video viewer */}
        {selectedFile && selectedFileCategory === 'video' && (
          <VideoViewer
            key={selectedFile.id}
            isOpen
            fileUrl={selectedFile.url}
            fileName={selectedFile.original_name}
            onClose={handleCloseViewer}
            onDelete={handleDeleteFromViewer}
            isDeleting={deletingId === selectedFile.id}
          />
        )}

        {/* Bulk delete confirmation dialog */}
        <ConfirmDialog
          isOpen={showBulkDeleteDialog}
          title="Delete Selected Files"
          message={`Are you sure you want to delete ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          loadingText="Deleting..."
          variant="destructive"
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteDialog(false)}
          isLoading={isBulkDeleting}
        />
      </main>
    </div>
  );
}

