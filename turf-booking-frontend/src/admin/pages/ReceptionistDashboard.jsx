import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConciergeBell, LogOut, Menu, X } from 'lucide-react'
import BookingManagement from './BookingManagement'
import SlotManagement from './SlotManagement'

// ── Swap adminToken with receptionistToken so BookingManagement's adminApi works ──
// BookingManagement uses adminApi which reads 'adminToken' from localStorage.
// We temporarily mirror the receptionistToken into 'adminToken' for this session.
const syncToken = () => {
  const t = localStorage.getItem('receptionistToken')
  if (t) localStorage.setItem('adminToken', t)
}

const ReceptionistDashboard = () => {
  const navigate   = useNavigate()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('bookings') // 'bookings' or 'slots'

  useEffect(() => {
    syncToken()
    try {
      const u = JSON.parse(localStorage.getItem('receptionistUser'))
      setUser(u)
    } catch { /* ignore */ }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('receptionistToken')
    localStorage.removeItem('receptionistUser')
    // Remove mirrored token only if it was ours (not an admin session)
    const adminUser = (() => { try { return JSON.parse(localStorage.getItem('adminUser')) } catch { return null } })()
    if (!adminUser || adminUser?.role === 'receptionist') {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    }
    navigate('/receptionist/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Topbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#18181b',
        borderBottom: '1px solid #27272a',
        padding: '0 1.25rem',
        height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(0,0,0,0.4)',
      }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
          }}>
            <ConciergeBell size={16} color="white" />
          </div>
          <div>
            <div style={{ color: '#f4f4f5', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>
              Infinity Sports Turf
            </div>
            <div style={{ color: '#fbbf24', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              RECEPTIONIST PORTAL
            </div>
          </div>
        </div>

        {/* Right: User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <span style={{ color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 600 }}>
              👋 {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.875rem', borderRadius: '9px',
              background: 'transparent', border: '1px solid #3f3f46',
              color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = '#1a0a0a' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* ── Page title & Content ── */}
      <div style={{ padding: '1.5rem 1.25rem 0', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* ── Tab Switcher ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #27272a', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              background: activeTab === 'bookings' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
              border: activeTab === 'bookings' ? 'none' : '1px solid #27272a',
              color: activeTab === 'bookings' ? '#fff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📋 Bookings
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              background: activeTab === 'slots' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
              border: activeTab === 'slots' ? 'none' : '1px solid #27272a',
              color: activeTab === 'slots' ? '#fff' : '#a1a1aa',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⚡ Slots Grid
          </button>
        </div>

        {activeTab === 'bookings' ? (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ color: '#f4f4f5', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
                📋 Booking Management
              </h1>
              <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                View, manage, and process all turf bookings.
              </p>
            </div>
            <BookingManagement />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ color: '#f4f4f5', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
                ⚡ Slot Management
              </h1>
              <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                View, block/unblock, and edit prices for turf slots.
              </p>
            </div>
            <SlotManagement />
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceptionistDashboard
