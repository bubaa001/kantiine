import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'

const SearchPage = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [allItems, setAllItems] = useState([])
  const { addToCart } = useCart()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get('/api/food-items/')
        setAllItems(res.data.results || res.data)
      } catch (err) {
        setAllItems([
          { id: 1, name: 'Ngarenaro Special', price: '25000.00', description: 'Fried bananas, Russian Sausage, Grilled Beef', category_name: 'Main Dishes' },
          { id: 3, name: 'Chicken Nuggets', price: '30000.00', description: 'Signature chicken nuggets with sauces', category_name: 'Main Dishes' },
          { id: 4, name: 'Rico Classic Burger', price: '18000.00', description: 'Classic beef burger with cheese', category_name: 'Rico Burgers' },
        ])
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults(allItems.slice(0, 8))
      return
    }
    
    const filtered = allItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered)
  }, [query, allItems])

  return (
    <div className="px-4 pt-6">
      <div className="relative mb-6">
        <div className="absolute left-5 top-4 text-[#666]">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Ngarenaro, burgers, drinks..."
          className="w-full bg-[#1F1F1F] pl-12 pr-12 py-4 rounded-3xl text-white placeholder-[#666] focus:outline-none border border-[#333] focus:border-brand-red"
        />
      </div>

      <div className="text-xs text-[#888] px-1 mb-3">RESULTS ({results.length})</div>
      
      <div className="space-y-3">
        {results.map(item => (
          <Link 
            key={item.id} 
            to={`/product/${item.id}`}
            className="food-card flex gap-4 p-4 rounded-3xl active:bg-[#1A1A1A]"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#1F1F1F] overflow-hidden flex-shrink-0">
              <img src={`https://picsum.photos/id/${item.id + 20}/64/64`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pt-1">
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-[#888] line-clamp-1 mt-0.5">{item.description}</div>
              <div className="text-brand-red font-semibold mt-1 text-sm">TZS {parseInt(item.price).toLocaleString()}</div>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(item) }}
              className="self-center text-xs bg-brand-red text-white px-5 py-2 rounded-2xl font-medium active:bg-[#CC0000]"
            >
              Add
            </button>
          </Link>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-12 text-[#666]">No results found for "{query}"</div>
      )}
    </div>
  )
}

export default SearchPage