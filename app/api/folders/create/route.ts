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

    const { name, parentId } = (await request.json()) as { name?: string; parentId?: string | null }
    const normalizedName = name?.trim()
    const parent = typeof parentId === "string" && parentId.length > 0 ? parentId : null

    if (!normalizedName) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    if (parent) {
      const { data: parentFolder, error: parentError } = await supabase
        .from("folders")
        .select("id")
        .eq("id", parent)
        .eq("user_id", user.id)
        .single()

      if (parentError || !parentFolder) {
        return NextResponse.json({ error: "Parent folder not found" }, { status: 404 })
      }
    }

    const admin = getAdminClient()
    const { data, error } = await admin
      .from("folders")
      .insert({
        user_id: user.id,
        name: normalizedName,
        parent_id: parent,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      folder: {
        id: data.id,
        name: data.name,
        parentId: data.parent_id ?? null,
        createdAt: data.created_at,
        isPublic: data.is_public || false,
        shareToken: data.share_token || null,
        shareUrl: null,
      },
    })
  } catch (error) {
    console.error("Create folder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
