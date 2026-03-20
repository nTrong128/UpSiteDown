'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudUpload,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  File as FileIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getFileCategory } from '@/lib/file-utils';
import ImageViewer from './components/ImageViewer';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const [selectedPreview, setSelectedPreview] = useState<{ name: string; url: string } | null>(null);

  /** Returns the appropriate icon for a file based on its MIME type. */
  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type || file.name);
    switch (category) {
      case 'image':
        return <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'video':
        return <FileVideo className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'audio':
        return <FileAudio className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'pdf':
      case 'document':
      case 'text':
        return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
      case 'archive':
        return <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />;
      default:
        return <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to handle duplicate filenames
  const handleDuplicateFilenames = (newFiles: File[], existingFiles: File[]): File[] => {
    const existingNames = new Set(existingFiles.map(f => f.name));
    
    return newFiles.map(file => {
      let fileName = file.name;
      let counter = 1;
      
      // Keep incrementing counter until we find a unique name
      while (existingNames.has(fileName)) {
        const lastDotIndex = file.name.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
        const extension = lastDotIndex > 0 ? file.name.substring(lastDotIndex) : '';
        fileName = `${nameWithoutExt}(${counter})${extension}`;
        counter++;
      }
      
      // Add the new name to the set
      existingNames.add(fileName);
      
      // If name changed, create a new File object with the new name
      if (fileName !== file.name) {
        return new File([file], fileName, { type: file.type });
      }
      return file;
    });
  };

  // Function to create preview URLs for image files
  const createPreviewUrls = (files: File[]): Map<string, string> => {
    const newPreviewUrls = new Map<string, string>();
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviewUrls.set(file.name, url);
      }
    });
    
    return newPreviewUrls;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    setSelectedFiles(prevFiles => {
      // Handle duplicate filenames
      const filesWithUniqueNames = handleDuplicateFilenames(acceptedFiles, prevFiles);
      
      // Combine with existing files
      const allFiles = [...prevFiles, ...filesWithUniqueNames];
      
      if (allFiles.length > 100) {
        setError('Maximum 100 files allowed at a time');
        const limitedFiles = allFiles.slice(0, 100);
        
        // Create preview URLs only for new files
        const newPreviews = createPreviewUrls(filesWithUniqueNames);
        setPreviewUrls(prev => new Map([...prev, ...newPreviews]));
        
        return limitedFiles;
      } else {
        // Create preview URLs only for new files
        const newPreviews = createPreviewUrls(filesWithUniqueNames);
        setPreviewUrls(prev => new Map([...prev, ...newPreviews]));
        
        return allFiles;
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
        // Get signed upload params from our server (tiny request, no file data)
        const signRes = await fetch('/api/cloudinary/sign-upload');
        if (!signRes.ok) {
          throw new Error(`Failed to get upload signature: ${signRes.status} ${signRes.statusText}`);
        }
        const { timestamp, signature, apiKey, cloudName, folder } = await signRes.json();

        // Upload the file directly to Cloudinary — bypasses serverless body-size limit
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);
        formData.append('folder', folder);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: 'POST', body: formData }
        );

        if (!cloudinaryRes.ok) {
          const errorData = await cloudinaryRes.json();
          throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await cloudinaryRes.json();
        completedUploads++;
        setUploadProgress(Math.round((completedUploads / totalFiles) * 100));
        return {
          originalName: file.name,
          size: data.bytes ?? file.size,
          url: data.secure_url,
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
        
        // Clean up preview URLs
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls(new Map());
        
        setTimeout(() => setUploadedCount(0), 3000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    
    // Revoke the preview URL for this file
    const previewUrl = previewUrls.get(fileToRemove.name);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      const newPreviewUrls = new Map(previewUrls);
      newPreviewUrls.delete(fileToRemove.name);
      setPreviewUrls(newPreviewUrls);
    }
    
    // Close preview if it's the file being removed
    if (selectedPreview?.name === fileToRemove.name) {
      setSelectedPreview(null);
    }
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreviewClick = useCallback((fileName: string) => {
    const url = previewUrls.get(fileName);
    if (url) {
      setSelectedPreview({ name: fileName, url });
    }
  }, [previewUrls]);

  const handleClosePreview = useCallback(() => {
    setSelectedPreview(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8 animate-slideDown">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Upload Your Files
          </h2>
          <p className="text-muted-foreground text-lg">
            Upload up to 100 files at once. Drag and drop, click to select, or paste (Ctrl+V).
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
                    Drop the files here...
                  </p>
                ) : (
                  <div>
                    <p className="text-xl font-medium text-foreground">
                      Drag and drop files here
                    </p>
                    <p className="text-muted-foreground mt-2">
                      or click to select files, or paste from clipboard (Ctrl+V)
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Any file type supported (max 100 files)
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
                <FileIcon className="h-5 w-5 text-primary" />
                Selected Files ({selectedFiles.length})
              </CardTitle>
              <CardDescription>
                Review your files before uploading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Image Preview */}
                      {previewUrls.has(file.name) ? (
                        <div 
                          className="shrink-0 w-12 h-12 rounded overflow-hidden bg-background border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => handlePreviewClick(file.name)}
                          title="Click to view fullscreen"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrls.get(file.name)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        getFileIcon(file)
                      )}
                      <span className="truncate text-foreground">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive hover:scale-110"
                        onClick={() => removeFile(index)}
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
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
                    Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
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
                  Successfully uploaded {uploadedCount} file{uploadedCount > 1 ? 's' : ''}!
                </span>
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

      {/* Full screen image viewer for preview */}
      {selectedPreview && (
        <ImageViewer
          isOpen={!!selectedPreview}
          imageUrl={selectedPreview.url}
          imageName={selectedPreview.name}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
