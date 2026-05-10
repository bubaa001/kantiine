import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ListOrdered, Search, ShoppingCart, Settings } from 'lucide-react'

const BottomNav = ({ currentPath, onSellerClick, isSellerMode }) => {
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/orders', icon: ListOrdered, label: 'Orders' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/cart', icon: ShoppingCart, label: 'Cart' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#1F1F1F] z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = currentPath === path || 
                          (path === '/' && currentPath === '/')
          
          return (
            <Link
              key={path}
              to={path}
              className={`bottom-nav-item flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium transition-all
                ${isActive ? 'active text-brand-red' : 'text-[#888]'}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="mt-0.5">{label}</span>
            </Link>
          )
        })}
      </div>
      
      {/* Home indicator bar at very bottom */}
      <div className="h-[5px] bg-white/10 flex justify-center">
        <div className="w-32 h-[3px] bg-white/30 rounded-full mt-0.5"></div>
      </div>
    </div>
  )
}

export default BottomNav