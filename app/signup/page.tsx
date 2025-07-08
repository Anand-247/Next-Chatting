"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../context/AuthContext"

export default function SignupPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    profileImage: null as File | null,
    chatPin: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)

  if (isAuthenticated) {
    router.push("/chat")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, profileImage: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStepSubmit = async (step: number) => {
    setIsLoading(true)
    setError("")

    try {
      let endpoint = ""
      let data: any = {}

      switch (step) {
        case 1:
          endpoint = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/signup/step1`
          data = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }
          break
        case 2:
          endpoint = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/signup/step2`
          data = {
            firstName: formData.firstName,
            lastName: formData.lastName,
          }
          break
        case 3:
          endpoint = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/signup/step3`
          const formDataObj = new FormData()
          if (formData.profileImage) {
            formDataObj.append("profileImage", formData.profileImage)
          }

          const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            body: formDataObj,
          })

          const result = await response.json()

          if (response.ok) {
            setCurrentStep(4)
          } else {
            setError(result.error)
          }
          setIsLoading(false)
          return
        case 4:
          endpoint = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/signup/step4`
          data = { chatPin: formData.chatPin }
          break
        default:
          return
      }

      if (step !== 3) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (response.ok) {
          if (step === 4) {
            router.push("/chat")
          } else {
            setCurrentStep(step + 1)
          }
        } else {
          setError(result.error)
        }
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }

    setIsLoading(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "8px", fontSize: "24px" }}>Create Your Account</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "25px", fontSize: "14px" }}>
              Step 1 of 4: Basic Information
            </p>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Choose a unique username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Create a strong password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="button"
              onClick={() => handleStepSubmit(1)}
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Continue"}
            </button>
          </div>
        )

      case 2:
        return (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "8px", fontSize: "24px" }}>
              Personal Information
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "25px", fontSize: "14px" }}>
              Step 2 of 4: Tell us about yourself
            </p>

            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your last name"
                required
              />
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => handleStepSubmit(2)}
                className="btn btn-primary"
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                {isLoading ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "8px", fontSize: "24px" }}>Profile Picture</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "25px", fontSize: "14px" }}>
              Step 3 of 4: Upload your profile image (optional)
            </p>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                  overflow: "hidden",
                  border: "3px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview || "/placeholder.svg"}
                    alt="Profile preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "var(--primary-bg)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    <span>No image selected</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Choose Profile Image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-secondary" style={{ flex: 1 }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => handleStepSubmit(3)}
                className="btn btn-primary"
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                {isLoading ? "Uploading..." : "Continue"}
              </button>
            </div>
          </div>
        )

      case 4:
        return (
          <div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "8px", fontSize: "24px" }}>Security PIN</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "25px", fontSize: "14px" }}>
              Step 4 of 4: Create a 6-digit PIN for chat access
            </p>

            <div className="form-group">
              <label className="form-label">6-Digit Chat PIN</label>
              <input
                type="password"
                name="chatPin"
                value={formData.chatPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setFormData({ ...formData, chatPin: value })
                }}
                className="form-input"
                style={{ textAlign: "center", fontSize: "24px", letterSpacing: "8px", fontFamily: "monospace" }}
                placeholder="000000"
                maxLength={6}
                required
              />
              <small style={{ display: "block", marginTop: "5px", color: "var(--text-secondary)", fontSize: "12px" }}>
                This PIN will be required every time you access the chat
              </small>
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button type="button" onClick={() => setCurrentStep(3)} className="btn btn-secondary" style={{ flex: 1 }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => handleStepSubmit(4)}
                className="btn btn-primary"
                disabled={isLoading || formData.chatPin.length !== 6}
                style={{ flex: 1 }}
              >
                {isLoading ? "Creating Account..." : "Complete Registration"}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ padding: "20px", background: "linear-gradient(135deg, var(--primary-bg) 0%, var(--secondary-bg) 100%)" }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "500px" }}>
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              width: "100%",
              height: "4px",
              backgroundColor: "var(--border-color)",
              borderRadius: "2px",
              overflow: "hidden",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: "var(--accent-color)",
                width: `${(currentStep / 4) * 100}%`,
                transition: "width 0.3s ease",
              }}
            ></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: currentStep >= step ? "var(--accent-color)" : "var(--border-color)",
                  color: currentStep >= step ? "white" : "var(--text-secondary)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {renderStep()}

        <div
          className="text-center"
          style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--accent-color)", textDecoration: "none", fontWeight: "600", marginLeft: "5px" }}
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
