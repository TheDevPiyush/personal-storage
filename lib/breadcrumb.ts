import type { SupabaseClient } from "@supabase/supabase-js"

export type BreadcrumbSegment = { id: string | null; name: string }

type FolderChainRow = { id: string; name: string; parent_id: string | null }

export async function buildFolderBreadcrumb(
  supabase: SupabaseClient,
  userId: string,
  folderId: string | null,
): Promise<BreadcrumbSegment[]> {
  if (!folderId) {
    return [{ id: null, name: "Root" }]
  }

  const segments: BreadcrumbSegment[] = []
  let currentId: string | null = folderId

  for (let i = 0; i < 64 && currentId; i++) {
    const { data: row, error } = await supabase
      .from("folders")
      .select("id, name, parent_id")
      .eq("id", currentId)
      .eq("user_id", userId)
      .single()

    if (error || !row) {
      return [{ id: null, name: "Root" }]
    }

    const f = row as FolderChainRow
    segments.unshift({ id: f.id, name: f.name })
    currentId = f.parent_id ?? null
  }

  return [{ id: null, name: "Root" }, ...segments]
}
