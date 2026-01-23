'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { useEdgeStore } from '@/lib/edgestore-context';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { edgestore } = useEdgeStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadedFiles: { originalName: string; size: number; url: string }[] = [];
      const totalFiles = selectedFiles.length;

      // Upload files to Edge Store
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Upload to Edge Store
        const res = await edgestore.publicFiles.upload({
          file,
        });

        uploadedFiles.push({
          originalName: file.name,
          size: file.size,
          url: res.url,
        });

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                UpSiteDown
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700"
              >
                Upload
              </Link>
              <Link
                href="/uploaded"
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Uploaded Images
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Your Images
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Upload up to 100 images at once. Drag and drop or click to select.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-4 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {isDragActive ? (
              <p className="text-xl text-indigo-600 dark:text-indigo-400 font-medium">
                Drop the images here...
              </p>
            ) : (
              <div>
                <p className="text-xl text-gray-700 dark:text-gray-300 font-medium">
                  Drag and drop images here
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  or click to select files from your computer
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF, WebP (max 100 files, 10MB per file)
            </p>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 py-1"
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="ml-4 text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            {uploading && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Success Message */}
        {uploadedCount > 0 && (
          <div className="mt-6 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            Successfully uploaded {uploadedCount} image{uploadedCount > 1 ? 's' : ''}!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
