import { useState, useEffect, useCallback } from 'react'
import { adminApi, api } from '../utils/adminApi'
import { Filter, X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Eye, Banknote } from 'lucide-react'

// Convert HH:MM (24h) to h:MM AM/PM (12h)
const to12h = (t) => {
  if (!t) return t
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

const statusStyle = {
  confirmed: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', label: 'Confirmed' },
  pending: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', label: 'Pending' },
  cancelled: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', label: 'Cancelled' },
  completed: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', label: 'Completed' },
  failed: { color: '#a1a1aa', bg: 'rgba(113, 113, 122, 0.1)', label: 'Failed' },
}

const payStyle = {
  paid: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', label: 'Paid' },
  advance_paid: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', label: 'Advance Paid' },
  pending: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', label: 'Pending' },
  failed: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', label: 'Failed' },
  refunded: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', label: 'Refunded' },
  cancelled: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.1)', label: 'N/A' },
  admin: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', label: 'Admin' },
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

  const [detailBooking, setDetailBooking] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('Other')
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { api.get('/api/turfs').then(r => setTurfs(r.data.turfs)).catch(() => { }) }, [])

  const fetchBookings = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 10 })
      if (filters.status) params.set('status', filters.status)
      if (filters.turf_id) params.set('turf_id', filters.turf_id)
      if (filters.date) params.set('date', filters.date)
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
      await adminApi.post(`/pay-online/${booking._id}`)
      showToast('Marked as fully paid. Blue Card email sent! ✅')
      setDetailBooking(null)
      fetchBookings(page)
    } catch (err) { showToast(err?.response?.data?.message || 'Failed to mark paid', 'error') }
  }

  const handleMarkPaidCash = async (booking) => {
    if (!window.confirm(`Confirm payment in CASH for booking #${booking._id?.toString().slice(-6).toUpperCase()}? This will mark it as paid and send the Blue Card email.`)) return
    try {
      await adminApi.post(`/pay-cash/${booking._id}`)
      showToast('Payment recorded in Cash! Blue Card email sent. 💵')
      setDetailBooking(null)
      fetchBookings(page)
    } catch (err) { showToast(err?.response?.data?.message || 'Failed to record cash payment', 'error') }
  }

  const filteredBookings = bookings

  const th = { textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }
  const td = { padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#9ca3af', verticalAlign: 'top' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          background: toast.type === 'error' ? '#1a1111' : '#111a14',
          border: `1px solid ${toast.type === 'error' ? '#442222' : '#224433'}`,
          color: toast.type === 'error' ? '#f87171' : '#4ade80',
          borderRadius: '12px', padding: '0.875rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} {toast.msg}
        </div>
      )}



      {/* ── Info Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#71717a', fontSize: '0.8rem', fontWeight: 600 }}>{total} bookings found</span>
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => fetchBookings(page - 1)} disabled={page === 1}
              style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.35rem', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#71717a', display: 'flex', opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#f4f4f5', fontSize: '0.8rem', fontWeight: 700 }}>{page} / {pages}</span>
            <button onClick={() => fetchBookings(page + 1)} disabled={page === pages}
              style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.35rem', cursor: page === pages ? 'not-allowed' : 'pointer', color: '#71717a', display: 'flex', opacity: page === pages ? 0.4 : 1 }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a', fontSize: '0.875rem' }}>Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#71717a', fontSize: '0.875rem' }}>No bookings found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #27272a', background: '#18181b' }}>
                {['User', 'Turf', 'Date & Time', 'Amount', 'Payment', 'Method', 'Status', 'Actions'].map(h => <th key={h} style={{ ...th, color: '#71717a', fontWeight: 800 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredBookings.map((b, i) => (
                  <tr key={b._id} style={{ borderBottom: i < filteredBookings.length - 1 ? '1px solid #27272a' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={td}>
                      <div style={{ fontWeight: 800, color: '#f4f4f5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {b.booked_by_admin ? (
                          <span style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc', borderRadius: '5px', padding: '0.15rem 0.4rem', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em' }}>ADMIN</span>
                        ) : (b.user_id?.name || '—')}
                        {b.booked_by_admin && <span style={{ color: '#f4f4f5', fontSize: '0.8rem' }}>{b.user_id?.name}</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 600 }}>{b.booked_by_admin ? 'Slot booked by Admin' : b.user_id?.phone}</div>
                    </td>
                    <td style={{ ...td, color: '#a1a1aa', fontWeight: 600 }}>{b.turf_name_snapshot || b.turf_id?.name || '—'}</td>
                    <td style={td}>
                      <div style={{ color: '#f4f4f5', fontWeight: 700 }}>{b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                      <div style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 600 }}>{to12h(b.start_time)} – {to12h(b.end_time)}</div>
                    </td>
                    <td style={{ ...td, color: '#4ade80', fontWeight: 800 }}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                    <td style={td}>
                      <StatusBadge
                        status={b.booking_status === 'cancelled' && b.payment?.status === 'pending' ? 'cancelled' : (b.booked_by_admin ? 'admin' : b.payment?.status)}
                        map={payStyle}
                      />
                    </td>
                    <td style={td}>
                      <div style={{ color: '#f4f4f5', fontSize: '0.75rem', fontWeight: 600 }}>
                        {b.booked_by_admin ? 'Admin' : (b.payment?.gateway ? b.payment.gateway.charAt(0).toUpperCase() + b.payment.gateway.slice(1) : '—')}
                      </div>
                    </td>
                    <td style={td}><StatusBadge status={b.booking_status} map={statusStyle} /></td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button onClick={() => setDetailBooking(b)}
                          style={{ background: 'rgba(96, 165, 250, 0.1)', border: 'none', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', color: '#60a5fa', display: 'flex' }} title="View">
                          <Eye size={14} />
                        </button>
                        {b.payment?.status === 'advance_paid' && (
                          <>
                            <button onClick={() => handleMarkFullyPaid(b)}
                              style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: '#4ade80', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Mark Fully Paid">
                              ✅ Mark Paid
                            </button>
                            <button onClick={() => handleMarkPaidCash(b)}
                              style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: '#fbbf24', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Payment in Cash">
                              💵 Cash
                            </button>
                          </>
                        )}
                        {['pending', 'confirmed'].includes(b.booking_status) && (
                          <button onClick={() => setCancelModal(b)}
                            style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', color: '#f87171', display: 'flex' }} title="Cancel">
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
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '24px', padding: '2rem', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: '#f4f4f5', fontSize: '1.1rem' }}>Booking Details</h3>
              <button onClick={() => setDetailBooking(null)} style={{ background: '#18181b', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: '#71717a', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {[
                { label: 'Booking ID', value: detailBooking._id },
                ...(detailBooking.booked_by_admin ? [
                  { label: 'Type', value: '🛡️ Admin Booked Slot' },
                  { label: 'Admin', value: detailBooking.user_id?.name },
                ] : [
                  { label: 'User', value: `${detailBooking.user_id?.name} (${detailBooking.user_id?.phone})` },
                  { label: 'Email', value: detailBooking.user_id?.email },
                ]),
                { label: 'Turf', value: detailBooking.turf_name_snapshot || detailBooking.turf_id?.name },
                { label: 'Date', value: detailBooking.date ? new Date(detailBooking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { label: 'Time', value: `${to12h(detailBooking.start_time)} – ${to12h(detailBooking.end_time)}` },
                { label: 'Amount', value: `₹${detailBooking.total_amount?.toLocaleString('en-IN')}` },
                { label: 'Payment Status', value: detailBooking.payment?.status },
                { label: 'Payment Method', value: detailBooking.booked_by_admin ? 'Admin (No payment)' : (detailBooking.payment?.gateway ? detailBooking.payment.gateway.charAt(0).toUpperCase() + detailBooking.payment.gateway.slice(1) : '—') },
                { label: 'Booking Status', value: detailBooking.booking_status },
                { label: 'Slots', value: detailBooking.slot_ids?.length ? `${detailBooking.slot_ids.length} slot(s)` : '—' },
                ...(detailBooking.cancellation?.cancelled_at ? [
                  { label: 'Cancelled By', value: detailBooking.cancellation.cancelled_by },
                  { label: 'Cancel Reason', value: detailBooking.cancellation.reason },
                  { label: 'Refund', value: `₹${detailBooking.cancellation.refund_amount} (${detailBooking.cancellation.refund_status})` },
                ] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid #27272a' }}>
                  <div style={{ width: '150px', flexShrink: 0, color: '#71717a', fontSize: '0.8rem', fontWeight: 700 }}>{label}</div>
                  <div style={{ color: '#f4f4f5', fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
            {detailBooking.payment?.status === 'advance_paid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <button onClick={() => handleMarkFullyPaid(detailBooking)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', color: '#4ade80', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  ✅ Mark as Fully Paid (Online/Other)
                </button>
                <button onClick={() => handleMarkPaidCash(detailBooking)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  💵 Payment in Cash
                </button>
              </div>
            )}
            {['pending', 'confirmed'].includes(detailBooking.booking_status) && (
              <button onClick={() => { setCancelModal(detailBooking); setDetailBooking(null) }}
                style={{ marginTop: '1.5rem', width: '100%', padding: '0.8rem', borderRadius: '14px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Cancel This Booking
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel Confirm Modal ── */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '90%', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f4f4f5', fontWeight: 800 }}>Cancel Booking?</h3>
            <p style={{ color: '#71717a', fontSize: '0.875rem', margin: '0 0 1.5rem', fontWeight: 600 }}>
              {cancelModal.payment?.status === 'paid' ? `Refund of ₹${cancelModal.total_amount?.toLocaleString('en-IN')} will be initiated.` : 'No refund as payment was not completed.'}
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Reason for cancellation</label>
              <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '0.7rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }}>
                {['Changed plans', 'Emergency', 'Weather', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setCancelModal(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#18181b', border: '1px solid #27272a', color: '#71717a', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Keep Booking</button>
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
