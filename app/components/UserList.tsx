"use client"

import { useChat } from "../context/ChatContext"
import { useAuth } from "../context/AuthContext"

export default function UserList() {
  const { users, setActiveChat, activeChat, onlineUsers } = useChat()
  const { user } = useAuth()

  const handleUserClick = (selectedUser: any) => {
    setActiveChat(selectedUser.id)
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--secondary-bg)" }}>
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ color: "var(--text-primary)", margin: 0, fontSize: "18px", fontWeight: "600" }}>Contacts</h3>
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: "12px",
            backgroundColor: "var(--primary-bg)",
            padding: "4px 8px",
            borderRadius: "12px",
          }}
        >
          {onlineUsers.size} online
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {users.map((chatUser) => (
          <div
            key={chatUser.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 20px",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              borderLeft: "3px solid transparent",
              backgroundColor: activeChat === chatUser.id ? "var(--primary-bg)" : "transparent",
              borderLeftColor: activeChat === chatUser.id ? "var(--accent-color)" : "transparent",
            }}
            onClick={() => handleUserClick(chatUser)}
            onMouseEnter={(e) => {
              if (activeChat !== chatUser.id) {
                e.currentTarget.style.backgroundColor = "var(--primary-bg)"
              }
            }}
            onMouseLeave={(e) => {
              if (activeChat !== chatUser.id) {
                e.currentTarget.style.backgroundColor = "transparent"
              }
            }}
          >
            <div style={{ position: "relative", marginRight: "12px" }}>
              <img
                src={chatUser.profile_image || "/placeholder.svg?height=40&width=40"}
                alt={`${chatUser.first_name} ${chatUser.last_name}`}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--border-color)",
                }}
              />
              {onlineUsers.has(chatUser.id) && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "12px",
                    height: "12px",
                    backgroundColor: "var(--success-color)",
                    border: "2px solid var(--secondary-bg)",
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {chatUser.first_name} {chatUser.last_name}
              </div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                @{chatUser.username}
              </div>
            </div>

            {onlineUsers.has(chatUser.id) && (
              <div
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  backgroundColor: "rgba(39, 174, 96, 0.2)",
                  color: "var(--success-color)",
                }}
              >
                Online
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
            <p>No users available</p>
          </div>
        )}
      </div>
    </div>
  )
}
