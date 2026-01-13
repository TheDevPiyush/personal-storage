import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId, isPublic } = await request.json()

    if (!fileId || typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "File ID and public status required" }, { status: 400 })
    }

    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const admin = getAdminClient()

    const shareToken = isPublic ? randomBytes(16).toString("hex") : null

    const { data: updatedFile, error: updateError } = await admin
      .from("files")
      // @ts-expect-error
      .update({
        is_public: isPublic,
        share_token: shareToken,
      })
      .eq("id", fileId)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
    }

    const shareUrl = shareToken ? `${request.nextUrl.origin}/share/${shareToken}` : null

    return NextResponse.json({
      success: true,
      isPublic,
      shareToken,
      shareUrl,
    })
  } catch (error) {
    console.error("Share error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

