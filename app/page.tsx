'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileImage, CheckCircle2, AlertCircle, Loader2, X, ImageDown } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { resizeImageIfNeeded, MAX_FILE_SIZE } from '@/lib/image-resize';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [resizeNotice, setResizeNotice] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setResizeNotice(null);
    
    // Check for oversized files
    const oversizedFiles = acceptedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).slice(0, 3);
      const moreCount = oversizedFiles.length - 3;
      const message = moreCount > 0 
        ? `${fileNames.join(', ')} and ${moreCount} more will be resized to fit 4MB limit`
        : `${fileNames.join(', ')} will be resized to fit 4MB limit`;
      setResizeNotice(message);
    }
    
    if (acceptedFiles.length > 100) {
      setError('Maximum 100 images allowed at a time');
      setSelectedFiles(acceptedFiles.slice(0, 100));
    } else {
      setSelectedFiles(acceptedFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 100,
  });

  // Handle Ctrl+V paste for image uploads
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardItems = event.clipboardData?.items;
      if (!clipboardItems) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        event.preventDefault();
        onDrop(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [onDrop]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let completedUploads = 0;

      // Upload files to Cloudinary in parallel with concurrency limit
      const CONCURRENCY_LIMIT = 5;
      const uploadedFiles: { originalName: string; size: number; url: string }[] = [];
      
      const uploadFile = async (file: File) => {
        // Resize image if needed
        const { file: processedFile } = await resizeImageIfNeeded(file);
        
        // Upload to Cloudinary via our API
        const formData = new FormData();
        formData.append('file', processedFile);
        
        const res = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const data = await res.json();
        completedUploads++;
        setUploadProgress(Math.round((completedUploads / totalFiles) * 100));
        return {
          originalName: file.name,
          size: processedFile.size,
          url: data.url,
        };
      };

      // Process files in batches for parallel uploads
      for (let i = 0; i < selectedFiles.length; i += CONCURRENCY_LIMIT) {
        const batch = selectedFiles.slice(i, i + CONCURRENCY_LIMIT);
        const results = await Promise.all(batch.map(uploadFile));
        uploadedFiles.push(...results);
      }

      // Save metadata to database
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: uploadedFiles }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedCount(data.count);
        setSelectedFiles([]);
        setUploadProgress(0);
        setResizeNotice(null);
        setTimeout(() => setUploadedCount(0), 3000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Format file size errors to be human readable (e.g., "Max size is 4194304" -> "Max size is 4MB")
      const formattedMessage = errorMessage.replace(
        /Max size is (\d+)$/,
        (_, bytes) => `Max size is ${Math.round(parseInt(bytes, 10) / (1024 * 1024))}MB`
      );
      setError('Upload failed: ' + formattedMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8 animate-slideDown">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Upload Your Images
          </h2>
          <p className="text-muted-foreground text-lg">
            Upload up to 100 images at once. Drag and drop, click to select, or paste (Ctrl+V).
          </p>
        </div>

        {/* Dropzone Card */}
        <Card className="animate-slideUp">
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={cn(
                "dropzone border-2 border-dashed rounded-xl p-12 text-center cursor-pointer",
                isDragActive && "active border-primary bg-primary/10"
              )}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className={cn(
                  "mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300",
                  isDragActive && "scale-110"
                )}>
                  <CloudUpload className={cn(
                    "h-10 w-10 text-primary transition-transform duration-300",
                    isDragActive && "animate-bounce"
                  )} />
                </div>
                {isDragActive ? (
                  <p className="text-xl text-primary font-medium animate-pulse">
                    Drop the images here...
                  </p>
                ) : (
                  <div>
                    <p className="text-xl font-medium text-foreground">
                      Drag and drop images here
                    </p>
                    <p className="text-muted-foreground mt-2">
                      or click to select files, or paste from clipboard (Ctrl+V)
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, GIF, WebP (max 100 files, 4MB per file)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <Card className="mt-6 animate-scaleIn">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-primary" />
                Selected Files ({selectedFiles.length})
              </CardTitle>
              <CardDescription>
                Review your files before uploading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate text-foreground">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              {uploading && uploadProgress > 0 && (
                <div className="mb-4 animate-fadeIn">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2 text-center flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-4 w-4" />
                    Upload {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {uploadedCount > 0 && (
          <Card className="mt-6 border-green-500/50 bg-green-500/10 animate-scaleIn">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Successfully uploaded {uploadedCount} image{uploadedCount > 1 ? 's' : ''}!
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resize Notice */}
        {resizeNotice && (
          <Card className="mt-6 border-blue-500/50 bg-blue-500/10 animate-scaleIn">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <ImageDown className="h-5 w-5" />
                <span className="font-medium">{resizeNotice}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mt-6 border-destructive/50 bg-destructive/10 animate-scaleIn">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
