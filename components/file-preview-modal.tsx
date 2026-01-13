"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Share2, Link2, Check } from "lucide-react"
import { useState } from "react"
import type { FileItem } from "./file-grid"

interface FilePreviewModalProps {
  file: FileItem | null
  isOpen: boolean
  onClose: () => void
  onShareToggle?: (fileId: string, isPublic: boolean) => Promise<void>
}

export function FilePreviewModal({ file, isOpen, onClose, onShareToggle }: FilePreviewModalProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  if (!file) return null

  const isImage = file.type.startsWith("image/")
  const isVideo = file.type.startsWith("video/")
  const isAudio = file.type.startsWith("audio/")
  const isPdf = file.type.includes("pdf")

  const handleDownload = () => {
    if (!file.url) return
    const a = document.createElement("a")
    a.href = file.url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShareToggle = async () => {
    if (!onShareToggle) return
    setIsSharing(true)
    try {
      await onShareToggle(file.id, !file.isPublic)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    if (!file.shareUrl) return
    try {
      await navigator.clipboard.writeText(file.shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden flex flex-col border border-border/50 rounded-xl bg-background/95 backdrop-blur-md"
      >
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="truncate text-foreground">{file.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden min-h-0">
          {/* Preview Area */}
          <div className="flex items-center justify-center rounded-lg bg-muted/30 p-4 min-h-[300px] max-h-[60vh] overflow-auto border border-border/30">
            {isImage && (
              <img 
                src={file.url || "/placeholder.svg"} 
                alt={file.name} 
                className="max-h-full max-w-full rounded-lg object-contain" 
              />
            )}
            {isVideo && (
              <video 
                src={file.url} 
                controls 
                className="max-h-full max-w-full rounded-lg" 
                style={{ maxHeight: "60vh" }}
              />
            )}
            {isAudio && (
              <audio 
                src={file.url} 
                controls 
                className="w-full max-w-md" 
              />
            )}
            {isPdf && file.url && (
              <iframe
                src={file.url}
                className="w-full rounded-lg border-0"
                style={{ height: "60vh", minHeight: "400px" }}
                title={file.name}
              />
            )}
            {!isImage && !isVideo && !isAudio && !isPdf && (
              <div className="text-center py-8">
                <p className="text-foreground/70">Preview not available for this file type</p>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="space-y-2 text-sm flex-shrink-0 border-t border-border/30 pt-4">
            <div className="flex justify-between">
              <span className="text-foreground/70">Type:</span>
              <span className="text-foreground font-medium">{file.type || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Size:</span>
              <span className="text-foreground font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Uploaded:</span>
              <span className="text-foreground font-medium">{new Date(file.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Button onClick={handleDownload} className="flex-1 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {onShareToggle && (
              <>
                {file.isPublic && file.shareUrl && (
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex-1 min-w-[120px] border-border hover:bg-accent"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleShareToggle}
                  disabled={isSharing}
                  variant="outline"
                  className="flex-1 min-w-[120px] border-border hover:bg-accent"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {isSharing
                    ? "Updating..."
                    : file.isPublic
                    ? "Make Private"
                    : "Make Public"}
                </Button>
              </>
            )}
            <Button onClick={onClose} variant="outline" className="flex-1 min-w-[120px] border-border hover:bg-accent">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
