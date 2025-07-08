"use client"

import { createContext, useContext, useReducer, useEffect } from "react"

const AuthContext = createContext()

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  pinVerified: false,
  showPinOverlay: false,
}

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        showPinOverlay: true,
        pinVerified: false,
      }
    case "LOGOUT":
      return {
        ...initialState,
        isLoading: false,
      }
    case "PIN_VERIFIED":
      return {
        ...state,
        pinVerified: true,
        showPinOverlay: false,
      }
    case "SHOW_PIN_OVERLAY":
      return {
        ...state,
        showPinOverlay: true,
        pinVerified: false,
      }
    case "HIDE_PIN_OVERLAY":
      return {
        ...state,
        showPinOverlay: false,
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ type: "LOGIN_SUCCESS", payload: data.user })
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        dispatch({ type: "LOGIN_SUCCESS", payload: data.user })
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      dispatch({ type: "LOGOUT" })
    }
  }

  const verifyPin = async (pin) => {
    try {
      const response = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pin }),
      })

      if (response.ok) {
        dispatch({ type: "PIN_VERIFIED" })
        return { success: true }
      } else {
        const data = await response.json()
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: "Network error" }
    }
  }

  const showPinOverlay = () => {
    dispatch({ type: "SHOW_PIN_OVERLAY" })
  }

  const value = {
    ...state,
    login,
    logout,
    verifyPin,
    showPinOverlay,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
