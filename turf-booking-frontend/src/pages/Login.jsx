import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, saveAuthSession } from '../utils/auth'
import { ShieldCheck } from 'lucide-react'

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
      /* Light theme background with subtle mint glow */
      style={{ background: 'radial-gradient(ellipse at top, #ebf9f3 0%, #ffffff 70%)' }}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-black" style={{ color: '#00844d' }}>
            <span style={{ color: '#1a1d1e' }}>Infinity</span> Sports Turf
          </Link>
          <p className="text-gray-500 text-sm mt-2">Welcome back. Login to book your turf.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-gray-100 shadow-xl bg-zinc-100">

          <h2 className="text-gray-900 text-2xl font-bold text-center mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 font-bold text-sm">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`rounded-xl px-4 py-3 text-sm text-gray-900 outline-none transition
                  border ${errors.email ? 'border-red-500' : 'border-gray-200'}
                  focus:border-green-500 focus:ring-4 focus:ring-green-50/50`}
                style={{ backgroundColor: '#f9fafb' }}
              />
              {errors.email && (
                <span className="text-red-500 text-xs">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-bold text-sm">Password</label>
                <a href="#" className="text-xs font-semibold" style={{ color: '#00844d' }}>
                  Forgot password?
                </a>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition
                    border ${errors.password ? 'border-red-500' : 'border-gray-200'}
                    focus:border-green-500 focus:ring-4 focus:ring-green-50/50`}
                  style={{ backgroundColor: '#f9fafb' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-xs font-bold"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              {errors.password && (
                <span className="text-red-500 text-xs">{errors.password}</span>
              )}
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <span className="text-red-600 text-xs font-medium">{serverError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer py-3.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 shadow-lg shadow-green-200"
              style={{ backgroundColor: '#00844d' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#006b3e'}
              onMouseLeave={e => e.target.style.backgroundColor = '#00844d'}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          {/* Switch to signup */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#00844d' }} className="font-bold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Admin Login button */}
          <Link
            to="/admin/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.75rem', marginTop: '0.75rem', borderRadius: '12px',
              border: '1.5px solid #d1d5db', background: '#f9fafb',
              color: '#374151', fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', transition: 'all 0.2s',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00844d'; e.currentTarget.style.color = '#00844d'; e.currentTarget.style.background = '#ebf9f3'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#f9fafb'; }}
          >
            <ShieldCheck size={16} />
            Login as Admin
          </Link>

        </div>
      </div>
    </div>
  )
}

export default Login