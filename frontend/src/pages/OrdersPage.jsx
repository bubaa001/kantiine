import React, { useState, useEffect } from 'react'
import { RefreshCw, Clock, CheckCircle } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import QRCode from 'qrcode.react'
import toast from 'react-hot-toast'

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const { user, token } = useAuth()

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
  ]

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const res = await axios.get('/api/orders/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data.results || res.data)
    } catch (err) {
      // Demo data
      setOrders([
        {
          id: 1,
          order_number: 'KAN-20260510-0001',
          status: 'preparing',
          total_amount: '25000.00',
          created_at: '2026-05-10T02:45:00Z',
          coupon_code: 'KAN-8F3K9P',
          items: [{ food_item_name: 'Ngarenaro Special', quantity: 1 }]
        },
        {
          id: 2,
          order_number: 'KAN-20260509-0012',
          status: 'completed',
          total_amount: '30000.00',
          created_at: '2026-05-09T19:20:00Z',
          items: [{ food_item_name: 'Chicken Nuggets', quantity: 1 }]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user])

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400'
      case 'paid': return 'bg-blue-500/20 text-blue-400'
      case 'preparing': return 'bg-emerald-500/20 text-emerald-400'
      case 'completed': return 'bg-green-500/20 text-green-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const showCoupon = (order) => {
    setSelectedCoupon(order)
  }

  if (!user) {
    return (
      <div className="px-6 pt-16 text-center">
        <div className="text-5xl mb-4">📋</div>
        <div className="text-xl font-semibold mb-2">Sign in to view orders</div>
        <p className="text-[#888]">Track your meals and redeem coupons here.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <div className="text-2xl font-semibold tracking-tight">My Orders</div>
          <div className="text-xs text-[#888]">{user?.first_name}'s recent activity</div>
        </div>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-1.5 text-xs bg-[#1F1F1F] px-4 h-9 rounded-full active:bg-[#333]"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs - Exact match to screenshot */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`order-tab text-sm whitespace-nowrap ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State - Exact from screenshot */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="empty-icon w-20 h-20 bg-[#1F1F1F] rounded-full flex items-center justify-center mb-6">
            <div className="text-5xl opacity-60">📦</div>
          </div>
          <div className="text-xl font-semibold">No orders available</div>
          <p className="text-[#888] mt-2 max-w-[220px]">Your order history will appear here once you place your first meal.</p>
          
          <button 
            onClick={fetchOrders}
            className="mt-8 flex items-center gap-2 border border-[#333] text-sm px-6 py-2.5 rounded-full hover:bg-[#1F1F1F]"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="food-card rounded-3xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-xs text-[#888]">{order.order_number}</div>
                  <div className="font-semibold text-lg mt-1">{order.items?.[0]?.food_item_name || 'Order'}</div>
                </div>
                
                <div className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </div>
              </div>

              <div className="flex justify-between items-end mt-5">
                <div>
                  <div className="text-xs text-[#888]">TOTAL</div>
                  <div className="font-semibold">TZS {parseInt(order.total_amount).toLocaleString()}</div>
                </div>
                
                <div className="flex gap-2">
                  {order.coupon_code && (
                    <button 
                      onClick={() => showCoupon(order)}
                      className="text-xs border border-brand-red text-brand-red px-4 py-2 rounded-full font-medium flex items-center gap-1.5"
                    >
                      <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse"></div>
                      SHOW COUPON
                    </button>
                  )}
                  <button className="text-xs bg-[#1F1F1F] px-4 py-2 rounded-full">Track</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coupon Modal with QR */}
      {selectedCoupon && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6" onClick={() => setSelectedCoupon(null)}>
          <div className="bg-[#121212] rounded-3xl p-8 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
            <div className="text-xs text-[#888] mb-1">PRESENT THIS AT COUNTER</div>
            <div className="font-mono text-3xl font-semibold tracking-[4px] mb-6 text-brand-red">{selectedCoupon.coupon_code}</div>
            
            <div className="mx-auto w-48 h-48 bg-white p-4 rounded-2xl mb-6">
              <QRCode 
                value={selectedCoupon.coupon_code} 
                size={176} 
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            
            <div className="text-sm mb-1">Order #{selectedCoupon.order_number}</div>
            <div className="text-xs text-[#888]">Valid for 4 hours from placement</div>
            
            <button 
              onClick={() => setSelectedCoupon(null)}
              className="mt-8 w-full py-3 text-sm border border-[#333] rounded-2xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage