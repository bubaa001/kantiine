import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const { token, user } = useAuth()

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: token ? `Bearer ${token}` : '' }
  })

  // Load cart from localStorage (demo persistence)
  useEffect(() => {
    const savedCart = localStorage.getItem('kantiine_cart')
    if (savedCart) setCart(JSON.parse(savedCart))
    
    // Fetch wallet if logged in
    if (user) {
      fetchWallet()
    }
  }, [user])

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallets/')
      if (res.data.length > 0) {
        setWalletBalance(parseFloat(res.data[0].balance))
      }
    } catch (err) {
      console.log('Wallet fetch skipped')
    }
  }

  const addToCart = (item, selectedOptions = {}) => {
    const existing = cart.findIndex(
      i => i.id === item.id && JSON.stringify(i.selectedOptions) === JSON.stringify(selectedOptions)
    )
    
    let newCart
    if (existing >= 0) {
      newCart = [...cart]
      newCart[existing].quantity += 1
    } else {
      newCart = [...cart, { ...item, quantity: 1, selectedOptions }]
    }
    
    setCart(newCart)
    localStorage.setItem('kantiine_cart', JSON.stringify(newCart))
    toast.success(`${item.name} added to cart`, { icon: '🛒' })
  }

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
    localStorage.setItem('kantiine_cart', JSON.stringify(newCart))
  }

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return
    const newCart = [...cart]
    newCart[index].quantity = newQty
    setCart(newCart)
    localStorage.setItem('kantiine_cart', JSON.stringify(newCart))
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('kantiine_cart')
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
  }

  const placeOrder = async (walletUsed = 0) => {
    if (!user) {
      toast.error('Please log in to place order')
      return false
    }
    if (cart.length === 0) return false

    setLoading(true)
    try {
      const orderData = {
        items: cart.map(item => ({
          food_item_id: item.id,
          quantity: item.quantity,
          selected_options: item.selectedOptions || {}
        })),
        notes: '',
        wallet_used: walletUsed
      }

      const res = await api.post('/orders/', orderData)
      
      toast.success(`Order #${res.data.order_number} placed!`, { 
        duration: 5000,
        icon: '🎉'
      })
      
      clearCart()
      fetchWallet() // Refresh balance
      return res.data
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order. Please try again.'
      toast.error(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <CartContext.Provider value={{
      cart,
      walletBalance,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      placeOrder,
      fetchWallet
    }}>
      {children}
    </CartContext.Provider>
  )
}