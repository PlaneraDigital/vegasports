import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = 'service_ktacmh8'
const EMAILJS_TEMPLATE_ID = 'template_3krji4x'
const EMAILJS_PUBLIC_KEY = 'h43c1ndTV38-mUZkj'

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [otpSent, setOtpSent] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isSendingOtp, setIsSendingOtp] = useState(false)

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

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const sendOtp = async () => {
    const isValid = validate()
    if (!isValid) return

    setIsSendingOtp(true)
    setOtpError('')
    const otp = generateOtp()
    setGeneratedOtp(otp)

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_name: form.name,
          to_email: form.email,
          otp: otp,
        },
        EMAILJS_PUBLIC_KEY
      )
      setOtpSent(true)
      startResendTimer()
    } catch (error) {
      console.error('EmailJS error:', error)
      setOtpError('Failed to send OTP. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...enteredOtp]
    newOtp[index] = value.slice(-1)
    setEnteredOtp(newOtp)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus()
    }
  }

  const handleVerifyOtp = () => {
    const entered = enteredOtp.join('')
    if (entered.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP')
      return
    }
    if (entered !== generatedOtp) {
      setOtpError('Invalid OTP. Please try again.')
      setEnteredOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0').focus()
      return
    }

    setIsLoading(true)
    const userData = { name: form.name, email: form.email }
    localStorage.setItem('user', JSON.stringify(userData))
    window.dispatchEvent(new Event('userUpdated'))

    setTimeout(() => {
      setIsLoading(false)
      navigate('/')
    }, 1000)
  }

  return (
    <div className="min-h-screen font-mono flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at top, #0d2b1a 0%, #0a0a0a 70%)' }}>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold" style={{ color: '#4ade80' }}>
            VegaSports
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            {otpSent
              ? `OTP sent to ${form.email}`
              : 'Create your account and start booking.'}
          </p>
        </div>

        <div className="rounded-2xl p-8 border border-gray-800"
          style={{ backgroundColor: '#111111' }}>

          {!otpSent ? (

            // ── SIGNUP FORM ──
            <>
              <h2 className="text-white text-xl font-bold mb-6">Create Account</h2>

              <div className="flex flex-col gap-5">

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 font-bold text-sm">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your Full Name"
                    className={`rounded-xl px-4 py-3 text-sm text-white outline-none transition
                      border ${errors.name ? 'border-red-500' : 'border-gray-700'}
                      focus:border-green-500`}
                    style={{ backgroundColor: '#1a1a1a' }}
                  />
                  {errors.name && (
                    <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                      <span className="text-red-400 text-xs">⚠ {errors.name}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 font-bold text-sm">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`rounded-xl px-4 py-3 text-sm text-white outline-none transition
                      border ${errors.email ? 'border-red-500' : 'border-gray-700'}
                      focus:border-green-500`}
                    style={{ backgroundColor: '#1a1a1a' }}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                      <span className="text-red-400 text-xs">⚠ {errors.email}</span>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 font-bold text-sm">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your Password"
                      className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-white outline-none transition
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
                    <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                      <span className="text-red-400 text-xs">⚠ {errors.password}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 font-bold text-sm">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className={`w-full rounded-xl px-4 py-3 pr-16 text-sm text-white outline-none transition
                        border ${errors.confirm ? 'border-red-500' :
                          form.confirm.length > 0 && form.confirm === form.password
                            ? 'border-green-500' : 'border-gray-700'}
                        focus:border-green-500`}
                      style={{ backgroundColor: '#1a1a1a' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-xs"
                    >
                      {showConfirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.confirm && (
                    <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                      <span className="text-red-400 text-xs">⚠ {errors.confirm}</span>
                    </div>
                  )}
                  {form.confirm.length > 0 && form.confirm === form.password && (
                    <span className="text-xs" style={{ color: '#4ade80' }}>✓ Passwords match</span>
                  )}
                </div>

                {/* Get OTP Button */}
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={isSendingOtp}
                  className="w-full cursor-pointer py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                  style={{ backgroundColor: '#16a34a' }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}
                >
                  {isSendingOtp ? 'Sending OTP...' : 'Get OTP on Mail →'}
                </button>

                {otpError && (
                  <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                    <span className="text-red-400 text-xs">⚠ {otpError}</span>
                  </div>
                )}

              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">or continue with</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Google */}
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

              <p className="text-center text-gray-500 text-sm mt-6">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#4ade80' }} className="font-medium hover:underline">
                  Login
                </Link>
              </p>
            </>

          ) : (

            // ── OTP SCREEN ──
            <>
              <h2 className="text-white text-xl font-bold mb-2">Verify OTP</h2>
              <p className="text-gray-400 text-sm mb-8">
                We sent a 6-digit code to{' '}
                <span style={{ color: '#4ade80' }}>{form.email}</span>
              </p>

              {/* 6 OTP boxes */}
              <div className="flex gap-3 justify-center mb-6">
                {enteredOtp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-white text-xl font-bold rounded-xl outline-none transition border border-gray-700 focus:border-green-500"
                    style={{ backgroundColor: '#1a1a1a' }}
                  />
                ))}
              </div>

              {/* OTP error */}
              {otpError && (
                <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2 mb-4">
                  <span className="text-red-400 text-xs">⚠ {otpError}</span>
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 mb-4"
                style={{ backgroundColor: '#16a34a' }}
                onMouseEnter={e => e.target.style.backgroundColor = '#15803d'}
                onMouseLeave={e => e.target.style.backgroundColor = '#16a34a'}
              >
                {isLoading ? 'Creating account...' : 'Verify & Create Account →'}
              </button>

              {/* Resend timer */}
              <div className="text-center mb-4">
                {resendTimer > 0 ? (
                  <p className="text-gray-500 text-sm">
                    Resend OTP in{' '}
                    <span style={{ color: '#4ade80' }}>{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={sendOtp}
                    className="text-sm hover:underline"
                    style={{ color: '#4ade80' }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Go back */}
              <p className="text-center text-gray-500 text-sm">
                Wrong email?{' '}
                <button
                  onClick={() => {
                    setOtpSent(false)
                    setEnteredOtp(['', '', '', '', '', ''])
                    setOtpError('')
                  }}
                  className="font-medium hover:underline"
                  style={{ color: '#4ade80' }}
                >
                  Go back
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default Signup