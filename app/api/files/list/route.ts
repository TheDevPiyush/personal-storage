import { createClient } from "@/lib/supabase/server"
import { buildFolderBreadcrumb } from "@/lib/breadcrumb"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folderId = request.nextUrl.searchParams.get("folderId")

    if (folderId) {
      const { data: folderRow, error: folderLookupError } = await supabase
        .from("folders")
        .select("id")
        .eq("id", folderId)
        .eq("user_id", user.id)
        .single()

      if (folderLookupError || !folderRow) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 })
      }
    }

    let foldersQuery = supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true })

    if (folderId) {
      foldersQuery = foldersQuery.eq("parent_id", folderId)
    } else {
      foldersQuery = foldersQuery.is("parent_id", null)
    }

    const { data: folders, error: foldersError } = await foldersQuery

    let filesQuery = supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })

    if (!foldersError) {
      if (folderId) {
        filesQuery = filesQuery.eq("folder_id", folderId)
      } else {
        filesQuery = filesQuery.is("folder_id", null)
      }
    }

    const { data: files, error: filesError } = await filesQuery

    if (filesError) {
      console.error("Database error:", filesError)
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
    }

    if (foldersError) {
      console.warn("Folders table not available yet, returning files-only response")
    }

    let breadcrumb = [{ id: null as string | null, name: "Root" }]
    if (!foldersError) {
      breadcrumb = await buildFolderBreadcrumb(supabase, user.id, folderId)
    }

    const foldersWithUrls = (foldersError ? [] : folders || []).map((folder) => {
      const shareUrl = folder.is_public && folder.share_token
        ? `${request.nextUrl.origin}/share/folder/${folder.share_token}`
        : null

      return {
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id ?? null,
        createdAt: folder.created_at,
        isPublic: folder.is_public || false,
        shareToken: folder.share_token || null,
        shareUrl,
      }
    })

    const filesWithUrls = (files || []).map((file) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from("files").getPublicUrl(file.storage_path)

      const shareUrl = file.is_public && file.share_token
        ? `${request.nextUrl.origin}/share/${file.share_token}`
        : null

      return {
        id: file.id,
        name: file.name,
        type: file.file_type,
        size: file.file_size,
        uploadedAt: file.uploaded_at,
        url: publicUrl,
        folderId: "folder_id" in file ? file.folder_id ?? null : null,
        isPublic: file.is_public || false,
        shareToken: file.share_token || null,
        shareUrl,
      }
    })

    return NextResponse.json({ breadcrumb, folders: foldersWithUrls, files: filesWithUrls })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
