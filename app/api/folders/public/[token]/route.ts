import { getAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const admin = getAdminClient()
    const { token } = await params

    const { data: folder, error: folderError } = await admin
      .from("folders")
      .select("*")
      .eq("share_token", token)
      .eq("is_public", true)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const { data: files, error: filesError } = await admin
      .from("files")
      .select("*")
      .eq("folder_id", folder.id)
      .eq("user_id", folder.user_id)
      .order("uploaded_at", { ascending: false })

    if (filesError) {
      return NextResponse.json({ error: "Failed to fetch folder files" }, { status: 500 })
    }

    const items = (files || []).map((file) => {
      const {
        data: { publicUrl },
      } = admin.storage.from("files").getPublicUrl(file.storage_path)

      return {
        id: file.id,
        name: file.name,
        type: file.file_type,
        size: file.file_size,
        uploadedAt: file.uploaded_at,
        url: publicUrl,
      }
    })

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      files: items,
    })
  } catch (error) {
    console.error("Public folder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
