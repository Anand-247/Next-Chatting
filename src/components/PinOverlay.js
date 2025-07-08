"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import "./PinOverlay.css"

const PinOverlay = () => {
  const { showPinOverlay, verifyPin } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  if (!showPinOverlay) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (pin.length !== 6) {
      setError("PIN must be 6 digits")
      return
    }

    setIsLoading(true)
    setError("")

    const result = await verifyPin(pin)

    if (!result.success) {
      setError(result.error)
      setPin("")
    }

    setIsLoading(false)
  }

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setPin(value)
    setError("")
  }

  return (
    <div className="pin-overlay">
      <div className="pin-modal">
        <div className="pin-header">
          <h2>Enter Your Chat PIN</h2>
          <p>Please enter your 6-digit PIN to access the chat</p>
        </div>

        <form onSubmit={handleSubmit} className="pin-form">
          <div className="pin-input-container">
            <input
              type="password"
              value={pin}
              onChange={handlePinChange}
              placeholder="000000"
              className="pin-input"
              maxLength="6"
              autoFocus
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading || pin.length !== 6}>
            {isLoading ? "Verifying..." : "Verify PIN"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PinOverlay
