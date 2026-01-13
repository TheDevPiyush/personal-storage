"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { FileItem } from "@/components/file-grid"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Lock, FileX, Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [file, setFile] = useState<FileItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<"not_found" | "private" | "error">("error")

  useEffect(() => {
    if (!token) return

    const fetchPublicFile = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/files/public/${token}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 403 || errorData.code === "PRIVATE") {
            setErrorType("private")
            setError(errorData.error || "This file is private and not accessible")
          } else if (response.status === 404 || errorData.code === "NOT_FOUND") {
            setErrorType("not_found")
            setError(errorData.error || "This file doesn't exist or has been removed")
          } else {
            setErrorType("error")
            setError(errorData.error || "Failed to load file")
          }
          return
        }

        const fileData = await response.json()
        setFile(fileData)
      } catch (err) {
        setErrorType("error")
        setError(err instanceof Error ? err.message : "Failed to load file")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPublicFile()
  }, [token])

  const handleDownload = () => {
    if (!file?.url) return
    const a = document.createElement("a")
    a.href = file.url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !file) {
    const isPrivate = errorType === "private"
    const isNotFound = errorType === "not_found"
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div
            className="rounded-xl border border-white/20 p-8 text-center space-y-6"
            style={{
              backgroundColor: "rgb(255 255 255 / 0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className={`h-20 w-20 rounded-full flex items-center justify-center ${
                  isPrivate
                    ? "bg-orange-500/20 border-2 border-orange-500/30"
                    : isNotFound
                    ? "bg-red-500/20 border-2 border-red-500/30"
                    : "bg-muted border-2 border-muted-foreground/30"
                }`}
              >
                {isPrivate ? (
                  <Lock className="h-10 w-10 text-orange-400" />
                ) : isNotFound ? (
                  <FileX className="h-10 w-10 text-red-400" />
                ) : (
                  <FileX className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {isPrivate
                  ? "File is Private"
                  : isNotFound
                  ? "File Not Found"
                  : "Unable to Access File"}
              </h2>
              <p className="text-muted-foreground">
                {error ||
                  (isPrivate
                    ? "This file is not publicly shared. Please contact the owner for access."
                    : isNotFound
                    ? "The file you're looking for doesn't exist or may have been deleted."
                    : "We couldn't load this file. Please try again later.")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="bg-transparent border-white/20 hover:bg-white/10"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="bg-transparent hover:bg-white/5"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl"
        style={{
          backgroundColor: "rgb(255 255 255 / 0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CloudVault
              </h1>
            </div>
            <Button onClick={handleDownload} className="bg-gradient-to-r from-primary to-accent">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-white/20 p-6" style={{
          backgroundColor: "rgb(255 255 255 / 0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <h2 className="mb-4 text-xl font-semibold truncate">{file.name}</h2>
          
          {/* Preview Area */}
          <div className="flex items-center justify-center rounded-lg bg-muted/50 p-8 min-h-96 max-h-[70vh] overflow-auto mb-4">
            {file.type.startsWith("image/") && (
              <img src={file.url || "/placeholder.svg"} alt={file.name} className="max-h-96 max-w-full rounded-lg" />
            )}
            {file.type.startsWith("video/") && (
              <video src={file.url} controls className="max-h-96 max-w-full rounded-lg" />
            )}
            {file.type.startsWith("audio/") && (
              <audio src={file.url} controls className="w-full" />
            )}
            {file.type.includes("pdf") && file.url && (
              <iframe
                src={file.url}
                className="w-full h-[70vh] rounded-lg border-0"
                title={file.name}
              />
            )}
            {!file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("audio/") && !file.type.includes("pdf") && (
              <div className="text-center">
                <p className="text-muted-foreground">Preview not available for this file type</p>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{file.type || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uploaded:</span>
              <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

