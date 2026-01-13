import { getAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const admin = getAdminClient()
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    // Fetch public file by share token using admin client to bypass RLS
    const { data: file, error } = await admin
      .from("files")
      .select("*")
      .eq("share_token", token)
      .eq("is_public", true)
      .single() as any

    if (error || !file) {
      console.error("Public file fetch error:", error)
      // Check if file exists but is not public
      const { data: existingFile } = await admin
        .from("files")
        .select("is_public")
        .eq("share_token", token)
        .single() as any

      if (existingFile && !existingFile.is_public) {
        return NextResponse.json(
          { error: "File is private", code: "PRIVATE" },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: "File not found", code: "NOT_FOUND" },
        { status: 404 }
      )
    }

    // Get public URL for the file
    const {
      data: { publicUrl },
    } = admin.storage.from("files").getPublicUrl(file.storage_path)

    return NextResponse.json({
      id: file.id,
      name: file.name,
      type: file.file_type,
      size: file.file_size,
      uploadedAt: file.uploaded_at,
      url: publicUrl,
    })
  } catch (error) {
    console.error("Public file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

