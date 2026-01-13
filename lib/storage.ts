import { createClient } from "@/lib/supabase/client"

export async function uploadFile(file: File) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  try {
    // Call the API route to handle upload
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    return await response.json()
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}

export async function fetchUserFiles() {
  try {
    const response = await fetch("/api/files/list")

    if (!response.ok) {
      throw new Error("Failed to fetch files")
    }

    const { files } = await response.json()
    return files
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

export async function deleteFile(fileId: string) {
  try {
    const response = await fetch("/api/files/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileId }),
    })

    if (!response.ok) {
      throw new Error("Delete failed")
    }

    return await response.json()
  } catch (error) {
    console.error("Delete error:", error)
    throw error
  }
}
