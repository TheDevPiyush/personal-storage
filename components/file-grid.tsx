"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Download, Trash2, FileText, FileImage, FileVideo, FileAudio, File, Eye, Share2, Link2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FilePreviewModal } from "./file-preview-modal"

export interface FileItem {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  url?: string
  isPublic?: boolean
  shareToken?: string | null
  shareUrl?: string | null
}

interface FileGridProps {
  files: FileItem[]
  isLoading: boolean
  onDelete: (fileId: string) => Promise<void>
  onShareToggle?: (fileId: string, isPublic: boolean) => Promise<void>
}

export function FileGrid({ files, isLoading, onDelete, onShareToggle }: FileGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [sharingId, setSharingId] = useState<string | null>(null)

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-8 w-8 text-blue-500" />
    if (type.startsWith("video/")) return <FileVideo className="h-8 w-8 text-purple-500" />
    if (type.startsWith("audio/")) return <FileAudio className="h-8 w-8 text-green-500" />
    if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId)
    try {
      await onDelete(fileId)
    } finally {
      setDeletingId(null)
    }
  }

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  const canPreview = (type: string) => {
    return type.startsWith("image/") || type.startsWith("video/") || type.startsWith("audio/") || type.includes("pdf")
  }

  const handleShareToggle = async (file: FileItem) => {
    if (!onShareToggle) return
    
    setSharingId(file.id)
    try {
      await onShareToggle(file.id, !file.isPublic)
    } finally {
      setSharingId(null)
    }
  }

  const handleCopyLink = async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert("Link copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-12 text-center">
        <File className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">No files yet</h3>
        <p className="text-sm text-muted-foreground">Upload your first file to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((file) => (
          <Card
            key={file.id}
            className="group relative overflow-hidden transition-all hover:shadow-xl rounded-lg cursor-pointer"
            style={{
              backgroundColor: "rgb(255 255 255 / 0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={() => handlePreview(file)}
          >
            <div className="flex h-32 flex-col items-center justify-center rounded-t-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4 relative">
              {getFileIcon(file.type)}
              {canPreview(file.type) && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute inset-0 m-auto h-10 w-10 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handlePreview(file)}
                  title="Preview file"
                >
                  <Eye className="h-5 w-5" />
                </Button>
              )}
              {file.isPublic && (
                <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">
                  Public
                </div>
              )}
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="truncate font-medium text-sm text-foreground" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</p>
            </div>

            {/* Action menu */}
            <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canPreview(file.type) && (
                    <DropdownMenuItem onClick={() => handlePreview(file)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                  )}
                  {file.url && (
                    <DropdownMenuItem
                      onClick={() => {
                        const a = document.createElement("a")
                        a.href = file.url!
                        a.download = file.name
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {onShareToggle && (
                    <>
                      {file.isPublic && file.shareUrl && (
                        <DropdownMenuItem
                          onClick={() => handleCopyLink(file.shareUrl!)}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Copy Share Link
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleShareToggle(file)}
                        disabled={sharingId === file.id}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        {sharingId === file.id
                          ? "Updating..."
                          : file.isPublic
                          ? "Make Private"
                          : "Make Public"}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingId === file.id ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onShareToggle={onShareToggle}
      />
    </>
  )
}
