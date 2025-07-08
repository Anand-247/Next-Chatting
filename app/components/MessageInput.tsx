"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useChat } from "../context/ChatContext"

interface MessageInputProps {
  recipientId: number
  onTypingStart: () => void
  onTypingStop: () => void
}

export default function MessageInput({ recipientId, onTypingStart, onTypingStop }: MessageInputProps) {
  const { sendMessage, uploadMedia } = useChat()
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    try {
      await sendMessage(recipientId, message.trim(), "text", replyTo?.id)
      setMessage("")
      setReplyTo(null)
      onTypingStop()
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    if (e.target.value.trim()) {
      onTypingStart()
    } else {
      onTypingStop()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const uploadResult = await uploadMedia(file)
      if (uploadResult) {
        const messageType = uploadResult.type === "image" ? "image" : "video"
        await sendMessage(recipientId, message.trim() || "", messageType, replyTo?.id, uploadResult.url)
        setMessage("")
        setReplyTo(null)
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
      alert("Failed to upload file. Please try again.")
    } finally {
      setIsUploading(false)
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    onTypingStart()
  }

  const commonEmojis = ["😀", "😂", "❤️", "👍", "👎", "😢", "😮", "😡", "🎉", "🔥"]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Reply Preview */}
      {replyTo && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(142, 68, 173, 0.1)",
            borderLeft: "3px solid var(--accent-color)",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent-color)" }}>Replying to:</span>
            <span
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {replyTo.content}
            </span>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px",
              borderRadius: "4px",
              transition: "background-color 0.2s ease",
            }}
            onClick={() => setReplyTo(null)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--border-color)"
              e.currentTarget.style.color = "var(--text-primary)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "var(--text-secondary)"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Emoji Bar */}
      <div
        style={{
          display: "flex",
          gap: "5px",
          padding: "8px 0",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {commonEmojis.map((emoji, index) => (
          <button
            key={index}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "background-color 0.2s ease",
              flexShrink: 0,
            }}
            onClick={() => handleEmojiClick(emoji)}
            type="button"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--border-color)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            backgroundColor: "var(--primary-bg)",
            border: "2px solid var(--border-color)",
            borderRadius: "25px",
            padding: "8px",
            gap: "8px",
            transition: "border-color 0.3s ease",
          }}
          onFocus={() => {
            // Focus within effect would go here
          }}
        >
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "18px",
              padding: "8px",
              borderRadius: "50%",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach file"
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = "var(--border-color)"
                e.currentTarget.style.color = "var(--text-primary)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "var(--text-secondary)"
            }}
          >
            {isUploading ? "⏳" : "📎"}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*"
            style={{ display: "none" }}
          />

          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "16px",
              padding: "8px 12px",
              outline: "none",
            }}
            disabled={isUploading}
          />

          <button
            type="submit"
            style={{
              backgroundColor: "var(--accent-color)",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
              padding: "10px",
              borderRadius: "50%",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "40px",
              minHeight: "40px",
            }}
            disabled={!message.trim() || isUploading}
            title="Send message"
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = "var(--accent-hover)"
                e.currentTarget.style.transform = "scale(1.05)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-color)"
              e.currentTarget.style.transform = "scale(1)"
            }}
          >
            {isUploading ? "⏳" : "➤"}
          </button>
        </div>
      </form>
    </div>
  )
}
