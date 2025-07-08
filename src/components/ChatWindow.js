"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "../context/ChatContext"
import { useAuth } from "../context/AuthContext"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import "./ChatWindow.css"

const ChatWindow = () => {
  const { activeChat, users, messages, getChatId, setTyping } = useChat()
  const { user } = useAuth()
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef(null)

  const activeUser = users.find((u) => u.id === activeChat)
  const chatId = getChatId(user.id, activeChat)
  const chatMessages = messages[chatId] || []

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true)
      setTyping(activeChat, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTyping(activeChat, false)
    }, 2000)
  }

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    setTyping(activeChat, false)
  }

  if (!activeUser) {
    return (
      <div className="chat-window">
        <div className="no-chat">
          <h3>No chat selected</h3>
          <p>Select a user to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-user-info">
          <img
            src={activeUser.profile_image || "/placeholder.svg?height=40&width=40"}
            alt={`${activeUser.first_name} ${activeUser.last_name}`}
            className="chat-user-avatar"
          />
          <div className="chat-user-details">
            <h3 className="chat-user-name">
              {activeUser.first_name} {activeUser.last_name}
            </h3>
            <p className="chat-user-status">@{activeUser.username}</p>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        <MessageList messages={chatMessages} currentUserId={user.id} />
      </div>

      <div className="chat-input">
        <MessageInput recipientId={activeChat} onTypingStart={handleTypingStart} onTypingStop={handleTypingStop} />
      </div>
    </div>
  )
}

export default ChatWindow
