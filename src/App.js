import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ChatProvider } from "./context/ChatContext"
import ProtectedRoute from "./components/ProtectedRoute"
import PinOverlay from "./components/PinOverlay"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Chat from "./pages/Chat"
import AdminPanel from "./pages/AdminPanel"
import "./App.css"

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ChatProvider>
          <Router>
            <PinOverlay />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/chat" replace />} />
            </Routes>
          </Router>
        </ChatProvider>
      </AuthProvider>
    </div>
  )
}

export default App
