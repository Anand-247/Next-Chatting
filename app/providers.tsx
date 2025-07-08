"use client"

import type React from "react"

import { AuthProvider } from "./context/AuthContext"
import { ChatProvider } from "./context/ChatContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>{children}</ChatProvider>
    </AuthProvider>
  )
}
