'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Loader2,
  Share2,
  Check,
  Link2
} from 'lucide-react';
import { downloadImage } from '@/lib/download';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';

interface UploadedImage {
  id: number;
  filename: string;
  original_name: string;
  size: number;
  upload_date: string | Date;
  url: string;
}

interface ImageDetailClientProps {
  image: UploadedImage;
}

export default function ImageDetailClient({ image }: ImageDetailClientProps) {
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleClose = useCallback(() => {
    router.push('/uploaded');
  }, [router]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 5));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(async () => {
    await downloadImage(image.url, image.original_name);
  }, [image.url, image.original_name]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete "${image.original_name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/uploaded');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete image');
      }
    } catch (err) {
      alert('Failed to delete image: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  }, [image.id, image.original_name, router]);

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.original_name,
          text: `Check out this image: ${image.original_name}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled sharing or error occurred
        if ((err as Error).name !== 'AbortError') {
          // Fall back to copying to clipboard
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  }, [image.original_name]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      handleClose();
    }
  }, [handleClose]);

  return (
    <div className="min-h-screen bg-black">
      {/* Hidden navigation for accessibility */}
      <div className="sr-only">
        <Navigation />
      </div>

      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
        onClick={handleBackdropClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 left-4 z-10 bg-white/10 hover:bg-white/20 text-white"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Action buttons - top right */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="bg-white/10 hover:bg-white/20 text-white"
            title="Share link"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete image"
          >
            {isDeleting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Zoom controls with download button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-9 w-9 text-white hover:bg-white/20"
            title="Zoom out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm min-w-[4rem] text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-9 w-9 text-white hover:bg-white/20"
            title="Zoom in (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-white/30 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            className="h-9 w-9 text-white hover:bg-white/20"
            title="Reset zoom (0)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-white/30 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9 text-white hover:bg-white/20"
            title="Download image"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Image name and share hint */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
          <div className="text-white/80 text-sm max-w-[200px] truncate bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5">
            {image.original_name}
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-xs bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1">
            <Link2 className="h-3 w-3" />
            <span>Shareable link</span>
          </div>
        </div>

        {/* Image container */}
        <div
          className="relative cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.original_name}
            className="max-w-[90vw] max-h-[85vh] object-contain pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
