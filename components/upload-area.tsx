"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X } from "lucide-react"

interface UploadAreaProps {
  onUpload: (files: File[]) => Promise<void>
  isLoading: boolean
  contextLabel?: string
  /** Smaller padding for use inside dialogs */
  compact?: boolean
}

export function UploadArea({ onUpload, isLoading, contextLabel, compact }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    await onUpload(selectedFiles)
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className={`cursor-pointer border-2 transition-all ${
          isDragging
            ? "border-primary bg-primary/10 dark:bg-primary/5"
            : "border-dashed border-muted-foreground/20 hover:border-primary/50"
        } rounded-xl ${compact ? "p-6" : "p-12"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          backgroundColor: isDragging ? undefined : "rgb(255 255 255 / 0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className={`mb-4 text-primary ${compact ? "h-10 w-10" : "h-12 w-12"}`} />
          <h3 className={`mb-2 font-medium ${compact ? "text-base" : "text-lg"}`}>Drag and drop your files</h3>
          <p className="mb-2 text-sm text-muted-foreground">or click to browse from your computer</p>
          {contextLabel && !compact ? <p className="mb-4 text-xs text-primary">Uploading to: {contextLabel}</p> : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-white/20 bg-transparent transition-all duration-200 hover:bg-white/20 dark:hover:bg-white/10"
            style={{
              backgroundColor: "rgb(255 255 255 / 0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
        </div>
      </Card>

      {selectedFiles.length > 0 && (
        <Card
          className="rounded-xl p-6"
          style={{
            backgroundColor: "rgb(255 255 255 / 0.1)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Ready to upload ({selectedFiles.length} files)</h4>
              <button onClick={() => setSelectedFiles([])} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ))}
            </div>
            <Button
              onClick={handleUpload}
              className="w-full bg-linear-to-r from-primary to-accent"
              disabled={isLoading}
            >
              {isLoading ? "Uploading..." : "Upload Files"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
