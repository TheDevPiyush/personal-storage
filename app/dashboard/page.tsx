"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { UploadModal } from "@/components/upload-modal"
import { FilePreviewModal } from "@/components/file-preview-modal"
import type { FileItem } from "@/components/file-grid"
import { Input } from "@/components/ui/input"
import {
  LogOut,
  Folder,
  File,
  Link2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Share2,
  ChevronRight,
  ImageIcon,
  FileVideo,
  Music,
  FileText,
  Eye,
  CornerUpLeft,
  Upload,
  Loader2,
} from "lucide-react"

interface FolderItem {
  id: string
  name: string
  parentId?: string | null
  createdAt: string
  isPublic?: boolean
  shareToken?: string | null
  shareUrl?: string | null
}

type BreadcrumbSegment = { id: string | null; name: string }

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B"
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`
}

function getTypeLabel(type: string) {
  if (!type) return "Unknown"
  if (type.startsWith("image/")) return "Image"
  if (type.startsWith("video/")) return "Video"
  if (type.startsWith("audio/")) return "Audio"
  if (type.includes("pdf")) return "PDF"
  return type
}

function getFileTypeIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />
  if (type.startsWith("video/")) return <FileVideo className="h-4 w-4 text-purple-500" />
  if (type.startsWith("audio/")) return <Music className="h-4 w-4 text-emerald-500" />
  if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />
  return <File className="h-4 w-4 text-muted-foreground" />
}

function canPreviewInApp(type: string) {
  return (
    type.startsWith("image/") ||
    type.startsWith("video/") ||
    type.startsWith("audio/") ||
    type.includes("pdf")
  )
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadSessionKey, setUploadSessionKey] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbSegment[]>([{ id: null, name: "Root" }])
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
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
      setIsRefreshing(true)
      const query = activeFolderId ? `?folderId=${encodeURIComponent(activeFolderId)}` : ""
      const response = await fetch(`/api/files/list${query}`)

      if (response.status === 404) {
        setActiveFolderId(null)
        return
      }

      if (!response.ok) {
        console.error("[v0] Response not ok:", response.status)
        throw new Error("Failed to fetch files")
      }

      const data = await response.json()
      const { files: fetchedFiles, folders: fetchedFolders, breadcrumb: crumbs } = data
      setFiles(fetchedFiles)
      setFolders(fetchedFolders)
      if (Array.isArray(crumbs) && crumbs.length > 0) {
        setBreadcrumb(crumbs)
      } else {
        setBreadcrumb([{ id: null, name: "Root" }])
      }
    } catch (error) {
      console.error("Error fetching files:", error)
      setFiles([])
      setFolders([])
      setBreadcrumb([{ id: null, name: "Root" }])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolderId])

  const handleUpload = async (filesToUpload: File[]) => {
    if (!user) return

    setIsUploading(true)
    try {
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append("file", file)
        if (activeFolderId) {
          formData.append("folderId", activeFolderId)
        }

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
      setUploadModalOpen(false)
      setUploadSessionKey((k) => k + 1)
    } catch (error) {
      console.error("Error uploading files:", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    setIsCreatingFolder(true)
    try {
      const response = await fetch("/api/folders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: activeFolderId }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create folder")
      }
      setNewFolderName("")
      await fetchFiles()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create folder")
    } finally {
      setIsCreatingFolder(false)
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

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const response = await fetch("/api/folders/delete", {
        method: "DELETE",
        body: JSON.stringify({ folderId }),
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete folder")
      }
      await fetchFiles()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete folder")
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
      setPreviewFile((prev) =>
        prev && prev.id === fileId
          ? {
              ...prev,
              isPublic: data.isPublic,
              shareToken: data.shareToken,
              shareUrl: data.shareUrl,
            }
          : prev
      )
    } catch (error) {
      console.error("Error toggling share:", error)
      alert("Failed to update share status")
    }
  }

  const handleFolderShareToggle = async (folderId: string, isPublic: boolean) => {
    try {
      const response = await fetch("/api/folders/share", {
        method: "POST",
        body: JSON.stringify({ folderId, isPublic }),
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) {
        throw new Error("Failed to update folder sharing")
      }
      const data = await response.json()
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                isPublic: data.isPublic,
                shareToken: data.shareToken,
                shareUrl: data.shareUrl,
              }
            : folder,
        ),
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update folder sharing")
    }
  }

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      alert("Share link copied")
    } catch {
      alert("Could not copy link")
    }
  }

  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return folders
      .filter((f) => f.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
  }, [folders, search])

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => file.name.toLowerCase().includes(search.trim().toLowerCase()))
      .filter((file) => {
        if (typeFilter === "all") return true
        return file.type.toLowerCase().includes(typeFilter.toLowerCase())
      })
      .sort((a, b) => {
        const t1 = new Date(a.uploadedAt).getTime()
        const t2 = new Date(b.uploadedAt).getTime()
        return sortOrder === "asc" ? t1 - t2 : t2 - t1
      })
  }, [files, search, typeFilter, sortOrder])

  const currentFolderLabel = useMemo(
    () => breadcrumb[breadcrumb.length - 1]?.name ?? "Root",
    [breadcrumb],
  )

  const parentFolderId = useMemo(() => {
    if (breadcrumb.length < 2) return null
    return breadcrumb[breadcrumb.length - 2]?.id ?? null
  }, [breadcrumb])

  const usedStorageBytes = useMemo(
    () => filteredFiles.reduce((sum, file) => sum + file.size, 0),
    [filteredFiles],
  )

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="ml-3 h-6 w-28 animate-pulse rounded bg-muted" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-36 animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-72 animate-pulse rounded-2xl bg-muted/40" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {isRefreshing ? (
        <div
          className="pointer-events-none fixed top-0 right-0 left-0 z-100 h-0.5 bg-primary/30 animate-pulse"
          aria-hidden
        />
      ) : null}

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
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary to-accent"></div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
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
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">My Drive</h2>
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Refreshing" />
                  ) : null}
                </div>
                <nav className="mt-2 flex flex-wrap items-center gap-y-1 text-sm" aria-label="Folder path">
                  {breadcrumb.map((seg, i) => {
                    const isLast = i === breadcrumb.length - 1
                    const label =
                      isLast && breadcrumb.length > 1 ? `[${seg.name}]` : seg.name
                    return (
                      <span key={`${seg.id ?? "root"}-${i}`} className="inline-flex items-center gap-1">
                        {i > 0 ? (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        ) : null}
                        <button
                          type="button"
                          className={
                            isLast
                              ? "rounded-md border border-primary/35 bg-primary/10 px-2 py-0.5 font-medium text-foreground shadow-sm"
                              : "text-muted-foreground transition-colors hover:text-foreground"
                          }
                          onClick={() => setActiveFolderId(seg.id)}
                        >
                          {label}
                        </button>
                      </span>
                    )
                  })}
                </nav>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                <div>
                  Items in view: {filteredFolders.length + filteredFiles.length}
                  {search.trim() ? ` (filtered)` : ""}
                </div>
                <div>Files size (filtered): {formatFileSize(usedStorageBytes)}</div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow ${
              isRefreshing ? "ring-2 ring-primary/10" : ""
            }`}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Contents</h3>
                {isRefreshing ? (
                  <span className="text-xs text-muted-foreground">Updating…</span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0 sm:justify-end">
                <Input
                  className="max-w-xs min-w-[140px]"
                  placeholder="New folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <Button onClick={handleCreateFolder} disabled={isCreatingFolder} size="sm">
                  {isCreatingFolder ? "Creating..." : "New folder"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveFolderId(null)}>
                  Root
                </Button>
                {breadcrumb.length > 1 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveFolderId(parentFolderId)}
                    title="Open parent folder"
                  >
                    <CornerUpLeft className="mr-2 h-4 w-4" />
                    Up
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Input
                    placeholder="Search folders and files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:min-w-[140px]"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All file types</option>
                    <option value="image/">Images</option>
                    <option value="video/">Videos</option>
                    <option value="audio/">Audio</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                    className="justify-start sm:justify-center"
                    title="Sort files by upload time (folders stay alphabetical)"
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Time
                    {sortOrder === "asc" ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />}
                  </Button>
                </div>

                <div className="max-h-[min(560px,calc(100vh-14rem))] overflow-auto rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Size</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isRefreshing && folders.length === 0 && files.length === 0 ? (
                    <tr>
                      <td className="px-4 py-12 text-center text-muted-foreground" colSpan={5}>
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin opacity-70" aria-hidden />
                        <span className="text-sm">Loading contents…</span>
                      </td>
                    </tr>
                  ) : null}
                  {filteredFolders.map((folder) => (
                    <tr
                      key={`folder-${folder.id}`}
                      className="cursor-pointer border-t bg-slate-50/60 hover:bg-primary/5"
                      onClick={() => setActiveFolderId(folder.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <Folder className="h-4 w-4 shrink-0 text-amber-600" />
                          <span className="truncate font-medium">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">Folder</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(folder.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {folder.shareUrl ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyLink(folder.shareUrl!)
                              }}
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            title={folder.isPublic ? "Make private" : "Share folder"}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFolderShareToggle(folder.id, !folder.isPublic)
                            }}
                          >
                            <Share2 className={`h-4 w-4 ${folder.isPublic ? "text-green-600" : ""}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFolder(folder.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className={`border-t ${canPreviewInApp(file.type) ? "cursor-pointer hover:bg-muted/50" : ""}`}
                      onClick={() => {
                        if (canPreviewInApp(file.type)) {
                          setPreviewFile(file)
                          setIsPreviewOpen(true)
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[220px]">
                          {getFileTypeIcon(file.type)}
                          <span className="truncate">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{getTypeLabel(file.type)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(file.uploadedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{formatFileSize(file.size)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {canPreviewInApp(file.type) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Preview"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewFile(file)
                                setIsPreviewOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {file.shareUrl ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyLink(file.shareUrl!)
                              }}
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShareToggle(file.id, !file.isPublic)
                            }}
                          >
                            <Share2 className={`h-4 w-4 ${file.isPublic ? "text-green-600" : ""}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(file.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isRefreshing && filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>
                        {search.trim()
                          ? "No folders or files match your search."
                          : "This folder is empty. Use the upload button or create a folder."}
                      </td>
                    </tr>
                  ) : null}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        </div>
      </main>

      <Button
        type="button"
        size="icon"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        onClick={() => {
          setUploadSessionKey((k) => k + 1)
          setUploadModalOpen(true)
        }}
        title="Upload files"
        aria-label="Upload files"
      >
        <Upload className="h-6 w-6" />
      </Button>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={(open) => {
          if (!open && isUploading) return
          setUploadModalOpen(open)
        }}
        onUpload={handleUpload}
        isUploading={isUploading}
        contextLabel={currentFolderLabel}
        sessionKey={uploadSessionKey}
      />

      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onShareToggle={handleShareToggle}
      />
    </div>
  )
}
