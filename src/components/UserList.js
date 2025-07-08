"use client"

import { useChat } from "../context/ChatContext"
import { useAuth } from "../context/AuthContext"
import "./UserList.css"

const UserList = () => {
  const { users, setActiveChat, activeChat, onlineUsers } = useChat()
  const { user } = useAuth()

  const handleUserClick = (selectedUser) => {
    setActiveChat(selectedUser.id)
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Contacts</h3>
        <span className="online-count">{onlineUsers.size} online</span>
      </div>

      <div className="user-list-body">
        {users.map((chatUser) => (
          <div
            key={chatUser.id}
            className={`user-item ${activeChat === chatUser.id ? "active" : ""}`}
            onClick={() => handleUserClick(chatUser)}
          >
            <div className="user-avatar-container">
              <img
                src={chatUser.profile_image || "/placeholder.svg?height=40&width=40"}
                alt={`${chatUser.first_name} ${chatUser.last_name}`}
                className="user-avatar"
              />
              {onlineUsers.has(chatUser.id) && <div className="online-indicator"></div>}
            </div>

            <div className="user-info">
              <div className="user-name">
                {chatUser.first_name} {chatUser.last_name}
              </div>
              <div className="user-username">@{chatUser.username}</div>
            </div>

            {onlineUsers.has(chatUser.id) && <div className="status-badge online">Online</div>}
          </div>
        ))}

        {users.length === 0 && (
          <div className="no-users">
            <p>No users available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserList
