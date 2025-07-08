"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../context/AuthContext"

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated) {
    router.push("/chat")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const result = await login(formData.email, formData.password)

    if (!result.success) {
      setError(result.error || "Login failed")
    } else {
      router.push("/chat")
    }

    setIsLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ padding: "20px", background: "linear-gradient(135deg, var(--primary-bg) 0%, var(--secondary-bg) 100%)" }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "450px" }}>
        <div className="text-center" style={{ marginBottom: "30px" }}>
          <h1 style={{ color: "var(--text-primary)", marginBottom: "10px", fontSize: "28px", fontWeight: "700" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Sign in to your account to continue chatting
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div
          className="text-center"
          style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Don't have an account?{" "}
            <Link
              href="/signup"
              style={{ color: "var(--accent-color)", textDecoration: "none", fontWeight: "600", marginLeft: "5px" }}
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    console.log("🚀 ~ login ~ data:", data)

    if (response.ok) {
      // Store the token in localStorage or a cookie
      localStorage.setItem("token", data.token)
      return { success: true }
    } else {
      return { success: false, error: data.message || "Login failed" }
    }
  } catch (error: any) {
    console.error("Login error:", error)
    return { success: false, error: error.message || "Login failed" }
  }
}
