"use client"

import { useEffect, useRef } from "react"
import { useChat } from "../context/ChatContext"
import "./MessageList.css"

const MessageList = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null)
  const { markMessageAsRead, unsendMessage } = useChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Mark unread messages as read
    messages.forEach((message) => {
      if (message.recipient_id === currentUserId && !message.is_read) {
        markMessageAsRead(message.id)
      }
    })
  }, [messages, currentUserId, markMessageAsRead])

  const handleUnsendMessage = (messageId) => {
    if (window.confirm("Are you sure you want to unsend this message?")) {
      unsendMessage(messageId)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp) => {
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

  const groupMessagesByDate = (messages) => {
    const groups = {}
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
    <div className="message-list">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="date-separator">
            <span>{date}</span>
          </div>

          {dateMessages.map((message) => (
            <div key={message.id} className={`message ${message.sender_id === currentUserId ? "sent" : "received"}`}>
              {message.reply_to_id && (
                <div className="reply-preview">
                  <div className="reply-line"></div>
                  <div className="reply-content">
                    <span className="reply-author">
                      {message.reply_sender_id === currentUserId ? "You" : message.sender_username}
                    </span>
                    <span className="reply-text">{message.reply_content || "Media message"}</span>
                  </div>
                </div>
              )}

              <div className="message-content">
                {message.message_type === "text" && <p className="message-text">{message.content}</p>}

                {message.message_type === "image" && (
                  <div className="message-media">
                    <img src={message.media || "/placeholder.svg"} alt="Shared image" className="message-image" />
                    {message.content && <p className="message-caption">{message.content}</p>}
                  </div>
                )}

                {message.message_type === "video" && (
                  <div className="message-media">
                    <video controls className="message-video">
                      <source src={message.media} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {message.content && <p className="message-caption">{message.content}</p>}
                  </div>
                )}
              </div>

              <div className="message-footer">
                <span className="message-time">{formatTime(message.timestamp)}</span>
                {message.sender_id === currentUserId && (
                  <div className="message-actions">
                    {message.is_read && <span className="read-indicator">✓✓</span>}
                    <button
                      className="unsend-btn"
                      onClick={() => handleUnsendMessage(message.id)}
                      title="Unsend message"
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

export default MessageList
