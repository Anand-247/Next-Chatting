"use client"

import { useChat } from "../context/ChatContext"

interface NotificationPanelProps {
  onClose: () => void
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications } = useChat()

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message_received":
        return "💬"
      case "message_read":
        return "✓✓"
      default:
        return "🔔"
    }
  }

  const getNotificationText = (notification: any) => {
    switch (notification.type) {
      case "message_received":
        return notification.message
      case "message_read":
        return notification.message
      default:
        return "New notification"
    }
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
        <h3 style={{ color: "var(--text-primary)", margin: 0, fontSize: "18px", fontWeight: "600" }}>Notifications</h3>
        <button
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "18px",
            padding: "4px",
            borderRadius: "4px",
            transition: "background-color 0.2s ease",
          }}
          onClick={onClose}
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

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                padding: "15px 20px",
                borderBottom: "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                position: "relative",
                backgroundColor: notification.is_read ? "transparent" : "rgba(142, 68, 173, 0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-bg)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.is_read
                  ? "transparent"
                  : "rgba(142, 68, 173, 0.05)"
              }}
            >
              <div style={{ fontSize: "20px", marginRight: "12px", flexShrink: 0 }}>
                {getNotificationIcon(notification.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: "500",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {getNotificationText(notification)}
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                  }}
                >
                  {formatTime(notification.timestamp)}
                </div>
              </div>

              {!notification.is_read && (
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "var(--accent-color)",
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginLeft: "8px",
                    marginTop: "4px",
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
