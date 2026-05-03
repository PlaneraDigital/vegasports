import { useState, useEffect } from 'react'
import { adminApi, api } from '../utils/adminApi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, Clock, Layers, Users } from 'lucide-react'

const TABS = [
  { id: 'revenue',  label: 'Revenue',       icon: TrendingUp },
  { id: 'peak',     label: 'Peak Hours',     icon: Clock      },
  { id: 'turf',     label: 'Turf Breakdown', icon: Layers     },
  { id: 'users',    label: 'User Analytics', icon: Users      },
]

const PIE_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#c084fc', '#fb923c']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '0.75rem 1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      <div style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#00844d', fontSize: '0.875rem', fontWeight: 800 }}>
          {p.name === 'revenue' || p.name === 'total_revenue' ? `₹${Number(p.value).toLocaleString('en-IN')}` : p.value}
        </div>
      ))}
    </div>
  )
}

const sectionStyle = { background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
const kpiCard = (label, value, color = '#00844d') => (
  <div key={label} style={{ background: '#18181b', borderRadius: '16px', padding: '1.25rem', border: '1px solid #27272a', flex: 1, minWidth: '140px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
    <div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{value}</div>
  </div>
)

const Reports = () => {
  const [activeTab, setActiveTab] = useState('revenue')

  // Revenue tab
  const [revPeriod, setRevPeriod] = useState('monthly')
  const [revYear, setRevYear] = useState(new Date().getFullYear())
  const [revTurf, setRevTurf] = useState('')
  const [revData, setRevData] = useState(null)
  const [revLoading, setRevLoading] = useState(false)

  // Peak hours tab
  const [peakTurf, setPeakTurf] = useState('')
  const [peakData, setPeakData] = useState(null)
  const [peakLoading, setPeakLoading] = useState(false)

  // Turf breakdown tab
  const [turfBreakdown, setTurfBreakdown] = useState(null)
  const [turfLoading, setTurfLoading] = useState(false)

  // User analytics tab
  const [userAnalytics, setUserAnalytics] = useState(null)
  const [userLoading, setUserLoading] = useState(false)

  const [turfs, setTurfs] = useState([])

  useEffect(() => { api.get('/api/turfs').then(r => setTurfs(r.data.turfs)).catch(() => {}) }, [])

  // Fetch based on active tab
  useEffect(() => {
    if (activeTab === 'revenue') fetchRevenue()
    if (activeTab === 'peak')    fetchPeak()
    if (activeTab === 'turf')    fetchTurfBreakdown()
    if (activeTab === 'users')   fetchUserAnalytics()
  }, [activeTab])

  const fetchRevenue = async () => {
    setRevLoading(true)
    try {
      const params = new URLSearchParams({ period: revPeriod, year: revYear })
      if (revTurf) params.set('turf_id', revTurf)
      const { data } = await adminApi.get(`/reports/revenue?${params}`)
      setRevData(data)
    } catch {} finally { setRevLoading(false) }
  }

  const fetchPeak = async () => {
    setPeakLoading(true)
    try {
      const params = peakTurf ? `?turf_id=${peakTurf}` : ''
      const { data } = await adminApi.get(`/reports/peak-hours${params}`)
      setPeakData(data)
    } catch {} finally { setPeakLoading(false) }
  }

  const fetchTurfBreakdown = async () => {
    setTurfLoading(true)
    try {
      const { data } = await adminApi.get('/reports/turf-revenue')
      setTurfBreakdown(data)
    } catch {} finally { setTurfLoading(false) }
  }

  const fetchUserAnalytics = async () => {
    setUserLoading(true)
    try {
      const { data } = await adminApi.get('/reports/user-analytics')
      setUserAnalytics(data)
    } catch {} finally { setUserLoading(false) }
  }

  const inputSt = { background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.8rem', outline: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '0.4rem', width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, transition: 'all 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: activeTab === id ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
              color: activeTab === id ? '#4ade80' : '#71717a',
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Revenue Tab ── */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls */}
          <div style={{ ...sectionStyle, display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>Period</label>
              <select value={revPeriod} onChange={e => setRevPeriod(e.target.value)} style={inputSt} onFocus={e => e.target.style.borderColor = '#4ade80'} onBlur={e => e.target.style.borderColor = '#27272a'}>
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>Year</label>
              <input type="number" value={revYear} onChange={e => setRevYear(e.target.value)} min="2020" max="2030" style={{ ...inputSt, width: '90px' }} onFocus={e => e.target.style.borderColor = '#4ade80'} onBlur={e => e.target.style.borderColor = '#27272a'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>Turf (optional)</label>
              <select value={revTurf} onChange={e => setRevTurf(e.target.value)} style={{ ...inputSt, maxWidth: '180px' }} onFocus={e => e.target.style.borderColor = '#4ade80'} onBlur={e => e.target.style.borderColor = '#27272a'}>
                <option value="">All Turfs</option>
                {turfs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <button onClick={fetchRevenue}
              style={{ background: 'linear-gradient(135deg,#00844d,#006b3e)', border: 'none', borderRadius: '10px', padding: '0.65rem 1.25rem', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}>
              Load
            </button>
          </div>

          {revData && (
            <>
              {/* KPIs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {kpiCard('Total Revenue', `₹${revData.total_revenue?.toLocaleString('en-IN')}`)}
                {kpiCard('Total Bookings', revData.data?.reduce((s, d) => s + d.total_bookings, 0), '#2563eb')}
                {kpiCard('Data Points', revData.data?.length, '#d97706')}
              </div>
              {/* Chart */}
              <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>
                  Revenue Trend ({revPeriod})
                </h3>
                {revData.data?.length === 0 ? (
                  <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: '0.85rem', fontWeight: 600 }}>No data for selected range</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revData.data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="total_revenue" fill="#4ade80" radius={[6, 6, 0, 0]} name="revenue" barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Peak Hours Tab ── */}
      {activeTab === 'peak' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...sectionStyle, display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>Turf (optional)</label>
              <select value={peakTurf} onChange={e => setPeakTurf(e.target.value)} style={inputSt} onFocus={e => e.target.style.borderColor = '#4ade80'} onBlur={e => e.target.style.borderColor = '#27272a'}>
                <option value="">All Turfs</option>
                {turfs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <button onClick={fetchPeak} style={{ background: 'linear-gradient(135deg,#00844d,#006b3e)', border: 'none', borderRadius: '10px', padding: '0.65rem 1.25rem', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}>
              Load
            </button>
          </div>
          {peakLoading && <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.875rem' }}>Loading...</div>}
          {peakData && (
            <div style={sectionStyle}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>Bookings by Start Time</h3>
              {peakData.peak_hours?.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#52525b', padding: '2rem', fontSize: '0.875rem', fontWeight: 600 }}>No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={peakData.peak_hours?.slice(0, 16)} layout="vertical" margin={{ top: 4, right: 24, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="start_time" tick={{ fill: '#f4f4f5', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="total_bookings" fill="#d97706" radius={[0, 6, 6, 0]} name="bookings" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Turf Breakdown Tab ── */}
      {activeTab === 'turf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {turfLoading && <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.875rem' }}>Loading...</div>}
          {turfBreakdown && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Pie chart */}
              <div style={sectionStyle}>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>Revenue Share</h3>
                {turfBreakdown.data?.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#52525b', padding: '2rem', fontWeight: 600 }}>No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={turfBreakdown.data} dataKey="total_revenue" nameKey="turf_name" cx="50%" cy="50%" outerRadius={90} innerRadius={60} label={({ name, percent }) => `${name?.slice(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {turfBreakdown.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                      </Pie>
                      <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', color: '#f4f4f5', fontWeight: 800 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Table */}
              <div style={sectionStyle}>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>Ranking</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {turfBreakdown.data?.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] + '15', color: PIE_COLORS[i % PIE_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.turf_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 600 }}>{t.total_bookings} bookings</div>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4ade80' }}>₹{t.total_revenue?.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── User Analytics Tab ── */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {userLoading && <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: '0.875rem' }}>Loading...</div>}
          {userAnalytics && (
            <>
              {/* KPI cards */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {kpiCard('Total Users',       userAnalytics.analytics?.total_users,          '#7c3aed')}
                {kpiCard('Active Users',      userAnalytics.analytics?.active_users,         '#00844d')}
                {kpiCard('New This Month',    userAnalytics.analytics?.new_users_this_month,  '#2563eb')}
              </div>
              {/* Top users table */}
              <div style={sectionStyle}>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>Top Users by Bookings</h3>
                {userAnalytics.analytics?.top_users_by_bookings?.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#52525b', padding: '2rem', fontSize: '0.875rem', fontWeight: 600 }}>No booking data yet</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #27272a', background: '#18181b' }}>
                        {['#', 'User', 'Email', 'Bookings', 'Total Spent'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.7rem', color: '#71717a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userAnalytics.analytics.top_users_by_bookings.map((u, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #27272a' }}>
                          <td style={{ padding: '0.875rem 1rem', color: '#71717a', fontSize: '0.8rem', fontWeight: 900 }}>#{i + 1}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 800, color: '#f4f4f5' }}>{u.name}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>{u.email}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 900, color: '#60a5fa' }}>{u.total_bookings}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 900, color: '#4ade80' }}>₹{u.total_spent?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Reports
