import { createClient } from "@/lib/supabase/server"
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

    // Fetch files for the current user, ordered by upload date (newest first)
    const { data: files, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 })
    }

    // Get public URLs for all files
    const filesWithUrls = files.map((file) => {
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
        isPublic: file.is_public || false,
        shareToken: file.share_token || null,
        shareUrl,
      }
    })

    return NextResponse.json({ files: filesWithUrls })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
