import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../utils/adminApi'
import { useAdminAuth } from '../context/AdminAuthContext'
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { adminLogin } = useAdminAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true)
    try {
      const { data } = await adminApi.post('/login', { email, password })
      adminLogin(data.token, data.admin)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #ebf9f3 0%, #ffffff 70%)' }}
    >
      <div className="w-full" style={{ maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #00844d, #006b3e)',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(22,163,74,0.25)',
          }}>
            <ShieldCheck size={26} color="white" />
          </div>
          <h1 style={{
            fontWeight: 800, fontSize: '1.5rem', color: '#1a1d1e',
            letterSpacing: '-0.03em', margin: 0,
          }}>
            Infinity Sports Turf <span style={{ color: '#00844d' }}>Admin</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Restricted access. Authorised personnel only.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#f4f4f5',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        }}>
          {/* Admin badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: '#ebf9f3', border: '1px solid #bbf7d0',
            borderRadius: '9999px', padding: '0.35rem 1rem',
            marginBottom: '1.5rem', width: 'fit-content', margin: '0 auto 1.5rem',
          }}>
            <ShieldCheck size={13} color="#00844d" />
            <span style={{ color: '#00844d', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              ADMIN PORTAL
            </span>
          </div>

          <h2 style={{
            color: '#111827', fontWeight: 700, fontSize: '1.25rem',
            marginBottom: '1.5rem', textAlign: 'center',
          }}>
            Sign in to Admin Portal
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#374151', fontSize: '0.8rem', fontWeight: 700 }}>
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@infinityturf.com"
                style={{
                  width: '100%', background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px', padding: '0.75rem 1rem',
                  color: '#111827', fontSize: '0.875rem',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#00844d'
                  e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#374151', fontSize: '0.8rem', fontWeight: 700 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px', padding: '0.75rem 3rem 0.75rem 1rem',
                    color: '#111827', fontSize: '0.875rem',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#00844d'
                    e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#9ca3af', padding: '0.2rem',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', padding: '0.6rem 0.875rem',
              }}>
                <AlertCircle size={14} color="#dc2626" />
                <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: '12px',
                background: '#00844d',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', opacity: loading ? 0.65 : 1,
                boxShadow: '0 4px 20px rgba(22,163,74,0.25)',
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#006b3e' }}
              onMouseLeave={e => { e.target.style.background = '#00844d' }}
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* Back to user login */}
          <Link
            to="/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: '0.75rem', padding: '0.7rem', borderRadius: '12px',
              border: '1.5px solid #d1d5db', background: '#f9fafb',
              color: '#374151', fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00844d'
              e.currentTarget.style.color = '#00844d'
              e.currentTarget.style.background = '#ebf9f3'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.color = '#374151'
              e.currentTarget.style.background = '#f9fafb'
            }}
          >
            ← Back to User Login
          </Link>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Infinity Sports Turf &mdash; Admin Portal
        </p>
      </div>
    </div>
  )
}

export default AdminLogin
