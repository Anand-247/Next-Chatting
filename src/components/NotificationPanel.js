"use client"

import { useChat } from "../context/ChatContext"
import "./NotificationPanel.css"

const NotificationPanel = ({ onClose }) => {
  const { notifications } = useChat()

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message_received":
        return "💬"
      case "message_read":
        return "✓✓"
      default:
        return "🔔"
    }
  }

  const getNotificationText = (notification) => {
    switch (notification.notification_type) {
      case "message_received":
        return `New message from ${notification.sender_username}`
      case "message_read":
        return `${notification.sender_username} read your message`
      default:
        return "New notification"
    }
  }

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className={`notification-item ${notification.is_read ? "read" : "unread"}`}>
              <div className="notification-icon">{getNotificationIcon(notification.notification_type)}</div>

              <div className="notification-content">
                <div className="notification-text">{getNotificationText(notification)}</div>
                {notification.message_content && (
                  <div className="notification-preview">{notification.message_content}</div>
                )}
                <div className="notification-time">{formatTime(notification.created_at)}</div>
              </div>

              {!notification.is_read && <div className="unread-dot"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationPanel
