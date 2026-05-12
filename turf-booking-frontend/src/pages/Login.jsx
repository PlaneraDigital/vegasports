import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, saveAuthSession } from '../utils/auth'
import { ShieldCheck, ConciergeBell } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = {}
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const isValid = validate()
    if (!isValid) return
    setIsLoading(true)
    try {
      const { data } = await authApi.post('/login', { email, password })
      saveAuthSession(data.token, data.user)
      navigate('/')
    } catch (error) {
      const message = error?.response?.data?.message || 'Login failed. Please try again.'
      setServerError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #0a1a0f 0%, #0f1117 70%)' }}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/20 group-hover:border-emerald-500 transition-all duration-500 shadow-xl">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <span className="text-2xl font-black mt-2" style={{ color: '#f4f4f5' }}>
              Infinity <span style={{ color: '#4ade80' }}>Turf</span>
            </span>
          </Link>
          <p className="text-zinc-500 text-sm mt-2">Welcome back. Login to book your turf.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-zinc-800 shadow-xl bg-zinc-900">

          <h2 className="text-zinc-100 text-2xl font-bold text-center mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 font-bold text-sm">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition
                  border ${errors.email ? 'border-red-500' : 'border-zinc-700'}
                  focus:border-green-500 focus:ring-4 focus:ring-green-500/10`}
                style={{ backgroundColor: '#1c1f26' }}
              />
              {errors.email && (
                <span className="text-red-500 text-xs">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-bold text-sm">Password</label>
                <a href="#" className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                  Forgot password?
                </a>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition
                    border ${errors.password ? 'border-red-500' : 'border-zinc-700'}
                    focus:border-green-500 focus:ring-4 focus:ring-green-500/10`}
                  style={{ backgroundColor: '#1c1f26' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition text-xs font-bold"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              {errors.password && (
                <span className="text-red-500 text-xs">{errors.password}</span>
              )}
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-900 rounded-lg px-3 py-2">
                <span className="text-red-400 text-xs font-medium">{serverError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer py-3.5 rounded-xl text-sm font-bold transition disabled:opacity-60 border-2"
              style={{ 
                backgroundColor: '#0a1a0f', 
                color: '#4ade80', 
                borderColor: '#4ade80',
                boxShadow: '0 4px 20px rgba(74,222,128,0.1)'
              }}
              onMouseEnter={e => {
                e.target.style.backgroundColor = '#4ade80';
                e.target.style.color = '#000';
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = '#0a1a0f';
                e.target.style.color = '#4ade80';
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          {/* Switch to signup */}
          <p className="text-center text-zinc-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#4ade80' }} className="font-bold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#3f3f46' }} />
            <span style={{ color: '#71717a', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#3f3f46' }} />
          </div>

          {/* Admin Login button */}
          <Link
            to="/admin/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.75rem', marginTop: '0.75rem', borderRadius: '12px',
              border: '1.5px solid #3f3f46', background: '#1c1f26',
              color: '#a1a1aa', fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', transition: 'all 0.2s',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.background = '#0a1a0f'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = '#1c1f26'; }}
          >
            <ShieldCheck size={16} />
            Login as Admin
          </Link>

          {/* Receptionist Login button */}
          <Link
            to="/receptionist/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.75rem', marginTop: '0.6rem', borderRadius: '12px',
              border: '1.5px solid #3f3f46', background: '#1c1f26',
              color: '#a1a1aa', fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', transition: 'all 0.2s',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.background = '#1c1000'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = '#1c1f26'; }}
          >
            <ConciergeBell size={16} />
            Login as Receptionist
          </Link>

        </div>
      </div>
    </div>
  )
}

export default Login