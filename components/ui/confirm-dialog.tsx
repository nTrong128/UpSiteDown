'use client';

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { X, AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loadingText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loadingText = "Processing...",
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className={cn(
          "relative w-full max-w-md mx-4 p-6 rounded-xl bg-card text-card-foreground shadow-xl animate-scaleIn",
          "border border-border"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Icon */}
        {variant === 'destructive' && (
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className={cn(
          "text-xl font-semibold text-center mb-2",
          variant !== 'destructive' && "mt-2"
        )}>
          {title}
        </h2>

        {/* Message */}
        <p className="text-muted-foreground text-center mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? loadingText : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
