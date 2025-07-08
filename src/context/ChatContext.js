"use client"

import { createContext, useContext, useReducer, useEffect } from "react"
import io from "socket.io-client"
import { useAuth } from "./AuthContext"

const ChatContext = createContext()

const initialState = {
  socket: null,
  users: [],
  messages: {},
  activeChat: null,
  notifications: [],
  typingUsers: {},
  onlineUsers: new Set(),
}

const chatReducer = (state, action) => {
  switch (action.type) {
    case "SET_SOCKET":
      return { ...state, socket: action.payload }
    case "SET_USERS":
      return { ...state, users: action.payload }
    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
      }
    case "ADD_MESSAGE":
      const chatId = action.payload.chatId
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), action.payload.message],
        },
      }
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChat: action.payload }
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload }
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      }
    case "SET_TYPING":
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.userId]: action.payload.isTyping,
        },
      }
    case "SET_USER_ONLINE":
      const newOnlineUsers = new Set(state.onlineUsers)
      if (action.payload.online) {
        newOnlineUsers.add(action.payload.userId)
      } else {
        newOnlineUsers.delete(action.payload.userId)
      }
      return { ...state, onlineUsers: newOnlineUsers }
    case "UPDATE_MESSAGE":
      const updateChatId = action.payload.chatId
      return {
        ...state,
        messages: {
          ...state.messages,
          [updateChatId]:
            state.messages[updateChatId]?.map((msg) =>
              msg.id === action.payload.messageId ? { ...msg, ...action.payload.updates } : msg,
            ) || [],
        },
      }
    case "CLEAR_CHAT":
      return initialState
    default:
      return state
  }
}

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { user, isAuthenticated, pinVerified } = useAuth()

  useEffect(() => {
    if (isAuthenticated && pinVerified && user) {
      initializeSocket()
      fetchUsers()
      fetchNotifications()
    }

    return () => {
      if (state.socket) {
        state.socket.disconnect()
      }
    }
  }, [isAuthenticated, pinVerified, user])

  const initializeSocket = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]

    const socket = io(process.env.REACT_APP_SERVER_URL || "http://localhost:5000", {
      auth: { token },
    })

    socket.on("connect", () => {
      console.log("Connected to server")
    })

    socket.on("new_message", (message) => {
      const chatId = getChatId(message.sender_id, user.id)
      dispatch({
        type: "ADD_MESSAGE",
        payload: { chatId, message },
      })

      // Add notification
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: Date.now(),
          type: "message_received",
          message: `New message from ${message.sender_username}`,
          timestamp: new Date(),
        },
      })
    })

    socket.on("message_read", ({ messageId, readBy }) => {
      // Update message read status
      Object.keys(state.messages).forEach((chatId) => {
        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            chatId,
            messageId,
            updates: { is_read: true },
          },
        })
      })
    })

    socket.on("user_typing", ({ userId, isTyping }) => {
      dispatch({
        type: "SET_TYPING",
        payload: { userId, isTyping },
      })
    })

    socket.on("user_online", (userId) => {
      dispatch({
        type: "SET_USER_ONLINE",
        payload: { userId, online: true },
      })
    })

    socket.on("user_offline", (userId) => {
      dispatch({
        type: "SET_USER_ONLINE",
        payload: { userId, online: false },
      })
    })

    dispatch({ type: "SET_SOCKET", payload: socket })
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/chat/users", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ type: "SET_USERS", payload: data.users })
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`/api/chat/messages/${userId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const chatId = getChatId(user.id, userId)
        dispatch({
          type: "SET_MESSAGES",
          payload: { chatId, messages: data.messages },
        })
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const sendMessage = async (recipientId, content, messageType = "text", replyToId = null) => {
    if (!state.socket) return

    try {
      const messageData = {
        recipientId,
        content,
        messageType,
        replyToId,
      }

      // Send via socket for real-time delivery
      state.socket.emit("send_message", messageData)

      // Also send via HTTP for persistence
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(messageData),
      })

      if (response.ok) {
        const data = await response.json()
        const chatId = getChatId(user.id, recipientId)
        dispatch({
          type: "ADD_MESSAGE",
          payload: { chatId, message: data.message },
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const markMessageAsRead = async (messageId) => {
    try {
      await fetch(`/api/chat/messages/${messageId}/read`, {
        method: "PUT",
        credentials: "include",
      })

      if (state.socket) {
        state.socket.emit("mark_read", messageId)
      }
    } catch (error) {
      console.error("Failed to mark message as read:", error)
    }
  }

  const unsendMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/unsend`, {
        method: "PUT",
        credentials: "include",
      })

      if (response.ok) {
        // Update message in state
        Object.keys(state.messages).forEach((chatId) => {
          dispatch({
            type: "UPDATE_MESSAGE",
            payload: {
              chatId,
              messageId,
              updates: { content: "[message unsent]" },
            },
          })
        })
      }
    } catch (error) {
      console.error("Failed to unsend message:", error)
    }
  }

  const uploadMedia = async (file) => {
    try {
      const formData = new FormData()
      formData.append("media", file)

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error("Failed to upload media:", error)
    }
    return null
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/chat/notifications", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ type: "SET_NOTIFICATIONS", payload: data.notifications })
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const setActiveChat = (userId) => {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: userId })
    if (userId && !state.messages[getChatId(user.id, userId)]) {
      fetchMessages(userId)
    }
  }

  const setTyping = (recipientId, isTyping) => {
    if (state.socket) {
      state.socket.emit("typing", { recipientId, isTyping })
    }
  }

  const getChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("-")
  }

  const value = {
    ...state,
    sendMessage,
    markMessageAsRead,
    unsendMessage,
    uploadMedia,
    setActiveChat,
    setTyping,
    fetchMessages,
    getChatId,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
