'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trash2, ZoomIn, ZoomOut, RotateCcw, Download, Loader2 } from 'lucide-react';
import { downloadFile } from '../../lib/download';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  imageName: string;
  onClose: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function ImageViewer({
  isOpen,
  imageUrl,
  imageName,
  onClose,
  onDelete,
  isDeleting,
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Define zoom functions first
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

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
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
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 5));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
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
    await downloadFile(imageUrl, imageName);
  }, [imageUrl, imageName]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
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
        onClick={onClose}
        className="absolute top-4 left-4 z-10 bg-white/10 hover:bg-white/20 text-white"
        title="Close (Esc)"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Delete button - top right */}
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          className="absolute top-4 right-4 z-10"
          title="Delete image"
        >
          {isDeleting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Trash2 className="h-5 w-5" />
          )}
        </Button>
      )}

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

      {/* Image name */}
      <div className="absolute bottom-4 left-4 z-10 text-white/80 text-sm max-w-[200px] truncate bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5">
        {imageName}
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
          src={imageUrl}
          alt={imageName}
          className="max-w-[90vw] max-h-[85vh] object-contain pointer-events-none"
        />
      </div>
    </div>
  );
}
