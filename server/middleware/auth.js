const jwt = require("jsonwebtoken")
const db = require("../config/database")

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if user is blocked
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [decoded.userId])
    const user = userResult.rows[0]

    if (!user || user.is_blocked) {
      return res.status(403).json({ error: "Access denied. User blocked." })
    }

    req.user = decoded
    next()
  } catch (error) {
    res.status(400).json({ error: "Invalid token." })
  }
}

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error"))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if user is blocked
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [decoded.userId])
    const user = userResult.rows[0]

    if (!user || user.is_blocked) {
      return next(new Error("User blocked"))
    }

    socket.userId = decoded.userId
    socket.userRole = decoded.role
    next()
  } catch (error) {
    next(new Error("Authentication error"))
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." })
  }
  next()
}

module.exports = {
  authenticateToken,
  authenticateSocket,
  requireAdmin,
}
