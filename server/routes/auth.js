const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { v2: cloudinary } = require("cloudinary")
const multer = require("multer")
const db = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
})

// Step 1: Basic info
router.post("/signup/step1", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    // Check if user already exists
    const existingUser = await db.query("SELECT * FROM users WHERE email = $1 OR username = $2", [email, username])

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Store in session or temporary storage
    req.session = req.session || {}
    req.session.signupData = { username, email, password }

    res.json({ message: "Step 1 completed", nextStep: 2 })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

// Step 2: Personal info
router.post("/signup/step2", async (req, res) => {
  try {
    const { firstName, lastName } = req.body

    req.session = req.session || {}
    req.session.signupData = {
      ...req.session.signupData,
      firstName,
      lastName,
    }

    res.json({ message: "Step 2 completed", nextStep: 3 })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

// Step 3: Profile image upload
router.post("/signup/step3", upload.single("profileImage"), async (req, res) => {
  try {
    let profileImageUrl = "images/laddu.png" // default

    if (req.file) {
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "auto", folder: "chat-app/profiles" }, (error, result) => {
            if (error) reject(error)
            else resolve(result)
          })
          .end(req.file.buffer)
      })

      profileImageUrl = result.secure_url
    }

    req.session = req.session || {}
    req.session.signupData = {
      ...req.session.signupData,
      profileImage: profileImageUrl,
    }

    res.json({ message: "Step 3 completed", nextStep: 4, profileImageUrl })
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" })
  }
})

// Step 4: Chat PIN and complete registration
router.post("/signup/step4", async (req, res) => {
  try {
    const { chatPin } = req.body

    if (!chatPin || chatPin.toString().length !== 6) {
      return res.status(400).json({ error: "PIN must be 6 digits" })
    }

    const signupData = req.session?.signupData
    if (!signupData) {
      return res.status(400).json({ error: "Session expired. Please start over." })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupData.password, 10)

    // Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password, first_name, last_name, profile_image, chat_pin)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, first_name, last_name, profile_image, role`,
      [
        signupData.username,
        signupData.email,
        hashedPassword,
        signupData.firstName,
        signupData.lastName,
        signupData.profileImage,
        Number.parseInt(chatPin),
      ],
    )

    const user = result.rows[0]

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Clear session
    delete req.session.signupData

    res.json({
      message: "Registration completed successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImage: user.profile_image,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Registration failed" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email])
    const user = result.rows[0]

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    if (user.is_blocked) {
      return res.status(403).json({ error: "Account is blocked" })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Update last login
    await db.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [user.id])

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: false,
      // httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImage: user.profile_image,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Login failed" })
  }
})

// Verify PIN
router.post("/verify-pin", authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body

    const result = await db.query("SELECT chat_pin FROM users WHERE id = $1", [req.user.userId])
    const user = result.rows[0]

    if (!user || user.chat_pin !== Number.parseInt(pin)) {
      return res.status(400).json({ error: "Invalid PIN" })
    }

    res.json({ message: "PIN verified successfully" })
  } catch (error) {
    res.status(500).json({ error: "PIN verification failed" })
  }
})

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, email, first_name, last_name, profile_image, role FROM users WHERE id = $1",
      [req.user.userId],
    )

    const user = result.rows[0]
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: "Failed to get user data" })
  }
})

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token")
  res.json({ message: "Logged out successfully" })
})

module.exports = router
