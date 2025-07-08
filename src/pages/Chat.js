"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useChat } from "../context/ChatContext"
import UserList from "../components/UserList"
import ChatWindow from "../components/ChatWindow"
import NotificationPanel from "../components/NotificationPanel"
import "./Chat.css"

const Chat = () => {
  const { user, logout } = useAuth()
  const { users, activeChat, notifications } = useChat()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserList, setShowUserList] = useState(true)

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  const toggleUserList = () => {
    setShowUserList(!showUserList)
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={toggleUserList}>
            ☰
          </button>
          <h1>Chat App</h1>
        </div>

        <div className="header-right">
          <button className="notification-btn" onClick={toggleNotifications}>
            🔔
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <span className="notification-badge">{notifications.filter((n) => !n.is_read).length}</span>
            )}
          </button>

          <div className="user-menu">
            <img
              src={user?.profileImage || "/placeholder.svg?height=32&width=32"}
              alt="Profile"
              className="user-avatar"
            />
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="chat-body">
        <div className={`user-list-container ${showUserList ? "visible" : "hidden"}`}>
          <UserList />
        </div>

        <div className="chat-main">
          {activeChat ? (
            <ChatWindow />
          ) : (
            <div className="no-chat-selected">
              <h2>Welcome to Chat App</h2>
              <p>Select a user from the list to start chatting</p>
            </div>
          )}
        </div>

        {showNotifications && (
          <div className="notification-panel">
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
