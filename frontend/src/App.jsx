import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Home, ListOrdered, Search, ShoppingCart, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

// Pages
import HomePage from './pages/HomePage'
import OrdersPage from './pages/OrdersPage'
import SearchPage from './pages/SearchPage'
import CartPage from './pages/CartPage'
import SettingsPage from './pages/SettingsPage'
import ProductDetailPage from './pages/ProductDetailPage'

// Context
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'

// Components
import BottomNav from './components/BottomNav'
import LoginModal from './components/LoginModal'
import SellerDashboard from './pages/SellerDashboard'

function AppContent() {
  const [showLogin, setShowLogin] = useState(false)
  const [isSellerMode, setIsSellerMode] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme } = useTheme() // from context

  // Hide bottom nav on detail page and login
  const hideBottomNav = location.pathname.includes('/product/') || showLogin

  // Close hours check (07:00 - 22:00 EAT)
  const isOpen = () => {
    const hour = new Date().getHours()
    return hour >= 7 && hour < 22
  }

  return (
    <div className={`min-h-screen bg-black text-white overflow-hidden ${theme === 'light' ? 'light' : ''}`}>
      {/* Top Status Bar Simulation (mobile feel) */}
      <div className="h-11 bg-black flex items-center justify-between px-6 text-[13px] font-medium fixed top-0 left-0 right-0 z-50 border-b border-[#1F1F1F]">
        <div>3:01 AM</div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-4 h-3 border border-white rounded-sm"></div>
          </div>
          <div>94%</div>
        </div>
      </div>

      <div className="pt-11 pb-20"> {/* Padding for status + bottom nav */}
        <Routes>
          <Route path="/" element={<HomePage onLoginClick={() => setShowLogin(true)} />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage isOpen={isOpen()} onLoginClick={() => setShowLogin(true)} />} />
          <Route path="/settings" element={<SettingsPage 
            onSellerToggle={() => setIsSellerMode(!isSellerMode)} 
            isSellerMode={isSellerMode}
            onLogout={logout}
          />} />
          <Route path="/product/:id" element={<ProductDetailPage onLoginClick={() => setShowLogin(true)} />} />
          <Route path="/seller" element={user?.role === 'seller' || isSellerMode ? <SellerDashboard /> : <Navigate to="/" />} />
        </Routes>
      </div>

      {/* Bottom Navigation - Exact match to screenshots */}
      {!hideBottomNav && (
        <BottomNav 
          currentPath={location.pathname} 
          onSellerClick={() => setIsSellerMode(!isSellerMode)}
          isSellerMode={isSellerMode}
        />
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
      />

      {/* Floating Seller Toggle Indicator */}
      {isSellerMode && (
        <div className="fixed bottom-24 right-4 bg-brand-red text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg z-50">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          SELLER MODE
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App