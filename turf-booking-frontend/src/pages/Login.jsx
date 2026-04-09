import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, saveAuthSession } from '../utils/auth'

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

            {serverError && (
              <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                <span className="text-red-400 text-xs">{serverError}</span>
              </div>
            )}

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