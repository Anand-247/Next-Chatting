"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "../context/ChatContext"
import { useAuth } from "../context/AuthContext"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"

export default function ChatWindow() {
  const { activeChat, users, messages, getChatId, setTyping } = useChat()
  const { user } = useAuth()
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const activeUser = users.find((u) => u.id === activeChat)
  const chatId = activeChat ? getChatId(user!.id, activeChat) : ""
  const chatMessages = messages[chatId] || []

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleTypingStart = () => {
    if (!isTyping && activeChat) {
      setIsTyping(true)
      setTyping(activeChat, true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (activeChat) {
        setTyping(activeChat, false)
      }
    }, 2000)
  }

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    if (activeChat) {
      setTyping(activeChat, false)
    }
  }

  if (!activeUser || !activeChat) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--primary-bg)" }}>
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
          <h3 style={{ color: "var(--text-primary)", marginBottom: "10px", fontSize: "24px" }}>No chat selected</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Select a user to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--primary-bg)" }}>
      {/* Chat Header */}
      <div
        style={{
          backgroundColor: "var(--secondary-bg)",
          borderBottom: "1px solid var(--border-color)",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={activeUser.profile_image || "/placeholder.svg?height=40&width=40"}
            alt={`${activeUser.first_name} ${activeUser.last_name}`}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid var(--border-color)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h3
              style={{
                color: "var(--text-primary)",
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {activeUser.first_name} {activeUser.last_name}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                margin: 0,
                fontSize: "12px",
              }}
            >
              @{activeUser.username}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <MessageList messages={chatMessages} currentUserId={user!.id} />
      </div>

      {/* Input */}
      <div
        style={{
          backgroundColor: "var(--secondary-bg)",
          borderTop: "1px solid var(--border-color)",
          padding: "15px 20px",
        }}
      >
        <MessageInput recipientId={activeChat} onTypingStart={handleTypingStart} onTypingStop={handleTypingStop} />
      </div>
    </div>
  )
}
