"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { UploadArea } from "@/components/upload-area"
import { FileGrid, type FileItem } from "@/components/file-grid"
import { LogOut } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchFiles()
    }
  }, [authLoading, user, router])

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/files/list")

      if (!response.ok) {
        console.error("[v0] Response not ok:", response.status)
        throw new Error("Failed to fetch files")
      }

      const { files: fetchedFiles } = await response.json()
      setFiles(fetchedFiles)
    } catch (error) {
      console.error("Error fetching files:", error)
      setFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (filesToUpload: File[]) => {
    if (!user) return

    setIsUploading(true)
    try {
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        })

        const data = await response.json().catch(() => ({
          error: `Server error: ${response.status}`,
        }))

        if (!response.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }
      }
      await fetchFiles()
    } catch (error) {
      console.error("Error uploading files:", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch("/api/files/delete", {
        method: "DELETE",
        body: JSON.stringify({ fileId }),
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to delete file")
      await fetchFiles()
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleShareToggle = async (fileId: string, isPublic: boolean) => {
    try {
      const response = await fetch("/api/files/share", {
        method: "POST",
        body: JSON.stringify({ fileId, isPublic }),
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to update share status")
      const data = await response.json()
      
      // Update the file in the local state
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? {
                ...file,
                isPublic: data.isPublic,
                shareToken: data.shareToken,
                shareUrl: data.shareUrl,
              }
            : file
        )
      )
    } catch (error) {
      console.error("Error toggling share:", error)
      alert("Failed to update share status")
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
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
            <div className="flex items-center gap-4">
              {user?.email && (
                <span className="text-sm text-foreground/70 truncate max-w-[200px]" title={user.email}>
                  {user.email}
                </span>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Upload Files</h2>
            <UploadArea onUpload={handleUpload} isLoading={isUploading} />
          </div>

          {/* Files Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">Your Files</h2>
            <FileGrid files={files} isLoading={isLoading} onDelete={handleDelete} onShareToggle={handleShareToggle} />
          </div>
        </div>
      </main>
    </div>
  )
}
