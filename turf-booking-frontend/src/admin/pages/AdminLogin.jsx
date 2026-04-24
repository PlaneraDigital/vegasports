import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, #051a0f 0%, #0a0a0a 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '1rem',
    }}>
      {/* Decorative background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            marginBottom: '1rem',
            boxShadow: '0 0 40px rgba(22,163,74,0.3)',
          }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 style={{
            fontWeight: 800, fontSize: '1.5rem', color: '#ffffff',
            letterSpacing: '-0.03em', margin: 0,
          }}>
            Infinity Sports Turf<span style={{ color: '#4ade80' }}> Admin</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Restricted access. Authorised personnel only.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#111111',
          border: '1px solid #1f1f1f',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Sign in to Admin Portal
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email */}
            <div>
              <label style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@infinityturf.com"
                style={{
                  width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: '12px', padding: '0.75rem 1rem', color: '#fff',
                  fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#4ade80'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
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
                    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: '12px', padding: '0.75rem 3rem 0.75rem 1rem', color: '#fff',
                    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#4ade80'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0.2rem',
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
                background: '#1a0a0a', border: '1px solid #7f1d1d',
                borderRadius: '10px', padding: '0.6rem 0.875rem',
              }}>
                <AlertCircle size={14} color="#f87171" />
                <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '12px',
                background: loading ? '#166534' : 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 20px rgba(22,163,74,0.3)',
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)' }}
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: '#374151', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Not an admin?{' '}
          <a href="/" style={{ color: '#4ade80', textDecoration: 'none' }}>Go to user site →</a>
        </p>
      </div>
    </div>
  )
}

export default AdminLogin
