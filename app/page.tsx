"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.push("/dashboard")
      } else {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          CloudVault
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">Secure cloud storage for all your files</p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => router.push("/auth/login")}
            className="bg-gradient-to-r from-primary to-accent"
            size="lg"
          >
            Sign In
          </Button>
          <Button onClick={() => router.push("/auth/sign-up")} variant="outline" size="lg">
            Create Account
          </Button>
        </div>
      </div>
    </div>
  )
}
