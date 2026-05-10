import React from 'react'
import { User, MapPin, Bell, Moon, LogOut, Edit2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'

const SettingsPage = ({ onSellerToggle, isSellerMode, onLogout }) => {
  const { user, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const settingsItems = [
    { icon: User, label: 'Promotions', action: () => alert('Promotions coming soon!') },
    { icon: MapPin, label: 'My addresses', action: () => alert('Address management coming soon') },
    { icon: Bell, label: 'Push notifications', action: () => alert('Notification settings') },
    { 
      icon: Moon, 
      label: 'Theme', 
      value: theme === 'dark' ? 'Dark' : 'Light',
      action: toggleTheme 
    },
  ]

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  return (
    <div className="px-4 pt-6 pb-12">
      <div className="text-2xl font-semibold tracking-tight mb-6 px-1">Settings</div>

      {/* Profile Card - Matches screenshots */}
      <div className="bg-[#121212] rounded-3xl p-5 mb-6 flex items-center gap-4 border border-[#222]">
        <div className="w-14 h-14 bg-brand-red rounded-full flex items-center justify-center text-2xl font-semibold flex-shrink-0">
          {user?.first_name?.[0] || 'J'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg tracking-tight">{user?.first_name} {user?.last_name}</div>
          <div className="text-[#888] text-sm">{user?.phone_number || '+255742901900'}</div>
        </div>
        
        <button className="p-3 text-[#888] active:bg-[#1F1F1F] rounded-full">
          <Edit2 size={17} />
        </button>
      </div>

      {/* Settings List */}
      <div className="bg-[#121212] rounded-3xl overflow-hidden mb-6 divide-y divide-[#222]">
        {settingsItems.map((item, index) => (
          <div 
            key={index} 
            onClick={item.action}
            className="flex items-center justify-between px-5 py-[17px] active:bg-[#1A1A1A]"
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} className="text-[#888]" />
              <div className="font-medium">{item.label}</div>
            </div>
            
            {item.value && (
              <div className="text-sm text-[#888] flex items-center gap-1.5">
                {item.value}
                <div className="text-[10px]">›</div>
              </div>
            )}
            {!item.value && <div className="text-[#555]">›</div>}
          </div>
        ))}
      </div>

      {/* Seller Toggle */}
      <div 
        onClick={onSellerToggle}
        className="bg-[#121212] rounded-3xl px-5 py-4 mb-6 flex items-center justify-between active:bg-[#1A1A1A]"
      >
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <span className="text-emerald-400 text-xl">🛠</span>
          </div>
          <div>
            <div className="font-medium">Seller Mode</div>
            <div className="text-xs text-[#888]">Switch to cashier dashboard</div>
          </div>
        </div>
        <div className={`w-11 h-6 rounded-full transition ${isSellerMode ? 'bg-brand-red' : 'bg-[#333]'}`}>
          <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition ${isSellerMode ? 'ml-[22px]' : 'ml-0.5'}`}></div>
        </div>
      </div>

      {/* Social & Version */}
      <div className="text-center">
        <div className="text-xs text-[#888] mb-3">Find us on:</div>
        <div className="flex justify-center gap-5 mb-8">
          {['Instagram', '𝕏', 'TikTok', '📍'].map((s, i) => (
            <div key={i} className="w-8 h-8 flex items-center justify-center text-lg opacity-70">{s}</div>
          ))}
        </div>
        
        <div className="text-[10px] text-[#555]">Version 2.4.0 • Kantiine © 2026</div>
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="mt-8 w-full flex items-center justify-center gap-2 text-sm text-red-400 py-3 border border-red-900/50 rounded-2xl active:bg-red-950/30"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  )
}

export default SettingsPage