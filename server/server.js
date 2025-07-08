const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const path = require("path")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const chatRoutes = require("./routes/chat")
const adminRoutes = require("./routes/admin")
const { authenticateSocket } = require("./middleware/auth")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
})

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_session_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/admin", adminRoutes)

// Socket.io connection handling
const connectedUsers = new Map()

io.use(authenticateSocket)

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId)

  // Store user connection
  connectedUsers.set(socket.userId, socket.id)

  // Update user's last seen
  socket.broadcast.emit("user_online", socket.userId)

  // Join user to their personal room
  socket.join(`user_${socket.userId}`)

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { recipientId, content, messageType, media, replyToId } = data

      // Save message to database (you'll need to implement this)
      const message = await saveMessage({
        senderId: socket.userId,
        recipientId,
        content,
        messageType,
        media,
        replyToId,
      })

      // Send to recipient if online
      const recipientSocketId = connectedUsers.get(recipientId)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("new_message", message)
      }

      // Send back to sender for confirmation
      socket.emit("message_sent", message)

      // Create notification
      await createNotification({
        userId: recipientId,
        senderId: socket.userId,
        messageId: message.id,
        type: "message_received",
      })
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  // Handle message read receipts
  socket.on("mark_read", async (messageId) => {
    try {
      await markMessageAsRead(messageId, socket.userId)

      // Notify sender about read receipt
      const message = await getMessageById(messageId)
      const senderSocketId = connectedUsers.get(message.sender_id)
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_read", { messageId, readBy: socket.userId })
      }
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  })

  // Handle typing indicators
  socket.on("typing", (data) => {
    const recipientSocketId = connectedUsers.get(data.recipientId)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("user_typing", {
        userId: socket.userId,
        isTyping: data.isTyping,
      })
    }
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId)
    connectedUsers.delete(socket.userId)
    socket.broadcast.emit("user_offline", socket.userId)
  })
})

// Database helper functions
async function saveMessage(messageData) {
  const db = require("./config/database")
  try {
    const result = await db.query(
      `INSERT INTO messages (sender_id, recipient_id, content, message_type, media, reply_to_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        messageData.senderId,
        messageData.recipientId,
        messageData.content,
        messageData.messageType || "text",
        messageData.media || null,
        messageData.replyToId || null,
      ],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Error saving message:", error)
    throw error
  }
}

async function createNotification(notificationData) {
  const db = require("./config/database")
  try {
    await db.query(
      `INSERT INTO notifications (user_id, sender_id, message_id, notification_type)
       VALUES ($1, $2, $3, $4)`,
      [notificationData.userId, notificationData.senderId, notificationData.messageId, notificationData.type],
    )
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

async function markMessageAsRead(messageId, userId) {
  const db = require("./config/database")
  try {
    await db.query("UPDATE messages SET is_read = true WHERE id = $1 AND recipient_id = $2", [messageId, userId])
  } catch (error) {
    console.error("Error marking message as read:", error)
  }
}

async function getMessageById(messageId) {
  const db = require("./config/database")
  try {
    const result = await db.query("SELECT * FROM messages WHERE id = $1", [messageId])
    return result.rows[0]
  } catch (error) {
    console.error("Error getting message:", error)
    return null
  }
}

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
