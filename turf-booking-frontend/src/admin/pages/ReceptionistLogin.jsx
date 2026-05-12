import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ConciergeBell, Eye, EyeOff, AlertCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const ReceptionistLogin = () => {
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/admin/receptionist/login`, { email, password })
      localStorage.setItem('receptionistToken', data.token)
      localStorage.setItem('receptionistUser', JSON.stringify(data.user))
      navigate('/receptionist')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #1a1000 0%, #0f1117 70%)' }}
    >
      <div className="w-full" style={{ maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(217,119,6,0.3)',
          }}>
            <ConciergeBell size={26} color="white" />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#f4f4f5', letterSpacing: '-0.03em', margin: 0 }}>
            Infinity <span style={{ color: '#fbbf24' }}>Sports Turf</span>
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Receptionist access. Booking management only.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        }}>
          {/* Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: '#1c1000', border: '1px solid #78350f',
            borderRadius: '9999px', padding: '0.35rem 1rem',
            marginBottom: '1.5rem', width: 'fit-content', margin: '0 auto 1.5rem',
          }}>
            <ConciergeBell size={13} color="#fbbf24" />
            <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              RECEPTIONIST PORTAL
            </span>
          </div>

          <h2 style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Sign in to Receptionist Portal
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 700 }}>Email</label>
              <input
                id="receptionist-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="receptionist@infinityturf.com"
                style={{
                  width: '100%', background: '#27272a', border: '1px solid #3f3f46',
                  borderRadius: '12px', padding: '0.75rem 1rem',
                  color: '#f4f4f5', fontSize: '0.875rem', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#fbbf24'; e.target.style.boxShadow = '0 0 0 4px rgba(251,191,36,0.08)' }}
                onBlur={e => { e.target.style.borderColor = '#3f3f46'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 700 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="receptionist-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', background: '#27272a', border: '1px solid #3f3f46',
                    borderRadius: '12px', padding: '0.75rem 3rem 0.75rem 1rem',
                    color: '#f4f4f5', fontSize: '0.875rem', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#fbbf24'; e.target.style.boxShadow = '0 0 0 4px rgba(251,191,36,0.08)' }}
                  onBlur={e => { e.target.style.borderColor = '#3f3f46'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.2rem' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1a1111', border: '1px solid #442222', borderRadius: '10px', padding: '0.6rem 0.875rem' }}>
                <AlertCircle size={14} color="#f87171" />
                <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="receptionist-login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: '12px',
                background: '#1c1000', color: '#fbbf24',
                fontWeight: 800, fontSize: '0.9rem',
                border: '2px solid #fbbf24',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', opacity: loading ? 0.65 : 1,
                boxShadow: '0 4px 20px rgba(251,191,36,0.1)',
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!loading) { e.target.style.background = '#fbbf24'; e.target.style.color = '#000' } }}
              onMouseLeave={e => { e.target.style.background = '#1c1000'; e.target.style.color = '#fbbf24' }}
            >
              {loading ? 'Signing in...' : 'Sign in as Receptionist'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#3f3f46' }} />
            <span style={{ color: '#71717a', fontSize: '0.75rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#3f3f46' }} />
          </div>

          <Link
            to="/admin/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: '0.75rem', padding: '0.7rem', borderRadius: '12px',
              border: '1.5px solid #3f3f46', background: '#27272a',
              color: '#a1a1aa', fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.background = '#1c1000' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = '#27272a' }}
          >
            ← Admin Login
          </Link>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Infinity Sports Turf &mdash; Receptionist Portal
        </p>
      </div>
    </div>
  )
}

export default ReceptionistLogin
