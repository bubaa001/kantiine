import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const SellerDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([])
  const [stats, setStats] = useState({ pending: 0, preparing: 0, today: 0, students: 124 })
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  const fetchPending = async () => {
    try {
      const res = await axios.get('/api/orders/pending_approval/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPendingOrders(res.data)
      
      // Mock stats
      setStats({
        pending: res.data.length,
        preparing: 7,
        today: 42,
        students: 124
      })
    } catch (err) {
      setPendingOrders([
        { id: 1, order_number: 'KAN-20260510-0001', customer_name: 'Joshua John', total_amount: '25000.00', items: [{ food_item_name: 'Ngarenaro Special' }] }
      ])
    } finally {
      setLoading(false)
    }
  }

  const approveOrder = async (orderId, amountPaid) => {
    try {
      await axios.post(`/api/orders/${orderId}/approve_payment/`, 
        { amount_paid: amountPaid || 25000 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Payment approved! Coupon sent to student.')
      fetchPending()
    } catch (err) {
      toast.error('Approval failed. Try again.')
    }
  }

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 15000) // Poll every 15s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs text-emerald-400 font-medium tracking-[1px]">CASHIER DASHBOARD</div>
          <div className="text-3xl font-semibold tracking-tight">Rico Canteen</div>
        </div>
        <div className="text-right text-xs text-[#888]">Live • {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { label: 'Pending Approvals', value: stats.pending, color: 'text-amber-400' },
          { label: 'In Preparation', value: stats.preparing, color: 'text-emerald-400' },
          { label: 'Orders Today', value: stats.today, color: 'text-white' },
          { label: 'Registered Students', value: stats.students, color: 'text-white' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#121212] rounded-3xl p-5">
            <div className="text-xs text-[#888]">{stat.label}</div>
            <div className={`text-4xl font-semibold tabular-nums mt-2 ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="font-semibold text-sm mb-3 px-1 flex items-center justify-between">
        PENDING PAYMENT APPROVALS
        <span className="text-xs text-[#888] font-normal">Tap to approve</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[#666]">Loading queue...</div>
      ) : pendingOrders.length === 0 ? (
        <div className="bg-[#121212] rounded-3xl p-8 text-center">
          <div className="text-4xl mb-3 opacity-50">✅</div>
          <div className="font-medium">All caught up!</div>
          <div className="text-xs text-[#888] mt-1">No pending orders at the moment.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingOrders.map(order => (
            <div key={order.id} className="food-card rounded-3xl p-5 active:scale-[0.985]">
              <div className="flex justify-between">
                <div>
                  <div className="font-mono text-xs text-[#888]">{order.order_number}</div>
                  <div className="font-semibold mt-1">{order.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#888]">AMOUNT DUE</div>
                  <div className="text-xl font-semibold text-brand-red">TZS {parseInt(order.total_amount).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#222] flex items-center justify-between text-xs">
                <div className="text-[#888]">{order.items?.[0]?.food_item_name}</div>
                
                <button 
                  onClick={() => approveOrder(order.id, order.total_amount)}
                  className="bg-emerald-600 hover:bg-emerald-500 transition text-white text-xs font-semibold px-6 py-2 rounded-full"
                >
                  APPROVE CASH PAYMENT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-[10px] text-[#444]">Demo seller mode • Backend connected to Kantiine API</div>
    </div>
  )
}

export default SellerDashboard