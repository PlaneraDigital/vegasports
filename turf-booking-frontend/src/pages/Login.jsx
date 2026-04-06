import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
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
    } else if (password.length < 7) {
      newErrors.password = 'Password must be at least 7 characters'
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Must contain at least 1 uppercase letter'
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Must contain at least 1 lowercase letter'
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Must contain at least 1 number'
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      newErrors.password = 'Must contain at least 1 special character'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const isValid = validate()
    if (!isValid) return
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate('/')
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #0d2b1a 0%, #0a0a0a 70%)' }}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl brand-wordmark" style={{ color: '#4ade80' }}>
            vegasports
          </Link>
          <p className="text-gray-400 text-sm mt-2">Welcome back. Login to book your turf.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-gray-800"
          style={{ backgroundColor: '#111111' }}>

          <h2 className="text-white text-xl font-bold text-center mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-300 font-bold text-sm">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`rounded-xl px-4 py-3 text-sm text-white outline-none transition
                  border ${errors.email ? 'border-red-500' : 'border-gray-700'}
                  focus:border-green-500`}
                style={{ backgroundColor: '#1a1a1a' }}
              />
              {errors.email && (
                <span className="text-red-400 text-xs">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-sm">Password</label>
                <a href="#" className="text-xs" style={{ color: '#4ade80' }}>
                  Forgot password?
                </a>
              </div>

              {/* Input with show/hide */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password (min 7 characters)"
                  className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-white placeholder:text-gray-500 outline-none transition
                    border ${errors.password ? 'border-red-500' : 'border-gray-700'}
                    focus:border-green-500`}
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>


              {errors.password && (
                <span className="text-red-400 text-xs">{errors.password}</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
              style={{ backgroundColor: '#16a34a' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
              onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}
            >
              {isLoading ? 'Logging in...' : 'Login →'}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or continue with</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Google Button */}
          <button
            className="w-full cursor-pointer py-3 rounded-xl text-sm font-medium text-white border border-gray-700 hover:border-gray-500 transition flex items-center justify-center gap-3"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.52A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.59l2.63-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.41l2.63 2.07c.63-1.89 2.39-3.3 4.47-3.3z"/>
            </svg>
            Continue with Google
          </button>

          {/* Switch to signup */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#4ade80' }} className="font-medium hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login