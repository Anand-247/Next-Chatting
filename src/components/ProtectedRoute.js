"use client"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading, user, pinVerified } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-center" style={{ height: "100vh" }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!pinVerified) {
    // PIN overlay will handle this
    return children
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/chat" replace />
  }

  return children
}

export default ProtectedRoute
