"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  profileImage: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  pinVerified: boolean
  showPinOverlay: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  verifyPin: (pin: string) => Promise<{ success: boolean; error?: string }>
  showPinOverlay: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  pinVerified: false,
  showPinOverlay: false,
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGOUT" }
  | { type: "PIN_VERIFIED" }
  | { type: "SHOW_PIN_OVERLAY" }
  | { type: "HIDE_PIN_OVERLAY" }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/login`, {
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
      await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      dispatch({ type: "LOGOUT" })
    }
  }

  const verifyPin = async (pin: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/verify-pin`, {
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

  const showPinOverlayFn = () => {
    dispatch({ type: "SHOW_PIN_OVERLAY" })
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    verifyPin,
    showPinOverlay: showPinOverlayFn,
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
