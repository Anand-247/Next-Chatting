"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to chat page
    router.push("/chat")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner"></div>
    </div>
  )
}
