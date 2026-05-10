import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, CreditCard } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CartPage = ({ isOpen, onLoginClick }) => {
  const { cart, removeFromCart, updateQuantity, getTotal, placeOrder, walletBalance, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [useWallet, setUseWallet] = useState(false)
  const [placing, setPlacing] = useState(false)

  const total = getTotal()
  const walletAmount = Math.min(walletBalance, total)
  const finalTotal = useWallet ? total - walletAmount : total

  const handlePlaceOrder = async () => {
    if (!user) {
      onLoginClick()
      return
    }
    if (!isOpen) {
      toast.error("We're closed right now. Orders open at 07:00.")
      return
    }
    
    setPlacing(true)
    const result = await placeOrder(useWallet ? walletAmount : 0)
    setPlacing(false)
    
    if (result) {
      navigate('/orders')
    }
  }

  if (cart.length === 0) {
    return (
      <div className="px-6 pt-12 text-center">
        <div className="mx-auto w-20 h-20 bg-[#1F1F1F] rounded-full flex items-center justify-center mb-6">
          <CreditCard size={36} className="text-[#555]" />
        </div>
        <div className="text-xl font-semibold mb-2">Your cart is empty</div>
        <p className="text-[#888] max-w-[220px] mx-auto">Browse our popular meals and add something delicious to your cart.</p>
        
        <button 
          onClick={() => navigate('/')}
          className="mt-8 btn-primary px-10"
        >
          Browse Menu
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-2xl font-semibold tracking-tight mb-6 px-1">My Cart</div>

      {/* Closed State Banner - Exact from screenshot */}
      {!isOpen && (
        <div className="bg-[#121212] border border-[#333] rounded-3xl p-6 mb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
            <div className="text-4xl">⏰</div>
          </div>
          <div className="text-xl font-semibold">We're Closed for Now</div>
          <p className="text-sm text-[#888] mt-2 leading-snug">
            Placing new orders is currently unavailable because we are outside operating hours.<br />
            Please try again between 07:00 Hrs and 22:00 Hrs.
          </p>
          <button onClick={() => navigate('/')} className="mt-5 text-brand-red text-sm font-medium">Okay</button>
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-3 mb-6">
        {cart.map((item, index) => (
          <div key={index} className="food-card rounded-3xl p-4 flex gap-4">
            <div className="w-14 h-14 bg-[#1F1F1F] rounded-2xl overflow-hidden flex-shrink-0">
              <img src={item.image || 'https://picsum.photos/id/1080/56/56'} alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold leading-tight">{item.name}</div>
              {item.selectedOptions?.starch && (
                <div className="text-xs text-[#888] mt-0.5">{item.selectedOptions.starch}</div>
              )}
              <div className="text-brand-red font-semibold mt-1">TZS {parseInt(item.price).toLocaleString()}</div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <button onClick={() => removeFromCart(index)} className="text-[#555] active:text-red-500 p-1">
                <Trash2 size={16} />
              </button>
              
              <div className="flex items-center bg-[#1F1F1F] rounded-xl">
                <button onClick={() => updateQuantity(index, item.quantity - 1)} className="px-2 py-1 text-lg text-[#888] active:bg-[#333] rounded-l-xl">−</button>
                <div className="px-3 text-sm font-medium tabular-nums">{item.quantity}</div>
                <button onClick={() => updateQuantity(index, item.quantity + 1)} className="px-2 py-1 text-lg text-[#888] active:bg-[#333] rounded-r-xl">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wallet Toggle */}
      {user && walletBalance > 0 && (
        <div className="bg-[#121212] rounded-3xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CreditCard className="text-emerald-400" size={18} />
            </div>
            <div>
              <div className="text-sm">Apply Wallet Balance</div>
              <div className="text-xs text-[#888]">TZS {walletBalance.toLocaleString()} available</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={useWallet} 
              onChange={(e) => setUseWallet(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      )}

      {/* Summary */}
      <div className="bg-[#121212] rounded-3xl p-5 mb-6">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-[#888]">Subtotal</span>
          <span>TZS {total.toLocaleString()}</span>
        </div>
        {useWallet && (
          <div className="flex justify-between text-sm mb-3 text-emerald-400">
            <span>Wallet Applied</span>
            <span>− TZS {walletAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-3 border-t border-[#333]">
          <span className="font-medium">Total to Pay</span>
          <span className="text-3xl font-semibold tabular-nums tracking-tighter">TZS {finalTotal.toLocaleString()}</span>
        </div>
      </div>

      <button 
        onClick={handlePlaceOrder}
        disabled={placing || !isOpen}
        className="btn-primary w-full disabled:bg-[#333] disabled:text-[#666]"
      >
        {placing ? 'Placing Order...' : (isOpen ? `Place Order • TZS ${finalTotal.toLocaleString()}` : 'Closed for Orders')}
      </button>
      
      <div className="text-center text-[10px] text-[#555] mt-4">Your order will be prepared fresh upon confirmation</div>
    </div>
  )
}

export default CartPage