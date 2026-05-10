import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus } from 'lucide-react'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const starchOptions = [
  { name: 'Plantain starch', image: 'https://picsum.photos/id/1080/48/48' },
  { name: 'Ugali Dona', image: 'https://picsum.photos/id/312/48/48' },
  { name: 'Ugali Sembe', image: 'https://picsum.photos/id/292/48/48' },
  { name: 'White Rice', image: 'https://picsum.photos/id/106/48/48' },
]

const ProductDetailPage = ({ onLoginClick }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [selectedStarch, setSelectedStarch] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`/api/food-items/${id}/`)
        setItem(res.data)
        // Preselect first starch if available
        if (res.data.has_options && res.data.options?.starch) {
          setSelectedStarch(res.data.options.starch[0])
        }
      } catch (err) {
        // Demo fallback
        setItem({
          id: parseInt(id),
          name: 'Ngarenaro Special',
          price: '25000.00',
          description: '1 Fried bananas, 1 Russian Sausage, Portion of Grilled Beef, Salad. A meal for 1 person(s).',
          preparation_time_minutes: 25,
          calories: 850,
          image: 'https://picsum.photos/id/1080/600/400'
        })
        setSelectedStarch('Plantain starch')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  const handleAddToCart = () => {
    if (!user) {
      onLoginClick()
      return
    }
    const options = selectedStarch ? { starch: selectedStarch } : {}
    addToCart(item, options)
    navigate('/cart')
  }

  const totalPrice = item ? (parseFloat(item.price) * quantity) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!item) return <div className="p-6">Item not found</div>

  return (
    <div className="bg-black min-h-screen">
      {/* Hero Image */}
      <div className="relative h-[320px]">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
        
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-12 flex items-center justify-between z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/60 backdrop-blur rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-xs bg-black/70 px-3 py-1 rounded-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> 
            Ready in {item.preparation_time_minutes || 25} min
          </div>
        </div>
      </div>

      <div className="-mt-6 relative z-20 px-5 pb-28">
        <div className="bg-[#121212] rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-brand-red font-semibold tracking-[2px]">MAIN DISHES</div>
              <h1 className="text-3xl font-semibold tracking-tighter mt-1 leading-none">{item.name}</h1>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#888]">PRICE</div>
              <div className="text-2xl font-semibold text-brand-red">TZS {parseInt(item.price).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-5 text-[#CCC] leading-relaxed text-[15px]">
            {item.description}
          </div>

          {/* Starch of Choice - Exact replica */}
          {item.has_options || true && (
            <div className="mt-8">
              <div className="font-semibold mb-3 flex items-center gap-2">
                Starch of Choice
                <span className="text-[10px] bg-[#1F1F1F] px-2 py-px rounded text-[#888]">OPTIONAL</span>
              </div>
              
              <div className="space-y-2.5">
                {starchOptions.map((option, idx) => (
                  <label 
                    key={idx}
                    className={`flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-all active:scale-[0.985]
                      ${selectedStarch === option.name 
                        ? 'border-brand-red bg-[#1A1A1A]' 
                        : 'border-[#333] hover:border-[#444]'}`}
                  >
                    <input 
                      type="radio" 
                      name="starch" 
                      checked={selectedStarch === option.name}
                      onChange={() => setSelectedStarch(option.name)}
                      className="accent-brand-red w-4 h-4" 
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-[#333]">
                        <img src={option.image} alt={option.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="font-medium text-[15px]">{option.name}</div>
                    </div>
                    {selectedStarch === option.name && (
                      <div className="text-[10px] text-brand-red font-medium">SELECTED</div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mt-8 flex items-center justify-between border-t border-[#222] pt-6">
            <div>
              <div className="text-xs text-[#888]">QUANTITY</div>
              <div className="text-2xl font-semibold tabular-nums mt-1">{quantity}</div>
            </div>
            
            <div className="flex items-center gap-4 bg-[#1F1F1F] rounded-2xl p-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center text-xl active:bg-[#333] rounded-xl"
              >−</button>
              <div className="w-8 text-center font-semibold tabular-nums">{quantity}</div>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 flex items-center justify-center text-xl active:bg-[#333] rounded-xl"
              >+</button>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/95 p-4 z-50">
          <div className="max-w-md mx-auto flex gap-3">
            <div className="flex-1">
              <div className="text-[10px] text-[#888] mb-px">TOTAL TO PAY</div>
              <div className="text-3xl font-semibold tabular-nums tracking-tight">TZS {totalPrice.toLocaleString()}</div>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="btn-primary flex-1 text-base py-4 !rounded-2xl shadow-xl active:scale-[0.985]"
            >
              Add to Cart • {quantity}×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage