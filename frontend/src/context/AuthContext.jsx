import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('kantiine_token'))
  const [loading, setLoading] = useState(false)

  // Axios instance with auth
  const api = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    }
  })

  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) return
      
      try {
        const res = await api.get('/users/me/')
        setUser(res.data)
      } catch (err) {
        console.error('Token invalid, logging out')
        logout()
      }
    }
    loadUser()
  }, [token])

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await axios.post('/api/token/', { username, password })
      const newToken = res.data.access
      localStorage.setItem('kantiine_token', newToken)
      setToken(newToken)
      
      // Fetch user profile
      const userRes = await axios.get('/api/users/me/', {
        headers: { Authorization: `Bearer ${newToken}` }
      })
      setUser(userRes.data)
      
      toast.success(`Welcome back, ${userRes.data.first_name || username}!`)
      return true
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials. Try demo: joshua / student123')
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      await axios.post('/api/users/', userData)
      toast.success('Account created! Please log in.')
      return true
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || 'Registration failed'
      toast.error(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('kantiine_token')
    setToken(null)
    setUser(null)
    toast('Logged out successfully', { icon: '👋' })
  }

  const updateProfile = async (updates) => {
    try {
      const res = await api.patch(`/users/${user.id}/`, updates)
      setUser(res.data)
      toast.success('Profile updated')
      return true
    } catch (err) {
      toast.error('Failed to update profile')
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      updateProfile,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext