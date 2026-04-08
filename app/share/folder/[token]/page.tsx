"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, FolderOpen } from "lucide-react"

interface PublicFile {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  url?: string
}

interface PublicFolder {
  id: string
  name: string
  files: PublicFile[]
}

export default function SharedFolderPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [folder, setFolder] = useState<PublicFolder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFolder = async () => {
      if (!token) return
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/folders/public/${token}`)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Unable to open folder")
        }
        setFolder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to open folder")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFolder()
  }, [token])

  const totalSize = useMemo(() => {
    if (!folder) return 0
    return folder.files.reduce((sum, file) => sum + file.size, 0)
  }, [folder])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading shared folder...</div>
  }

  if (error || !folder) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Unable to open folder</h1>
          <p className="text-muted-foreground">{error ?? "This shared folder cannot be accessed."}</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{folder.name}</h1>
              <p className="text-xs text-muted-foreground">
                {folder.files.length} files, {(totalSize / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">File</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Uploaded</th>
                <th className="px-4 py-3 text-right">Size</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {folder.files.map((file) => (
                <tr key={file.id} className="border-t">
                  <td className="px-4 py-3">{file.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{file.type || "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(file.uploadedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{(file.size / (1024 * 1024)).toFixed(2)} MB</td>
                  <td className="px-4 py-3 text-right">
                    {file.url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const a = document.createElement("a")
                          a.href = file.url!
                          a.download = file.name
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
