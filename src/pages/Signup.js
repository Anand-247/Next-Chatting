"use client"

import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./Auth.css"

const Signup = () => {
  const { isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    profileImage: null,
    chatPin: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profileImagePreview, setProfileImagePreview] = useState(null)

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, profileImage: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStepSubmit = async (step) => {
    setIsLoading(true)
    setError("")

    try {
      let endpoint = ""
      let data = {}

      switch (step) {
        case 1:
          endpoint = "/api/auth/signup/step1"
          data = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }
          break
        case 2:
          endpoint = "/api/auth/signup/step2"
          data = {
            firstName: formData.firstName,
            lastName: formData.lastName,
          }
          break
        case 3:
          endpoint = "/api/auth/signup/step3"
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
          endpoint = "/api/auth/signup/step4"
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
            // Registration complete, redirect will happen via auth context
            window.location.href = "/chat"
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
          <div className="signup-step">
            <h2>Create Your Account</h2>
            <p>Step 1 of 4: Basic Information</p>

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
          <div className="signup-step">
            <h2>Personal Information</h2>
            <p>Step 2 of 4: Tell us about yourself</p>

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

            <div className="step-navigation">
              <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-secondary">
                Back
              </button>
              <button
                type="button"
                onClick={() => handleStepSubmit(2)}
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="signup-step">
            <h2>Profile Picture</h2>
            <p>Step 3 of 4: Upload your profile image (optional)</p>

            <div className="profile-upload">
              <div className="profile-preview">
                {profileImagePreview ? (
                  <img src={profileImagePreview || "/placeholder.svg"} alt="Profile preview" />
                ) : (
                  <div className="profile-placeholder">
                    <span>No image selected</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Choose Profile Image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" />
              </div>
            </div>

            <div className="step-navigation">
              <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-secondary">
                Back
              </button>
              <button
                type="button"
                onClick={() => handleStepSubmit(3)}
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Continue"}
              </button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="signup-step">
            <h2>Security PIN</h2>
            <p>Step 4 of 4: Create a 6-digit PIN for chat access</p>

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
                className="form-input pin-input"
                placeholder="000000"
                maxLength="6"
                required
              />
              <small className="form-help">This PIN will be required every time you access the chat</small>
            </div>

            <div className="step-navigation">
              <button type="button" onClick={() => setCurrentStep(3)} className="btn btn-secondary">
                Back
              </button>
              <button
                type="button"
                onClick={() => handleStepSubmit(4)}
                className="btn btn-primary"
                disabled={isLoading || formData.chatPin.length !== 6}
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
    <div className="auth-container">
      <div className="auth-card signup-card">
        <div className="signup-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
          </div>
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`progress-step ${currentStep >= step ? "active" : ""}`}>
                {step}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {renderStep()}

        <div className="auth-footer">
          <p>
            Already have an account?
            <Link to="/login" className="auth-link">
              {" "}
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
