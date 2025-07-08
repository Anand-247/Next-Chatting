"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/AuthContext"
import { useChat } from "../context/ChatContext"
import UserList from "../components/UserList"
import ChatWindow from "../components/ChatWindow"
import NotificationPanel from "../components/NotificationPanel"
import { verify } from "crypto"

export default function ChatPage() {
  const { user, logout, isAuthenticated, isLoading, pinVerified, showPinOverlay } = useAuth()
  const { users, activeChat, notifications } = useChat()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserList, setShowUserList] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!pinVerified) {
    return <PinOverlay />
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const toggleUserList = () => {
    setShowUserList(!showUserList)
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--primary-bg)" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "var(--secondary-bg)",
          borderBottom: "1px solid var(--border-color)",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "70px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "5px",
            }}
            onClick={toggleUserList}
          >
            ☰
          </button>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: "700", margin: 0 }}>Chat App</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            style={{
              position: "relative",
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              transition: "background-color 0.3s ease",
            }}
            onClick={toggleNotifications}
          >
            🔔
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  backgroundColor: "var(--error-color)",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "10px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                {notifications.filter((n) => !n.is_read).length}
              </span>
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src={user?.profileImage || "/placeholder.svg?height=32&width=32"}
              alt="Profile"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--border-color)",
              }}
            />
            <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "14px" }}>
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={logout}
              style={{
                backgroundColor: "var(--error-color)",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* User List */}
        <div
          style={{
            width: "300px",
            backgroundColor: "var(--secondary-bg)",
            borderRight: "1px solid var(--border-color)",
            transition: "transform 0.3s ease",
          }}
        >
          <UserList />
        </div>

        {/* Chat Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          {activeChat ? (
            <ChatWindow />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: "40px",
              }}
            >
              <h2 style={{ color: "var(--text-primary)", marginBottom: "10px", fontSize: "28px" }}>
                Welcome to Chat App
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                Select a user from the list to start chatting
              </p>
            </div>
          )}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "350px",
                height: "100%",
                backgroundColor: "var(--secondary-bg)",
                borderLeft: "1px solid var(--border-color)",
                zIndex: 100,
                boxShadow: "-5px 0 15px rgba(0, 0, 0, 0.2)",
              }}
            >
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Placeholder components - you can replace these with the actual components
function PinOverlay() {
  const { verifyPin } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pin.length !== 6) {
      setError("PIN must be 6 digits")
      return
    }

    setIsLoading(true)
    setError("")

    const result = await verifyPin(pin)

    if (!result.success) {
      setError(result.error || "Invalid PIN")
      setPin("")
    }

    setIsLoading(false)
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(26, 26, 46, 0.95)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--secondary-bg)",
          borderRadius: "16px",
          padding: "40px",
          width: "90%",
          maxWidth: "400px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "10px", fontSize: "24px" }}>Enter Your Chat PIN</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Please enter your 6-digit PIN to access the chat
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                setPin(value)
                setError("")
              }}
              placeholder="000000"
              style={{
                width: "200px",
                padding: "16px",
                fontSize: "24px",
                textAlign: "center",
                letterSpacing: "8px",
                border: "2px solid var(--border-color)",
                borderRadius: "12px",
                backgroundColor: "var(--primary-bg)",
                color: "var(--text-primary)",
                transition: "border-color 0.3s ease",
              }}
              maxLength={6}
              autoFocus
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading || pin.length !== 6}>
            {isLoading ? "Verifying..." : "Verify PIN"}
          </button>
        </form>
      </div>
    </div>
  )
}

function UserListPlaceholder() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)" }}>
        <h3 style={{ color: "var(--text-primary)", margin: 0, fontSize: "18px", fontWeight: "600" }}>Contacts</h3>
      </div>
      <div style={{ flex: 1, padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Loading users...</p>
      </div>
    </div>
  )
}

function ChatWindowPlaceholder() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Chat window will appear here</p>
      </div>
    </div>
  )
}
