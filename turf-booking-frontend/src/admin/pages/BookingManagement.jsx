import { useState, useEffect, useCallback } from 'react'
import { adminApi, api } from '../utils/adminApi'
import { Search, Filter, X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

const statusStyle = {
  confirmed: { color: '#166534', bg: '#ebf9f3', label: 'Confirmed' },
  pending:   { color: '#92400e', bg: '#fffbeb', label: 'Pending'   },
  cancelled: { color: '#991b1b', bg: '#fef2f2', label: 'Cancelled' },
  completed: { color: '#1e40af', bg: '#eff6ff', label: 'Completed' },
  failed:    { color: '#475569', bg: '#f8fafc', label: 'Failed'   },
}

const payStyle = {
  paid:         { color: '#166534', bg: '#ebf9f3', label: 'Paid'         },
  advance_paid: { color: '#92400e', bg: '#fffbeb', label: 'Advance Paid' },
  pending:      { color: '#92400e', bg: '#fffbeb', label: 'Pending'      },
  failed:       { color: '#991b1b', bg: '#fef2f2', label: 'Failed'       },
  refunded:     { color: '#5b21b6', bg: '#f5f3ff', label: 'Refunded'     },
  cancelled:    { color: '#64748b', bg: '#f1f5f9', label: 'N/A'          },
}

const StatusBadge = ({ status, map }) => {
  const s = map[status] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', label: status }
  return (
    <span style={{ background: s.bg || 'rgba(156,163,175,0.08)', color: s.color, borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
      {s.label}
    </span>
  )
}

const BookingManagement = () => {
  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [turfs, setTurfs] = useState([])

  const [filters, setFilters] = useState({ status: '', turf_id: '', date: '' })
  const [search, setSearch] = useState('')

  const [detailBooking, setDetailBooking] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('Other')
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { api.get('/api/turfs').then(r => setTurfs(r.data.turfs)).catch(() => {}) }, [])

  const fetchBookings = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 10 })
      if (filters.status)  params.set('status', filters.status)
      if (filters.turf_id) params.set('turf_id', filters.turf_id)
      if (filters.date)    params.set('date', filters.date)
      const { data } = await adminApi.get(`/bookings?${params}`)
      setBookings(data.bookings)
      setTotal(data.total)
      setPages(data.pages)
      setPage(p)
    } catch { showToast('Failed to load bookings', 'error') }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchBookings(1) }, [filters])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await adminApi.put(`/bookings/${cancelModal._id}/cancel`, { reason: cancelReason })
      showToast('Booking cancelled')
      setCancelModal(null)
      setDetailBooking(null)
      fetchBookings(page)
    } catch (err) { showToast(err?.response?.data?.message || 'Failed to cancel', 'error') }
    finally { setCancelling(false) }
  }

  const handleMarkFullyPaid = async (booking) => {
    if (!window.confirm(`Mark booking #${booking._id?.toString().slice(-6).toUpperCase()} as fully paid? This will send the Blue Card email to the customer.`)) return
    try {
      await api.post(`/api/payment/mark-fully-paid/${booking._id}`)
      showToast('Marked as fully paid. Blue Card email sent! ✅')
      setDetailBooking(null)
      fetchBookings(page)
    } catch (err) { showToast(err?.response?.data?.message || 'Failed to mark paid', 'error') }
  }

  const filteredBookings = search
    ? bookings.filter(b =>
        b.user_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.user_id?.phone?.includes(search) ||
        b.user_id?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings

  const th = { textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }
  const td = { padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#9ca3af', verticalAlign: 'top' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          background: toast.type === 'error' ? '#fef2f2' : '#ebf9f3',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#991b1b' : '#166534',
          borderRadius: '12px', padding: '0.875rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} {toast.msg}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
            style={{ width: '100%', boxSizing: 'border-box', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.875rem 0.65rem 2.5rem', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }} />
        </div>
        {/* Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>Status</label>
          <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }}>
            <option value="">All Status</option>
            {['pending', 'confirmed', 'completed', 'cancelled', 'failed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        {/* Turf */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>Turf</label>
          <select value={filters.turf_id} onChange={e => setFilters(p => ({ ...p, turf_id: e.target.value }))}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.8rem', outline: 'none', maxWidth: '180px' }}>
            <option value="">All Turfs</option>
            {turfs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        {/* Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>Date</label>
          <input type="date" value={filters.date} onChange={e => setFilters(p => ({ ...p, date: e.target.value }))}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.8rem', outline: 'none' }} />
        </div>
        {(filters.status || filters.turf_id || filters.date) && (
          <button onClick={() => setFilters({ status: '', turf_id: '', date: '' })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '0.65rem 0.875rem', color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Info Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{total} bookings found</span>
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => fetchBookings(page - 1)} disabled={page === 1}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.35rem', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#64748b', display: 'flex', opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#0f172a', fontSize: '0.8rem', fontWeight: 700 }}>{page} / {pages}</span>
            <button onClick={() => fetchBookings(page + 1)} disabled={page === pages}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.35rem', cursor: page === pages ? 'not-allowed' : 'pointer', color: '#64748b', display: 'flex', opacity: page === pages ? 0.4 : 1 }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>No bookings found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {['User', 'Turf', 'Date & Time', 'Amount', 'Payment', 'Status', 'Actions'].map(h => <th key={h} style={{ ...th, color: '#64748b', fontWeight: 800 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredBookings.map((b, i) => (
                  <tr key={b._id} style={{ borderBottom: i < filteredBookings.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={td}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{b.user_id?.name || '—'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{b.user_id?.phone}</div>
                    </td>
                    <td style={{ ...td, color: '#475569', fontWeight: 600 }}>{b.turf_name_snapshot || b.turf_id?.name || '—'}</td>
                    <td style={td}>
                      <div style={{ color: '#0f172a', fontWeight: 700 }}>{b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>{b.start_time} – {b.end_time}</div>
                    </td>
                    <td style={{ ...td, color: '#00844d', fontWeight: 800 }}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                    <td style={td}>
                      <StatusBadge
                        status={b.booking_status === 'cancelled' && b.payment?.status === 'pending' ? 'cancelled' : b.payment?.status}
                        map={payStyle}
                      />
                    </td>
                    <td style={td}><StatusBadge status={b.booking_status} map={statusStyle} /></td>
                    <td style={td}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button onClick={() => setDetailBooking(b)}
                            style={{ background: '#eff6ff', border: 'none', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', color: '#2563eb', display: 'flex' }} title="View">
                            <Eye size={14} />
                          </button>
                          {b.payment?.status === 'advance_paid' && (
                            <button onClick={() => handleMarkFullyPaid(b)}
                              style={{ background: '#ebf9f3', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: '#166534', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Mark Fully Paid">
                              ✅ Mark Paid
                            </button>
                          )}
                          {['pending', 'confirmed'].includes(b.booking_status) && (
                            <button onClick={() => setCancelModal(b)}
                              style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', color: '#dc2626', display: 'flex' }} title="Cancel">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {detailBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2rem', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Booking Details</h3>
              <button onClick={() => setDetailBooking(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: '#64748b', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {[
                { label: 'Booking ID', value: detailBooking._id },
                { label: 'User', value: `${detailBooking.user_id?.name} (${detailBooking.user_id?.phone})` },
                { label: 'Email', value: detailBooking.user_id?.email },
                { label: 'Turf', value: detailBooking.turf_name_snapshot || detailBooking.turf_id?.name },
                { label: 'Date', value: detailBooking.date ? new Date(detailBooking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { label: 'Time', value: `${detailBooking.start_time} – ${detailBooking.end_time}` },
                { label: 'Amount', value: `₹${detailBooking.total_amount?.toLocaleString('en-IN')}` },
                { label: 'Payment', value: detailBooking.payment?.status },
                { label: 'Booking Status', value: detailBooking.booking_status },
                { label: 'Slots', value: detailBooking.slot_ids?.length ? `${detailBooking.slot_ids.length} slot(s)` : '—' },
                ...(detailBooking.cancellation?.cancelled_at ? [
                  { label: 'Cancelled By', value: detailBooking.cancellation.cancelled_by },
                  { label: 'Cancel Reason', value: detailBooking.cancellation.reason },
                  { label: 'Refund', value: `₹${detailBooking.cancellation.refund_amount} (${detailBooking.cancellation.refund_status})` },
                ] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: '150px', flexShrink: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>{label}</div>
                  <div style={{ color: '#0f172a', fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
            {detailBooking.payment?.status === 'advance_paid' && (
              <button onClick={() => handleMarkFullyPaid(detailBooking)}
                style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', borderRadius: '14px', background: '#ebf9f3', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ✅ Mark as Fully Paid (Send Blue Card Email)
              </button>
            )}
            {['pending', 'confirmed'].includes(detailBooking.booking_status) && (
              <button onClick={() => { setCancelModal(detailBooking); setDetailBooking(null) }}
                style={{ marginTop: '1.5rem', width: '100%', padding: '0.8rem', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Cancel This Booking
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel Confirm Modal ── */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '90%', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontWeight: 800 }}>Cancel Booking?</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.5rem', fontWeight: 600 }}>
              {cancelModal.payment?.status === 'paid' ? `Refund of ₹${cancelModal.total_amount?.toLocaleString('en-IN')} will be initiated.` : 'No refund as payment was not completed.'}
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Reason for cancellation</label>
              <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.7rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}>
                {['Changed plans', 'Emergency', 'Weather', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setCancelModal(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Keep Booking</button>
              <button onClick={handleCancel} disabled={cancelling} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#dc2626', border: 'none', color: '#fff', fontWeight: 800, cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {cancelling ? 'Cancelling...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingManagement
