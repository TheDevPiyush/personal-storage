"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UploadArea } from "@/components/upload-area"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: File[]) => Promise<void>
  isUploading: boolean
  contextLabel: string
  /** Remount upload widget when this changes (clears selection) */
  sessionKey: number
}

export function UploadModal({
  open,
  onOpenChange,
  onUpload,
  isUploading,
  contextLabel,
  sessionKey,
}: UploadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        showCloseButton={!isUploading}
        onPointerDownOutside={(e) => {
          if (isUploading) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isUploading) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Files are added to <span className="font-medium text-foreground">{contextLabel}</span>.
          </DialogDescription>
        </DialogHeader>
        <div key={sessionKey}>
          <UploadArea
            onUpload={onUpload}
            isLoading={isUploading}
            contextLabel={contextLabel}
            compact
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
