const express = require("express")
const db = require("../config/database")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// Get all users (admin only)
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, first_name, last_name, profile_image, 
              is_active, is_blocked, last_login, last_seen, date_joined, role
       FROM users 
       ORDER BY date_joined DESC`,
    )

    res.json({ users: result.rows })
  } catch (error) {
    res.status(500).json({ error: "Failed to get users" })
  }
})

// Block/unblock user
router.put("/users/:userId/block", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { blocked } = req.body

    await db.query("UPDATE users SET is_blocked = $1 WHERE id = $2", [blocked, userId])

    res.json({ message: `User ${blocked ? "blocked" : "unblocked"} successfully` })
  } catch (error) {
    res.status(500).json({ error: "Failed to update user status" })
  }
})

// Get system stats
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [usersResult, messagesResult, activeUsersResult] = await Promise.all([
      db.query("SELECT COUNT(*) as total_users FROM users"),
      db.query("SELECT COUNT(*) as total_messages FROM messages"),
      db.query("SELECT COUNT(*) as active_users FROM users WHERE last_seen > NOW() - INTERVAL '24 hours'"),
    ])

    res.json({
      totalUsers: Number.parseInt(usersResult.rows[0].total_users),
      totalMessages: Number.parseInt(messagesResult.rows[0].total_messages),
      activeUsers: Number.parseInt(activeUsersResult.rows[0].active_users),
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" })
  }
})

module.exports = router
