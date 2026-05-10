import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Clock, Users } from 'lucide-react'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const HomePage = ({ onLoginClick }) => {
  const [categories, setCategories] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [newItems, setNewItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, foodRes] = await Promise.all([
          axios.get('/api/categories/'),
          axios.get('/api/food-items/')
        ])
        
        setCategories(catRes.data.results || catRes.data)
        
        const foods = foodRes.data.results || foodRes.data
        setPopularItems(foods.filter(f => f.is_popular).slice(0, 4))
        setNewItems(foods.filter(f => f.is_new).slice(0, 3))
      } catch (err) {
        // Fallback demo data if backend not reachable
        setCategories([
          { id: 1, name: 'Main Dishes', slug: 'main-dishes' },
          { id: 2, name: 'Rico Burgers', slug: 'rico-burgers' },
          { id: 3, name: 'Rico BBQ', slug: 'rico-bbq' },
          { id: 4, name: 'Beverages', slug: 'beverages' },
          { id: 5, name: 'Desserts', slug: 'desserts' },
        ])
        setPopularItems([
          { id: 1, name: 'Ngarenaro Special', price: '25000.00', description: '1 Fried bananas, 1 Russian Sausage, Portion of Grilled Beef, Salad.', image: 'https://picsum.photos/id/1080/400/300', is_popular: true },
          { id: 2, name: 'Rico Classic Burger', price: '18000.00', description: 'Beef patty, cheese, lettuce, tomato, special sauce', image: 'https://picsum.photos/id/106/400/300', is_popular: true },
        ])
        setNewItems([
          { id: 3, name: 'Chicken Nuggets', price: '30000.00', description: 'Rico Signature Chicken Nuggets with multi sauces', image: 'https://picsum.photos/id/292/400/300', is_new: true },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddToCart = (item, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      onLoginClick()
      return
    }
    addToCart(item)
  }

  const formatPrice = (price) => {
    return `TZS ${parseInt(price).toLocaleString()}`
  }

  return (
    <div className="px-4 pb-6">
      {/* Header with location */}
      <div className="flex items-center justify-between pt-4 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#888]">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            OPEN • 07:00 — 22:00
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-semibold">Mwenge</span>
            <span className="text-xs bg-[#1F1F1F] px-2 py-0.5 rounded">▼</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#888]">Good morning,</div>
          <div className="font-medium">{user?.first_name || 'Student'}</div>
        </div>
      </div>

      {/* Categories - Horizontal Scroll Circles (exact match) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-sm font-semibold text-[#888]">CATEGORIES</div>
          <Link to="/search" className="text-xs text-brand-red">See all →</Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
          {categories.map((cat, index) => (
            <div 
              key={cat.id} 
              className="flex-shrink-0 flex flex-col items-center w-16"
              onClick={() => navigate(`/search?category=${cat.slug}`)}
            >
              <div className="category-circle w-14 h-14 rounded-full border-2 border-[#333] overflow-hidden mb-1.5">
                <img 
                  src={`https://picsum.photos/id/${30 + index}/56/56`} 
                  alt={cat.name}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="text-[10px] text-center leading-tight font-medium">{cat.name.split(' ').slice(0,2).join(' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Meals Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="font-semibold text-lg">Popular Meals</div>
          <Link to="/search?popular=true" className="text-xs text-brand-red flex items-center gap-1">See all →</Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {popularItems.map((item) => (
            <Link 
              key={item.id} 
              to={`/product/${item.id}`}
              className="food-card rounded-3xl overflow-hidden block"
            >
              <div className="relative h-36">
                <img 
                  src={item.image || `https://picsum.photos/id/1080/300/200`} 
                  alt={item.name} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-3 right-3 bg-black/70 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={10} /> 25 min
                </div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-[15px] leading-tight mb-1 pr-6">{item.name}</div>
                <div className="text-xs text-[#888] line-clamp-2 mb-3">{item.description}</div>
                
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-brand-red">
                    {formatPrice(item.price)}
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(item, e)}
                    className="bg-brand-red text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1 active:scale-95"
                  >
                    <Plus size={14} /> ADD
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Invite Banner - Exact from screenshot */}
      <div className="bg-gradient-to-r from-brand-red to-[#CC0000] rounded-3xl p-6 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="font-semibold text-2xl leading-none tracking-tighter">Get Discounts When<br />You Invite a Friend!</div>
          <div className="mt-2 text-sm opacity-90">Every successful invite gets you and your friend a sweet discount.</div>
          
          <button className="mt-5 bg-white text-brand-red text-sm font-semibold px-8 py-2.5 rounded-full">
            Invite Now
          </button>
        </div>
        <div className="absolute -right-6 -bottom-6 text-[120px] opacity-10">🎁</div>
      </div>

      {/* Our New Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="font-semibold text-lg">Our New Items</div>
          <Link to="/search?new=true" className="text-xs text-brand-red">See all →</Link>
        </div>

        <div className="space-y-3">
          {newItems.map((item) => (
            <Link 
              key={item.id} 
              to={`/product/${item.id}`}
              className="food-card rounded-3xl p-4 flex gap-4 items-center active:bg-[#1A1A1A]"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={item.image || 'https://picsum.photos/id/292/64/64'} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-[#888] line-clamp-1 mt-0.5">{item.description}</div>
                <div className="text-brand-red font-semibold mt-1 text-sm">{formatPrice(item.price)}</div>
              </div>
              <button 
                onClick={(e) => handleAddToCart(item, e)}
                className="btn-primary text-xs px-5 py-2 !rounded-2xl"
              >
                Add
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Offers Banner */}
      <div className="bg-[#1F1F1F] rounded-3xl p-5 text-center mb-6 border border-[#333]">
        <div className="text-4xl mb-2">🍔</div>
        <div className="font-bold text-xl tracking-tighter">"BUY 1 BURGER<br />GET 1 FREE"</div>
        <div className="text-xs text-[#888] mt-2">Valid on all Rico Burgers • Today only</div>
      </div>

      <div className="h-8"></div>
    </div>
  )
}

export default HomePage