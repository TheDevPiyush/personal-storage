import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { folderId } = (await request.json()) as { folderId?: string }
    if (!folderId) {
      return NextResponse.json({ error: "Folder ID required" }, { status: 400 })
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

    const { count, error: countError } = await supabase
      .from("files")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("folder_id", folderId)

    if (countError) {
      return NextResponse.json({ error: "Failed to check folder contents" }, { status: 500 })
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: "Folder is not empty" }, { status: 400 })
    }

    const { count: childFolderCount, error: childFolderError } = await supabase
      .from("folders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("parent_id", folderId)

    if (childFolderError) {
      return NextResponse.json({ error: "Failed to check subfolders" }, { status: 500 })
    }

    if ((childFolderCount ?? 0) > 0) {
      return NextResponse.json({ error: "Folder contains subfolders" }, { status: 400 })
    }

    const { error: deleteError } = await supabase.from("folders").delete().eq("id", folderId)
    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete folder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
