'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ImageViewer from '../components/ImageViewer';
import { downloadImage } from '../../lib/download';

interface UploadedImage {
  id: number;
  filename: string;
  original_name: string;
  size: number;
  upload_date: string;
  url: string;
}

export default function UploadedPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);

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
      } else {
        setError(data.error || 'Failed to fetch images');
      }
    } catch (err) {
      setError('Failed to fetch images: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async (imageId: number, imageName: string) => {
    if (!confirm(`Are you sure you want to delete "${imageName}"?`)) {
      return;
    }

    setDeletingId(imageId);
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Remove the deleted image from the state
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        // Close the viewer if the deleted image was being viewed
        setSelectedImage((prevSelected) => 
          prevSelected?.id === imageId ? null : prevSelected
        );
      } else {
        alert(data.error || 'Failed to delete image');
      }
    } catch (err) {
      alert('Failed to delete image: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleImageClick = useCallback((image: UploadedImage) => {
    setSelectedImage(image);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleDeleteFromViewer = useCallback(() => {
    if (selectedImage) {
      handleDelete(selectedImage.id, selectedImage.original_name);
    }
  }, [selectedImage, handleDelete]);

  const handleDownload = useCallback(async (imageUrl: string, imageName: string) => {
    await downloadImage(imageUrl, imageName);
  }, []);

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
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
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
            <div className="mb-4 text-gray-700 dark:text-gray-300">
              Total: {images.length} image{images.length > 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="image-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer relative group"
                >
                  {/* Delete button - top right, visible on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id, image.original_name);
                    }}
                    disabled={deletingId === image.id}
                    className="delete-overlay absolute top-2 right-2 z-10 p-2 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white transition-colors shadow-lg"
                    title="Delete image"
                  >
                    {deletingId === image.id ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                  
                  <div
                    className="relative h-48 bg-gray-100 dark:bg-gray-700"
                    onClick={() => handleImageClick(image)}
                  >
                    <Image
                      src={image.url}
                      alt={image.original_name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4" onClick={() => handleImageClick(image)}>
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
                  {/* Download button below image */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image.url, image.original_name);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                      title="Download image"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full screen image viewer */}
        {selectedImage && (
          <ImageViewer
            key={selectedImage.id}
            isOpen={!!selectedImage}
            imageUrl={selectedImage.url}
            imageName={selectedImage.original_name}
            onClose={handleCloseViewer}
            onDelete={handleDeleteFromViewer}
            isDeleting={deletingId === selectedImage.id}
          />
        )}
      </main>
    </div>
  );
}
