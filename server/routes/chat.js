const express = require("express")
const { v2: cloudinary } = require("cloudinary")
const multer = require("multer")
const db = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

// Get all users (for chat list)
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, first_name, last_name, profile_image, last_seen, is_active 
       FROM users 
       WHERE id != $1 AND is_blocked = false 
       ORDER BY last_seen DESC`,
      [req.user.userId],
    )

    res.json({ users: result.rows })
  } catch (error) {
    res.status(500).json({ error: "Failed to get users" })
  }
})

// Get messages between two users
router.get("/messages/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    const result = await db.query(
      `SELECT m.*, 
              s.username as sender_username, s.profile_image as sender_image,
              r.username as recipient_username, r.profile_image as recipient_image,
              reply.content as reply_content, reply.sender_id as reply_sender_id
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.recipient_id = r.id
       LEFT JOIN messages reply ON m.reply_to_id = reply.id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2) 
          OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.timestamp DESC
       LIMIT $3 OFFSET $4`,
      [req.user.userId, userId, limit, offset],
    )

    res.json({ messages: result.rows.reverse() })
  } catch (error) {
    res.status(500).json({ error: "Failed to get messages" })
  }
})

// Send message
router.post("/messages", authenticateToken, async (req, res) => {
  try {
    const { recipientId, content, messageType = "text", replyToId } = req.body

    const result = await db.query(
      `INSERT INTO messages (sender_id, recipient_id, content, message_type, reply_to_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, recipientId, content, messageType, replyToId],
    )

    const message = result.rows[0]

    // Create notification
    await db.query(
      `INSERT INTO notifications (user_id, sender_id, message_id, notification_type)
       VALUES ($1, $2, $3, 'message_received')`,
      [recipientId, req.user.userId, message.id],
    )

    res.json({ message })
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" })
  }
})

// Upload media
router.post("/upload", authenticateToken, upload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "chat-app/media",
            transformation: req.file.mimetype.startsWith("image/")
              ? [{ width: 800, height: 600, crop: "limit" }]
              : undefined,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(req.file.buffer)
    })

    res.json({
      url: result.secure_url,
      type: result.resource_type,
      publicId: result.public_id,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to upload media" })
  }
})

// Mark message as read
router.put("/messages/:messageId/read", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params

    await db.query("UPDATE messages SET is_read = true WHERE id = $1 AND recipient_id = $2", [
      messageId,
      req.user.userId,
    ])

    // Create read notification
    await db.query(
      `INSERT INTO notifications (user_id, sender_id, message_id, notification_type)
       SELECT sender_id, $1, $2, 'message_read'
       FROM messages WHERE id = $2`,
      [req.user.userId, messageId],
    )

    res.json({ message: "Message marked as read" })
  } catch (error) {
    res.status(500).json({ error: "Failed to mark message as read" })
  }
})

// Unsend message
router.put("/messages/:messageId/unsend", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params

    const result = await db.query("UPDATE messages SET content = $1 WHERE id = $2 AND sender_id = $3 RETURNING *", [
      "[message unsent]",
      messageId,
      req.user.userId,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found or unauthorized" })
    }

    res.json({ message: "Message unsent successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to unsend message" })
  }
})

// Get notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.*, 
              s.username as sender_username, s.profile_image as sender_image,
              m.content as message_content
       FROM notifications n
       LEFT JOIN users s ON n.sender_id = s.id
       LEFT JOIN messages m ON n.message_id = m.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.userId],
    )

    res.json({ notifications: result.rows })
  } catch (error) {
    res.status(500).json({ error: "Failed to get notifications" })
  }
})

// Mark notification as read
router.put("/notifications/:notificationId/read", authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params

    await db.query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2", [
      notificationId,
      req.user.userId,
    ])

    res.json({ message: "Notification marked as read" })
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" })
  }
})

module.exports = router
