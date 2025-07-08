"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import "./AdminPanel.css"

const AdminPanel = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        setError("Failed to fetch users")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const toggleUserBlock = async (userId, currentlyBlocked) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ blocked: !currentlyBlocked }),
      })

      if (response.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, is_blocked: !currentlyBlocked } : u)))
      } else {
        setError("Failed to update user status")
      }
    } catch (error) {
      setError("Network error")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>
          Welcome, {user?.firstName} {user?.lastName}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{stats.totalUsers || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Total Messages</h3>
          <div className="stat-number">{stats.totalMessages || 0}</div>
        </div>
        <div className="stat-card">
          <h3>Active Users (24h)</h3>
          <div className="stat-number">{stats.activeUsers || 0}</div>
        </div>
      </div>

      <div className="users-section">
        <h2>User Management</h2>

        <div className="users-table">
          <div className="table-header">
            <div className="header-cell">User</div>
            <div className="header-cell">Email</div>
            <div className="header-cell">Role</div>
            <div className="header-cell">Joined</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Actions</div>
          </div>

          <div className="table-body">
            {users.map((user) => (
              <div key={user.id} className="table-row">
                <div className="cell user-cell">
                  <img
                    src={user.profile_image || "/placeholder.svg?height=32&width=32"}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <div className="user-name">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="username">@{user.username}</div>
                  </div>
                </div>

                <div className="cell">{user.email}</div>

                <div className="cell">
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </div>

                <div className="cell">{formatDate(user.date_joined)}</div>

                <div className="cell">
                  <span className={`status-badge ${user.is_blocked ? "blocked" : "active"}`}>
                    {user.is_blocked ? "Blocked" : "Active"}
                  </span>
                </div>

                <div className="cell actions-cell">
                  <button
                    className={`btn ${user.is_blocked ? "btn-success" : "btn-danger"}`}
                    onClick={() => toggleUserBlock(user.id, user.is_blocked)}
                  >
                    {user.is_blocked ? "Unblock" : "Block"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
