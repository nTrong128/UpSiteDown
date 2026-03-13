'use client';

import { useCallback, useEffect, useRef } from 'react';
import { X, Download, Trash2, Loader2 } from 'lucide-react';
import { downloadFile } from '../../lib/download';
import { Button } from '@/components/ui/button';

interface VideoViewerProps {
  isOpen: boolean;
  fileUrl: string;
  fileName: string;
  onClose: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function VideoViewer({
  isOpen,
  fileUrl,
  fileName,
  onClose,
  onDelete,
  isDeleting,
}: VideoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleDownload = useCallback(async () => {
    await downloadFile(fileUrl, fileName);
  }, [fileUrl, fileName]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
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

      {/* Delete button */}
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          className="absolute top-4 right-4 z-10"
          title="Delete"
        >
          {isDeleting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Trash2 className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Bottom toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="h-9 w-9 text-white hover:bg-white/20"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* File name */}
      <div className="absolute bottom-4 left-4 z-10 text-white/80 text-sm max-w-[200px] truncate bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5">
        {fileName}
      </div>

      {/* Video player */}
      <video
        src={fileUrl}
        controls
        className="max-w-[90vw] max-h-[85vh] rounded-lg"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
