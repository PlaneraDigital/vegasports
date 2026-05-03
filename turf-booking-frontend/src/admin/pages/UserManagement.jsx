import React, { useState, useEffect } from 'react'
import { adminApi } from '../utils/adminApi'
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  AlertCircle,
  Filter,
  UserCheck,
  UserX,
  Trophy,
  Activity
} from 'lucide-react'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, suspended
  const [bookingFilter, setBookingFilter] = useState('all') // all, frequent, none
  const [toast, setToast] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.get('/users')
      setUsers(data.users)
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to fetch users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleToggleStatus = async (user) => {
    const action = user.status === 'active' ? 'suspend' : 'activate'
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) return

    try {
      await adminApi.patch(`/users/${user._id}/status`)
      showToast(`User ${user.status === 'active' ? 'suspended' : 'activated'} successfully`)
      fetchUsers()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Action failed', 'error')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    
    let matchesBooking = true
    if (bookingFilter === 'frequent') matchesBooking = u.bookingCount >= 5
    if (bookingFilter === 'none') matchesBooking = u.bookingCount === 0

    return matchesSearch && matchesStatus && matchesBooking
  })

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl border animate-in slide-in-from-right duration-300 ${
          toast.type === 'error' 
            ? 'bg-red-900/20 border-red-800 text-red-400' 
            : 'bg-green-900/20 border-green-800 text-green-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-zinc-100 flex items-center gap-2">
              <Users className="text-emerald-600" size={24} />
              User Directory
            </h1>
            <p className="text-zinc-500 text-xs font-semibold mt-1">Manage customers and access permissions</p>
          </div>

          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-zinc-600 text-zinc-300 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 mr-2">
            <Filter size={14} className="text-zinc-600" />
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Quick Filters:</span>
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-[11px] font-bold text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <select 
            value={bookingFilter}
            onChange={(e) => setBookingFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-[11px] font-bold text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
          >
            <option value="all">Any Bookings</option>
            <option value="frequent">Frequent Bookers (5+)</option>
            <option value="none">New/No Bookings (0)</option>
          </select>

          {(statusFilter !== 'all' || bookingFilter !== 'all' || searchTerm) && (
            <button 
              onClick={() => { setStatusFilter('all'); setBookingFilter('all'); setSearchTerm(''); }}
              className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 ml-2"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active', value: users.filter(u => u.status === 'active').length, icon: UserCheck, color: 'emerald' },
          { label: 'Suspended', value: users.filter(u => u.status !== 'active').length, icon: UserX, color: 'red' },
          { label: 'Frequent', value: users.filter(u => u.bookingCount >= 5).length, icon: Trophy, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-700 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-100">{stat.value}</div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Users List/Table */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="text-emerald-600 animate-spin" size={32} />
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Loading Users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left table-fixed">
                <thead className="bg-zinc-800/50 border-b border-zinc-700">
                  <tr>
                    <th className="w-[25%] px-4 py-3 text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em]">Profile Info</th>
                    <th className="w-[30%] px-4 py-3 text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em]">Contact Details</th>
                    <th className="w-[15%] px-4 py-3 text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em] text-center">Activity</th>
                    <th className="w-[15%] px-4 py-3 text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em] text-center">Account Status</th>
                    <th className="w-[15%] px-4 py-3 text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em] text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-900/30 text-green-400 flex items-center justify-center font-bold border border-green-800 shadow-sm shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[15px] font-extrabold text-zinc-200 truncate leading-tight">{user.name}</div>
                            <div className="text-[11px] text-zinc-600 font-bold flex items-center gap-1.5 mt-0.5">
                              <Calendar size={11} className="text-slate-300" /> {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="space-y-0.5">
                          <div className="text-[12px] font-semibold text-zinc-400 flex items-center gap-2 truncate">
                            <Mail size={12} className="text-slate-300 shrink-0" /> {user.email}
                          </div>
                          <div className="text-[12px] font-semibold text-zinc-400 flex items-center gap-2">
                            <Phone size={12} className="text-slate-300 shrink-0" /> {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-center">
                        <div className="inline-flex flex-col items-center px-3 py-1 bg-zinc-800/80 rounded-xl border border-zinc-700 shadow-sm min-w-[65px]">
                          <span className="text-base font-black text-zinc-100 leading-none">{user.bookingCount}</span>
                          <span className="text-[9px] font-black text-zinc-600 uppercase mt-1 tracking-tighter">Bookers</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          user.status === 'active' 
                            ? 'bg-green-900/20 text-green-400 border-green-800' 
                            : 'bg-red-900/20 text-red-400 border-red-800'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right pr-6">
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                            user.status === 'active' 
                              ? 'bg-zinc-900 text-red-500 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500' 
                              : 'bg-zinc-900 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <><ShieldAlert size={12} /> Suspend</>
                          ) : (
                            <><ShieldCheck size={12} /> Activate</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-zinc-800">
              {filteredUsers.map((user) => (
                <div key={user._id} className="p-5 flex flex-col gap-4 hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-900/30 text-green-400 flex items-center justify-center font-black border border-green-800 shadow-sm text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-zinc-200">{user.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            user.status === 'active' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-zinc-100 leading-none">{user.bookingCount}</div>
                      <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Bookings</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 bg-zinc-800 p-3 rounded-xl border border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-2"><Mail size={12} className="text-zinc-600" /> {user.email}</div>
                    <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-2"><Phone size={12} className="text-zinc-600" /> {user.phone}</div>
                    <div className="text-[10px] font-bold text-zinc-600 flex items-center gap-2"><Calendar size={12} className="text-slate-300" /> Joined {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>

                  <button 
                    onClick={() => handleToggleStatus(user)}
                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${
                      user.status === 'active' 
                        ? 'border-red-100 text-red-600 bg-zinc-900 hover:bg-red-500 hover:text-white hover:border-red-500' 
                        : 'border-emerald-100 text-emerald-700 bg-zinc-900 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                    }`}
                  >
                    {user.status === 'active' ? 'Suspend Account' : 'Restore Account'}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-24 flex flex-col items-center gap-4 text-center px-6">
            <div className="p-6 bg-zinc-800 rounded-full text-slate-300 mb-2">
              <Activity size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-black text-zinc-200">No matching users found</h3>
            <p className="text-zinc-500 text-sm max-w-[300px] font-medium leading-relaxed">Adjust your filters or search term to find the users you're looking for.</p>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setBookingFilter('all'); }}
              className="mt-4 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement

