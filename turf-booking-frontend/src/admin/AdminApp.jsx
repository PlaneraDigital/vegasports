import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'

const AdminApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="flex min-h-screen bg-zinc-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px]">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-7 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminApp
