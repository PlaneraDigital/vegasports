import { useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { Bell, Menu } from 'lucide-react'

const sectionLabels = {
  '/admin/dashboard': 'Dashboard',
  '/admin/turfs':     'Turf Management',
  '/admin/slots':     'Slot Management',
  '/admin/pricing':   'Pricing Management',
  '/admin/bookings':  'Booking Management',
  '/admin/reports':   'Reports & Analytics',
}

const AdminTopbar = ({ onMenuClick }) => {
  const { pathname } = useLocation()
  const { adminUser } = useAdminAuth()

  // Match the section label (supports sub-routes like /admin/turfs/new)
  const section = Object.keys(sectionLabels).find(k => pathname.startsWith(k)) || 'Admin'
  const label = sectionLabels[section] || 'Admin'

  return (
    <header className="h-[60px] bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f4f4f5' }}>{label}</h1>
          <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '1px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 cursor-pointer">
          <Bell size={15} />
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: '#27272a', border: '1px solid #3f3f46',
          borderRadius: '10px', padding: '0.4rem 0.75rem',
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 800, color: '#4ade80', flexShrink: 0,
          }}>
            A
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f4f4f5' }}>
            Admin
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminTopbar
