import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileName = file.name.replace(/\s+/g, "-").toLowerCase()
    const storagePath = `${user.id}/${timestamp}-${fileName}`

    let admin
    try {
      admin = getAdminClient()
    } catch (error) {
      console.error("[v0] Failed to initialize admin client:", error)
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    const buffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("files")
      .upload(storagePath, Buffer.from(buffer), {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Storage error:", uploadError)
      return NextResponse.json({ error: `Storage error: ${uploadError.message || "Unknown error"}` }, { status: 500 })
    }

    const { data: fileData, error: dbError } = await admin
      .from("files")
      .insert({
        user_id: user.id,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      // Clean up uploaded file if database insert fails
      await admin.storage
        .from("files")
        .remove([storagePath])
        .catch((e) => console.error("[v0] Cleanup error:", e))
      return NextResponse.json({ error: `Database error: ${dbError.message || "Unknown error"}` }, { status: 500 })
    }

    if (!fileData || fileData.length === 0) {
      await admin.storage
        .from("files")
        .remove([storagePath])
        .catch((e) => console.error("[v0] Cleanup error:", e))
      return NextResponse.json({ error: "Failed to save file metadata" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("files").getPublicUrl(storagePath)

    const insertedFile = fileData[0]

    return NextResponse.json({
      success: true,
      file: {
        id: insertedFile.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
      },
    })
  } catch (error) {
    console.error("[v0] Upload error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
