"use client"

import { useEffect, useRef } from "react"
import { useChat } from "../context/ChatContext"

interface MessageListProps {
  messages: any[]
  currentUserId: number
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { markMessageAsRead, unsendMessage } = useChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    messages.forEach((message) => {
      if (message.recipient_id === currentUserId && !message.is_read) {
        markMessageAsRead(message.id)
      }
    })
  }, [messages, currentUserId, markMessageAsRead])

  const handleUnsendMessage = (messageId: number) => {
    if (window.confirm("Are you sure you want to unsend this message?")) {
      unsendMessage(messageId)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages: any[]) => {
    const groups: Record<string, any[]> = {}
    messages.forEach((message) => {
      const date = formatDate(message.timestamp)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date Separator */}
          <div
            style={{
              textAlign: "center",
              margin: "20px 0",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "1px",
                backgroundColor: "var(--border-color)",
              }}
            />
            <span
              style={{
                backgroundColor: "var(--primary-bg)",
                color: "var(--text-secondary)",
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: "600",
                borderRadius: "12px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {date}
            </span>
          </div>

          {dateMessages.map((message) => (
            <div
              key={message.id}
              style={{
                maxWidth: "70%",
                marginBottom: "8px",
                display: "flex",
                flexDirection: "column",
                alignSelf: message.sender_id === currentUserId ? "flex-end" : "flex-start",
              }}
            >
              {/* Reply Preview */}
              {message.reply_to_id && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    marginBottom: "8px",
                    padding: "8px 12px",
                    backgroundColor: "rgba(142, 68, 173, 0.1)",
                    borderRadius: "8px",
                    borderLeft: "3px solid var(--accent-color)",
                  }}
                >
                  <div
                    style={{
                      width: "2px",
                      backgroundColor: "var(--accent-color)",
                      minHeight: "20px",
                      borderRadius: "1px",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--accent-color)",
                      }}
                    >
                      {message.reply_sender_id === currentUserId ? "You" : message.sender_username}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {message.reply_content || "Media message"}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div
                style={{
                  backgroundColor: message.sender_id === currentUserId ? "var(--accent-color)" : "var(--secondary-bg)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  position: "relative",
                  color: message.sender_id === currentUserId ? "white" : "var(--text-primary)",
                }}
              >
                {message.message_type === "text" && (
                  <p style={{ margin: 0, wordWrap: "break-word", lineHeight: 1.4 }}>{message.content}</p>
                )}

                {message.message_type === "image" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <img
                      src={message.media || "/placeholder.svg"}
                      alt="Shared image"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                    {message.content && (
                      <p style={{ margin: 0, fontSize: "14px", wordWrap: "break-word" }}>{message.content}</p>
                    )}
                  </div>
                )}

                {message.message_type === "video" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <video
                      controls
                      style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
                      }}
                    >
                      <source src={message.media} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {message.content && (
                      <p style={{ margin: 0, fontSize: "14px", wordWrap: "break-word" }}>{message.content}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Message Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "4px",
                  padding: "0 4px",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {formatTime(message.timestamp)}
                </span>
                {message.sender_id === currentUserId && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0"
                    }}
                  >
                    {message.is_read && <span style={{ fontSize: "12px", color: "var(--success-color)" }}>✓✓</span>}
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "2px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleUnsendMessage(message.id)}
                      title="Unsend message"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--border-color)"
                        e.currentTarget.style.color = "var(--text-primary)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.color = "var(--text-secondary)"
                      }}
                    >
                      ↶
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  )
}
