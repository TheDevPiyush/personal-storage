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

    const { folderId, isPublic } = (await request.json()) as { folderId?: string; isPublic?: boolean }

    if (!folderId || typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "Folder ID and public status required" }, { status: 400 })
    }

    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", user.id)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    const shareToken = isPublic ? randomBytes(16).toString("hex") : null
    const admin = getAdminClient()
    const { error: updateError } = await admin
      .from("folders")
      .update({
        is_public: isPublic,
        share_token: shareToken,
      })
      .eq("id", folderId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update folder sharing" }, { status: 500 })
    }

    const shareUrl = shareToken ? `${request.nextUrl.origin}/share/folder/${shareToken}` : null
    return NextResponse.json({ success: true, isPublic, shareToken, shareUrl })
  } catch (error) {
    console.error("Folder share error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
