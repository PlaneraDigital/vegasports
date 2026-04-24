import { useState, useEffect } from 'react'
import { adminApi } from '../utils/adminApi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import {
  TrendingUp, Users, CalendarCheck, IndianRupee,
  ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'

// ─── Reusable Stat Card ───────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = '#00844d', iconBg }) => (
  <div style={{
    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px',
    padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
    flex: 1, minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <div style={{
        width: '34px', height: '34px', borderRadius: '10px',
        background: iconBg || 'rgba(22,163,74,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={color} />
      </div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub}</div>}
  </div>
)

// ─── Status Badge ─────────────────────────────────────────────────────────────
const statusStyle = {
  confirmed:  { bg: '#ebf9f3', color: '#166534', label: 'Confirmed'  },
  pending:    { bg: '#fffbeb', color: '#92400e', label: 'Pending'    },
  cancelled:  { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled'  },
  completed:  { bg: '#eff6ff', color: '#1e40af', label: 'Completed'  },
  failed:     { bg: '#f8fafc', color: '#475569', label: 'Failed'     },
}
const StatusBadge = ({ status }) => {
  const s = statusStyle[status] || statusStyle.pending
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: '6px',
      padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 700,
    }}>{s.label}</span>
  )
}

// ─── Custom Tooltip for Charts ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color === '#4ade80' ? '#00844d' : p.color, fontSize: '0.875rem', fontWeight: 800 }}>
          {p.name === 'revenue' ? `₹${p.value.toLocaleString('en-IN')}` : p.value}
        </div>
      ))}
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, revRes, bookRes] = await Promise.all([
          adminApi.get('/dashboard'),
          adminApi.get('/reports/revenue?period=monthly'),
          adminApi.get('/bookings?page=1&limit=5'),
        ])
        setStats(dashRes.data.stats)
        setRevenue(revRes.data.data.map(d => ({
          period: d.period.slice(0, 7),
          revenue: d.total_revenue,
          bookings: d.total_bookings,
        })))
        setRecentBookings(bookRes.data.bookings)
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#00844d', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading dashboard...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: '12px', padding: '1rem 1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
      {error}
    </div>
  )

  const bookingStatusData = stats ? [
    { name: 'Confirmed', value: stats.bookings_by_status.confirmed, fill: '#4ade80' },
    { name: 'Pending',   value: stats.bookings_by_status.pending,   fill: '#fbbf24' },
    { name: 'Completed', value: stats.bookings_by_status.completed, fill: '#60a5fa' },
    { name: 'Cancelled', value: stats.bookings_by_status.cancelled, fill: '#f87171' },
    { name: 'Failed',    value: stats.bookings_by_status.failed,    fill: '#6b7280' },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── KPI Row ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <StatCard
          icon={IndianRupee} label="Total Revenue"
          value={`₹${(stats?.total_revenue || 0).toLocaleString('en-IN')}`}
          sub={`Today: ₹${(stats?.today?.revenue || 0).toLocaleString('en-IN')}`}
          color="#00844d" iconBg="#ebf9f3"
        />
        <StatCard
          icon={CalendarCheck} label="Total Bookings"
          value={(stats?.total_bookings || 0).toLocaleString()}
          sub={`Today: ${stats?.today?.bookings || 0} new`}
          color="#2563eb" iconBg="#eff6ff"
        />
        <StatCard
          icon={Users} label="Total Users"
          value={(stats?.total_users || 0).toLocaleString()}
          sub="Registered users"
          color="#7c3aed" iconBg="#f5f3ff"
        />
        <StatCard
          icon={TrendingUp} label="Active Turfs"
          value={stats?.total_turfs || 0}
          sub="Live on platform"
          color="#ea580c" iconBg="#fff7ed"
        />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Revenue Trend */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
            Monthly Revenue
          </h3>
          {revenue.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenue" fill="#00844d" radius={[4, 4, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking Status Breakdown */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
            Booking Status Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookingStatusData} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} name="bookings"
                fill="#00844d"
                label={{ position: 'right', fill: '#64748b', fontSize: 11, fontWeight: 700 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Bookings ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
            Recent Bookings
          </h3>
          <a href="/admin/bookings" style={{ color: '#00844d', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View all <ArrowUpRight size={13} />
          </a>
        </div>

        {recentBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            No bookings yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['User', 'Turf', 'Date', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.75rem 0.75rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => (
                  <tr key={b._id} style={{ borderBottom: i < recentBookings.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
                      {b.user_id?.name || '—'}
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 400, marginTop: '1px' }}>{b.user_id?.phone}</div>
                    </td>
                    <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.8rem', color: '#475569' }}>
                      {b.turf_name_snapshot || b.turf_id?.name || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.8rem', color: '#475569' }}>
                      {b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '1px' }}>{b.start_time} – {b.end_time}</div>
                    </td>
                    <td style={{ padding: '0.875rem 0.75rem', fontSize: '0.85rem', color: '#00844d', fontWeight: 800 }}>
                      ₹{b.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.875rem 0.75rem' }}>
                      <StatusBadge status={b.booking_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
