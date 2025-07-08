"use client"

import { useState, useRef } from "react"
import { useChat } from "../context/ChatContext"
import "./MessageInput.css"

const MessageInput = ({ recipientId, onTypingStart, onTypingStop }) => {
  const { sendMessage, uploadMedia } = useChat()
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
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

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    if (e.target.value.trim()) {
      onTypingStart()
    } else {
      onTypingStop()
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
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
      e.target.value = ""
    }
  }

  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji)
    onTypingStart()
  }

  const commonEmojis = ["😀", "😂", "❤️", "👍", "👎", "😢", "😮", "😡", "🎉", "🔥"]

  return (
    <div className="message-input-container">
      {replyTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <span className="reply-label">Replying to:</span>
            <span className="reply-text">{replyTo.content}</span>
          </div>
          <button className="cancel-reply" onClick={() => setReplyTo(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="emoji-bar">
        {commonEmojis.map((emoji, index) => (
          <button key={index} className="emoji-btn" onClick={() => handleEmojiClick(emoji)} type="button">
            {emoji}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-group">
          <button
            type="button"
            className="attachment-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach file"
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
            className="message-input"
            disabled={isUploading}
          />

          <button type="submit" className="send-btn" disabled={!message.trim() || isUploading} title="Send message">
            {isUploading ? "⏳" : "➤"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MessageInput
