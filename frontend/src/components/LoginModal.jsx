import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const LoginModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'customer'
  })
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let success = false
    if (isLogin) {
      success = await login(form.username, form.password)
    } else {
      success = await register({
        username: form.username,
        password: form.password,
        password2: form.password,
        email: form.email || `${form.username}@student.ac.tz`,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number || '+255742901900',
        role: 'customer'
      })
      if (success) {
        setIsLogin(true)
        toast('Account created! Now log in with your credentials.')
      }
    }

    if (success && isLogin) {
      onClose()
    }
    setLoading(false)
  }

  const demoLogin = async () => {
    setLoading(true)
    const success = await login('joshua', 'student123')
    if (success) onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-end justify-center">
      <div className="w-full max-w-md bg-[#121212] rounded-t-3xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-[#888] text-sm mt-1">Kantiine • Rico Canteen</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#888]">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#888] block mb-1.5">USERNAME</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#1F1F1F] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-brand-red"
              placeholder="joshua"
              required
            />
          </div>

          <div>
            <label className="text-xs text-[#888] block mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#1F1F1F] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-brand-red"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#888] block mb-1.5">FIRST NAME</label>
                  <input type="text" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} className="w-full bg-[#1F1F1F] border border-[#333] rounded-xl px-4 py-3 text-sm" placeholder="Joshua" />
                </div>
                <div>
                  <label className="text-xs text-[#888] block mb-1.5">LAST NAME</label>
                  <input type="text" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} className="w-full bg-[#1F1F1F] border border-[#333] rounded-xl px-4 py-3 text-sm" placeholder="John" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#888] block mb-1.5">PHONE NUMBER</label>
                <input type="tel" value={form.phone_number} onChange={(e) => setForm({...form, phone_number: e.target.value})} className="w-full bg-[#1F1F1F] border border-[#333] rounded-xl px-4 py-3 text-sm" placeholder="+255 742 901 900" />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-4 disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-red text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-[#333]">
          <button 
            onClick={demoLogin}
            className="w-full py-3 text-sm text-[#888] hover:text-white transition flex items-center justify-center gap-2"
          >
            <div className="px-3 py-1 bg-[#1F1F1F] rounded text-xs">DEMO</div>
            Login as Joshua (student)
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginModal