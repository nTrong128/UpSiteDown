'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Trash2, 
  ImageIcon, 
  Loader2, 
  AlertCircle, 
  Upload,
  ZoomIn,
  Calendar,
  HardDrive
} from 'lucide-react';
import ImageViewer from '../components/ImageViewer';
import { downloadImage } from '../../lib/download';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8 animate-slideDown">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Your Gallery
          </h2>
          <p className="text-muted-foreground text-lg">
            All your uploaded images are stored here
          </p>
        </div>

        {loading && (
          <div className="text-center py-16 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Loading your images...</p>
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

        {!loading && !error && images.length === 0 && (
          <Card className="max-w-md mx-auto animate-scaleIn">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No images uploaded yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Upload some images to see them here
              </p>
              <Button asChild>
                <Link href="/" className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Images
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && images.length > 0 && (
          <div className="animate-slideUp">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{images.length}</span> image{images.length > 1 ? 's' : ''} in gallery
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-stagger">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className="image-card overflow-hidden cursor-pointer group"
                >
                  {/* Delete button - top right, visible on hover */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="delete-overlay absolute top-2 right-2 z-10 h-8 w-8 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id, image.original_name);
                    }}
                    disabled={deletingId === image.id}
                    title="Delete image"
                  >
                    {deletingId === image.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div
                    className="relative h-48 bg-muted"
                    onClick={() => handleImageClick(image)}
                  >
                    <Image
                      src={image.url}
                      alt={image.original_name}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="py-3 cursor-pointer" onClick={() => handleImageClick(image)}>
                    <h3 className="text-sm font-medium truncate mb-2">
                      {image.original_name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {(image.size / 1024).toFixed(1)} KB
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(image.upload_date).toLocaleDateString()}
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
                        handleDownload(image.url, image.original_name);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </CardFooter>
                </Card>
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
