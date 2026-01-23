'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const SUCCESS_MESSAGE_DURATION = 3000;

interface UploadedImage {
  id: number;
  filename: string;
  original_name: string;
  size: number;
  upload_date: string;
  data: string;
}

export default function UploadedPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/images');
      const data = await response.json();

      if (response.ok) {
        setImages(data.images);
        setSelectedIds(new Set()); // Clear selection when fetching
      } else {
        setError(data.error || 'Failed to fetch images');
      }
    } catch (err) {
      setError('Failed to fetch images: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)));
    }
  };

  const handleDeleteSingle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    setDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Image deleted successfully');
        setImages((prev) => prev.filter((img) => img.id !== id));
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_DURATION);
      } else {
        setError(data.error || 'Failed to delete image');
      }
    } catch (err) {
      setError('Failed to delete image: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} image(s)?`)) return;

    setDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Deleted ${data.deletedCount} image(s) successfully`);
        setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
        setSelectedIds(new Set());
        setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_DURATION);
      } else {
        setError(data.error || 'Failed to delete images');
      }
    } catch (err) {
      setError('Failed to delete images: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleting(false);
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
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Upload
              </Link>
              <Link
                href="/uploaded"
                className="text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700"
              >
                Uploaded Images
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Uploaded Images
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            All your uploaded images are stored here
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading images...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
              No images uploaded yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Upload some images to see them here
            </p>
            <Link
              href="/"
              className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Upload Images
            </Link>
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <div>
            {/* Bulk Actions Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === images.length && images.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    Select All
                  </span>
                </label>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : `Total: ${images.length} image${images.length > 1 ? 's' : ''}`}
                </span>
              </div>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? 'Deleting...' : `Delete ${selectedIds.size} Selected`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative ${
                    selectedIds.has(image.id) ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {/* Checkbox for selection */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(image.id)}
                      onChange={() => handleSelectImage(image.id)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteSingle(image.id)}
                    disabled={deleting}
                    className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-1.5 rounded-full transition-colors"
                    title="Delete image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={image.data}
                      alt={image.original_name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {image.original_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(image.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(image.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
