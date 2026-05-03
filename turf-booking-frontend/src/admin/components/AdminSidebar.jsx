import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import {
  LayoutDashboard, Layers, Clock, DollarSign,
  CalendarCheck, BarChart2, LogOut, ShieldCheck,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  to: '/admin/dashboard' },
  { icon: Layers,          label: 'Turfs',      to: '/admin/turfs'     },
  { icon: Clock,           label: 'Slots',      to: '/admin/slots'     },
  { icon: DollarSign,      label: 'Pricing',    to: '/admin/pricing'   },
  { icon: CalendarCheck,   label: 'Bookings',   to: '/admin/bookings'  },
  { icon: ShieldCheck,     label: 'Users',      to: '/admin/users'     },
  { icon: BarChart2,       label: 'Reports',    to: '/admin/reports'   },
]

const AdminSidebar = ({ isOpen, onClose }) => {
  const { adminUser, adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    adminLogout()
    navigate('/admin/login')
  }

  return (
    <aside className={`fixed top-0 left-0 bottom-0 w-[240px] bg-zinc-900 border-r border-zinc-800 flex flex-col z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #27272a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #00844d, #006b3e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
          }}>
            <ShieldCheck size={16} color="white" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f4f4f5', letterSpacing: '-0.02em' }}>
              Infinity Sports Turf
            </span>
            <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.875rem', borderRadius: '10px',
              textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
              transition: 'all 0.15s',
              background: isActive ? 'rgba(74,222,128,0.1)' : 'transparent',
              color: isActive ? '#4ade80' : '#71717a',
              border: isActive ? '1px solid rgba(74,222,128,0.15)' : '1px solid transparent',
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #27272a' }}>
        <div style={{ padding: '0.625rem 0.875rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5' }}>
            Admin
          </div>
          <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.1rem' }}>
            {adminUser?.email || ''}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0.875rem', borderRadius: '10px', border: 'none',
            background: 'transparent', color: '#71717a', fontSize: '0.875rem',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717a' }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
