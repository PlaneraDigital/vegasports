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
    <header className="h-[60px] bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40" style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{label}</h1>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 cursor-pointer">
          <Bell size={15} />
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '10px', padding: '0.4rem 0.75rem',
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            A
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
            Admin
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminTopbar
