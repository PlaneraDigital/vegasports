import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, saveAuthSession } from '../utils/auth'

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')

  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name) newErrors.name = 'Name is required'
    if (!form.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address'
    }
    if (!form.phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must be 10 digits'
    }
    if (!form.password) {
      newErrors.password = 'Password is required'
    } else if (form.password.length < 7) {
      newErrors.password = 'Password must be at least 7 characters'
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = 'Must contain at least 1 uppercase letter'
    } else if (!/[a-z]/.test(form.password)) {
      newErrors.password = 'Must contain at least 1 lowercase letter'
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = 'Must contain at least 1 number'
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
      newErrors.password = 'Must contain at least 1 special character'
    }
    if (!form.confirm) {
      newErrors.confirm = 'Please confirm your password'
    } else if (form.confirm !== form.password) {
      newErrors.confirm = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validate()) return

    setIsLoading(true)

    try {
      const { data } = await authApi.post('/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })

      saveAuthSession(data.token, data.user)
      navigate('/')
    } catch (error) {
      const message = error?.response?.data?.message || 'Signup failed. Please try again.'
      setServerError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at top, #f0fdf4 0%, #ffffff 70%)' }}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-black" style={{ color: '#16a34a' }}>
            <span style={{ color: '#1a1d1e' }}>Infinity</span> Sports Turf
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Create your account and start booking.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-gray-100 shadow-xl bg-zinc-100">
          <h2 className="text-gray-900 text-2xl font-bold mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 font-bold text-sm">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your Full Name"
                className={`rounded-xl px-4 py-3 text-sm text-gray-900 outline-none transition
                  border ${errors.name ? 'border-red-500' : 'border-gray-200'}
                  focus:border-green-500 focus:ring-4 focus:ring-green-50/50`}
                style={{ backgroundColor: '#f9fafb' }}
              />
              {errors.name && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mt-1">
                  <span className="text-red-600 text-xs font-medium">⚠ {errors.name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 font-bold text-sm">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`rounded-xl px-4 py-3 text-sm text-gray-900 outline-none transition
                  border ${errors.email ? 'border-red-500' : 'border-gray-200'}
                  focus:border-green-500 focus:ring-4 focus:ring-green-50/50`}
                style={{ backgroundColor: '#f9fafb' }}
              />
              {errors.email && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mt-1">
                  <span className="text-red-600 text-xs font-medium">⚠ {errors.email}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 font-bold text-sm">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                className={`rounded-xl px-4 py-3 text-sm text-gray-900 outline-none transition
                  border ${errors.phone ? 'border-red-500' : 'border-gray-200'}
                  focus:border-green-500 focus:ring-4 focus:ring-green-50/50`}
                style={{ backgroundColor: '#f9fafb' }}
              />
              {errors.phone && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mt-1">
                  <span className="text-red-600 text-xs font-medium">⚠ {errors.phone}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 font-bold text-sm">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-gray-900 outline-none transition
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
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mt-1">
                  <span className="text-red-600 text-xs font-medium">⚠ {errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 font-bold text-sm">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-gray-900 outline-none transition
                    border ${errors.confirm ? 'border-red-500' :
                    form.confirm.length > 0 && form.confirm === form.password
                      ? 'border-green-500' : 'border-gray-200'}
                    focus:border-green-500 focus:ring-4 focus:ring-green-50/50`}
                  style={{ backgroundColor: '#f9fafb' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-xs font-bold"
                >
                  {showConfirm ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              {errors.confirm && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mt-1">
                  <span className="text-red-600 text-xs font-medium">⚠ {errors.confirm}</span>
                </div>
              )}
              {form.confirm.length > 0 && form.confirm === form.password && (
                <span className="text-xs font-bold" style={{ color: '#16a34a' }}>✓ Passwords match</span>
              )}
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <span className="text-red-600 text-xs font-medium">{serverError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer py-3.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 shadow-lg shadow-green-200"
              style={{ backgroundColor: '#16a34a' }}
              onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
              onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-gray-500 text-sm mt-2">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#16a34a' }} className="font-bold hover:underline">
                Login
              </Link>
            </p>
          </form>

        </div>
      </div>
    </div>
  )
}

export default Signup