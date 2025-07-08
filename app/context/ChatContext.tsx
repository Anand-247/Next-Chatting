"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./AuthContext"
import Cookies from "js-cookie";

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  profile_image: string
  last_seen: string
  is_active: boolean
}

interface Message {
  id: number
  sender_id: number
  recipient_id: number
  content: string
  media?: string
  message_type: string
  timestamp: string
  is_read: boolean
  reply_to_id?: number
  sender_username?: string
  reply_content?: string
  reply_sender_id?: number
}

interface Notification {
  id: number
  type: string
  message: string
  timestamp: Date
  is_read: boolean
}

interface ChatState {
  socket: Socket | null
  users: User[]
  messages: Record<string, Message[]>
  activeChat: number | null
  notifications: Notification[]
  typingUsers: Record<number, boolean>
  onlineUsers: Set<number>
}

interface ChatContextType extends ChatState {
  sendMessage: (
    recipientId: number,
    content: string,
    messageType?: string,
    replyToId?: number,
    media?: string,
  ) => Promise<void>
  markMessageAsRead: (messageId: number) => Promise<void>
  unsendMessage: (messageId: number) => Promise<void>
  uploadMedia: (file: File) => Promise<any>
  setActiveChat: (userId: number | null) => void
  setTyping: (recipientId: number, isTyping: boolean) => void
  fetchMessages: (userId: number) => Promise<void>
  getChatId: (userId1: number, userId2: number) => string
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const initialState: ChatState = {
  socket: null,
  users: [],
  messages: {},
  activeChat: null,
  notifications: [],
  typingUsers: {},
  onlineUsers: new Set(),
}

type ChatAction =
  | { type: "SET_SOCKET"; payload: Socket | null }
  | { type: "SET_USERS"; payload: User[] }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "SET_ACTIVE_CHAT"; payload: number | null }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "SET_TYPING"; payload: { userId: number; isTyping: boolean } }
  | { type: "SET_USER_ONLINE"; payload: { userId: number; online: boolean } }
  | { type: "UPDATE_MESSAGE"; payload: { chatId: string; messageId: number; updates: Partial<Message> } }
  | { type: "CLEAR_CHAT" }

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
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

export const ChatProvider = ({ children }: { children: ReactNode }) => {
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
    const token = Cookies.get("token");
    const socket = io(process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000", {
      auth: { token },
    });
  

    socket.on("connect", () => {
      console.log("Connected to server")
    })

    socket.on("new_message", (message: Message) => {
      const chatId = getChatId(message.sender_id, user!.id)
      dispatch({
        type: "ADD_MESSAGE",
        payload: { chatId, message },
      })

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: Date.now(),
          type: "message_received",
          message: `New message from ${message.sender_username}`,
          timestamp: new Date(),
          is_read: false,
        },
      })
    })

    socket.on("user_online", (userId: number) => {
      dispatch({
        type: "SET_USER_ONLINE",
        payload: { userId, online: true },
      })
    })

    socket.on("user_offline", (userId: number) => {
      dispatch({
        type: "SET_USER_ONLINE",
        payload: { userId, online: false },
      })
    })

    dispatch({ type: "SET_SOCKET", payload: socket })
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/users`, {
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

  const fetchMessages = async (userId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/messages/${userId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const chatId = getChatId(user!.id, userId)
        dispatch({
          type: "SET_MESSAGES",
          payload: { chatId, messages: data.messages },
        })
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const sendMessage = async (
    recipientId: number,
    content: string,
    messageType = "text",
    replyToId?: number,
    media?: string,
  ) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipientId,
          content,
          messageType,
          replyToId,
          media,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const chatId = getChatId(user!.id, recipientId)
        dispatch({
          type: "ADD_MESSAGE",
          payload: { chatId, message: data.message },
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const markMessageAsRead = async (messageId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/messages/${messageId}/read`, {
        method: "PUT",
        credentials: "include",
      })
    } catch (error) {
      console.error("Failed to mark message as read:", error)
    }
  }

  const unsendMessage = async (messageId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/messages/${messageId}/unsend`, {
        method: "PUT",
        credentials: "include",
      })

      if (response.ok) {
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

  const uploadMedia = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("media", file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/upload`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/notifications`, {
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

  const setActiveChat = (userId: number | null) => {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: userId })
    if (userId && !state.messages[getChatId(user!.id, userId)]) {
      fetchMessages(userId)
    }
  }

  const setTyping = (recipientId: number, isTyping: boolean) => {
    if (state.socket) {
      state.socket.emit("typing", { recipientId, isTyping })
    }
  }

  const getChatId = (userId1: number, userId2: number) => {
    return [userId1, userId2].sort().join("-")
  }

  const value: ChatContextType = {
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
