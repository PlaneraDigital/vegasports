import { useState, useEffect } from 'react'
import { adminApi, api } from '../utils/adminApi'
import { Clock, Lock, CheckCircle, AlertCircle, Zap, RefreshCw } from 'lucide-react'

const slotColors = {
  available: { bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', label: 'Available' },
  booked: { bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.2)', color: '#f87171', label: 'Booked' },
  on_hold: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', label: 'On Hold' },
  blocked: { bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.2)', color: '#f87171', label: 'Booked' }, // Treat legacy blocked slots as booked
  expired: { bg: 'rgba(39, 39, 42, 0.5)', border: 'rgba(63, 63, 70, 0.3)', color: '#52525b', label: 'Expired' },
  unavailable: { bg: 'rgba(39, 39, 42, 0.3)', border: 'rgba(63, 63, 70, 0.2)', color: '#71717a', label: 'Unavailable' },
}

const today = () => new Date().toISOString().split('T')[0]

// Convert HH:MM (24h) to h:MM AM/PM (12h)
const to12h = (t) => {
  if (!t) return t
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour   = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

const isOverlapping = (s1, e1, s2, e2) => {
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let start1 = toMins(s1), end1 = toMins(e1);
  let start2 = toMins(s2), end2 = toMins(e2);
  if (end1 <= start1) end1 += 1440;
  if (end2 <= start2) end2 += 1440;
  return start1 < end2 && start2 < end1;
}

const SlotManagement = () => {
  const [turfs, setTurfs] = useState([])
  const [selectedTurf, setSelectedTurf] = useState('')
  const [selectedDate, setSelectedDate] = useState(today())
  const [slots, setSlots] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  // Generate slots form
  const [genForm, setGenForm] = useState({ price: '', peak_hour_price: '', peak_start: '', peak_end: '' })
  const [generating, setGenerating] = useState(false)

  // Slot action modal
  const [actionSlot, setActionSlot] = useState(null)   // { slot, mode: 'menu'|'price' }
  const [newPrice, setNewPrice] = useState('')
  const [applyToAllDays, setApplyToAllDays] = useState(false)
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  // Detect if logged-in user is a caretaker/receptionist (not admin)
  const isCaretaker = !!localStorage.getItem('receptionistToken')

  useEffect(() => {
    api.get('/api/turfs').then(r => setTurfs(r.data.turfs)).catch(() => { })
  }, [])

  const fetchSlots = async () => {
    if (!selectedTurf || !selectedDate) return
    setLoading(true); setFetched(false)
    try {
      const { data } = await adminApi.get(`/slots?turf_id=${selectedTurf}&date=${selectedDate}`)
      setSlots(data.slots)
      setSummary(data.summary)
      setFetched(true)
    } catch { showToast('Failed to fetch slots', 'error') }
    finally { setLoading(false) }
  }

  const handleGenerate = async () => {
    if (!genForm.price) { showToast('Base price is required', 'error'); return }
    setGenerating(true)
    try {
      await adminApi.post('/slots/generate', {
        turf_id: selectedTurf, date: selectedDate,
        price: Number(genForm.price),
        peak_hour_price: genForm.peak_hour_price ? Number(genForm.peak_hour_price) : undefined,
        peak_start: genForm.peak_start || undefined,
        peak_end: genForm.peak_end || undefined,
      })
      showToast('Slots generated!')
      fetchSlots()
    } catch (err) { showToast(err?.response?.data?.message || 'Generation failed', 'error') }
    finally { setGenerating(false) }
  }

  const handleBookToggle = async () => {
    setSaving(true)
    try {
      const slot = actionSlot.slot
      const isCurrentlyBooked = ['booked', 'blocked'].includes(slot.status)
      const newStatus = isCurrentlyBooked ? 'available' : 'booked'
      const payload = { 
        status: newStatus, 
        blocked_reason: null,
        turf_id: selectedTurf,
        ...(slot._id.startsWith('temp-') ? {
          date: selectedDate,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: slot.price
        } : {})
      }
      await adminApi.put(`/slots/${slot._id}/status`, payload)
      showToast(`Slot ${newStatus === 'booked' ? 'booked' : 'unbooked'}`)
      setActionSlot(null); fetchSlots()
    } catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const handlePriceUpdate = async () => {
    if (!newPrice) { showToast('Enter a price', 'error'); return }
    setSaving(true)
    try {
      const slot = actionSlot.slot
      const payload = { 
        price: Number(newPrice),
        applyToAllDays,
        turf_id: selectedTurf,
        start_time: slot.start_time,
        end_time: slot.end_time,
        ...(slot._id.startsWith('temp-') ? {
          date: selectedDate,
          status: slot.status
        } : {})
      }
      await adminApi.put(`/slots/${slot._id}/price`, payload)
      showToast('Price updated!')
      setActionSlot(null); setApplyToAllDays(false); fetchSlots()
    } catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const bookedSlotsInDb = slots.filter(s => ['booked', 'on_hold', 'blocked'].includes(s.status) && !s._id.startsWith('temp-'));
  const isOverlapSlot = (slot) => {
    if (!slot._id.startsWith('temp-')) return false;
    return bookedSlotsInDb.some(b => isOverlapping(b.start_time, b.end_time, slot.start_time, slot.end_time));
  };

  const total = slots.length;
  const available = slots.filter(s => s.status === 'available' && !isOverlapSlot(s)).length;
  const booked = slots.filter(s => ['booked', 'blocked'].includes(s.status) && !isOverlapSlot(s)).length;
  const on_hold = slots.filter(s => s.status === 'on_hold' && !isOverlapSlot(s)).length;
  const unavailable = slots.filter(s => isOverlapSlot(s)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          background: toast.type === 'error' ? '#1a1111' : '#111a14',
          border: `1px solid ${toast.type === 'error' ? '#442222' : '#224433'}`,
          color: toast.type === 'error' ? '#f87171' : '#4ade80',
          borderRadius: '12px', padding: '0.875rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} {toast.msg}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
          <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>Select Turf</label>
          <select value={selectedTurf} onChange={e => { setSelectedTurf(e.target.value); setFetched(false); setSlots([]) }}
            style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }}>
            <option value="">-- Choose a turf --</option>
            {turfs.map(t => <option key={t._id} value={t._id}>{t.name} — {t.location?.city}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>Date</label>
          <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setFetched(false); setSlots([]) }}
            min={today()}
            style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} />
        </div>
        <button onClick={fetchSlots} disabled={!selectedTurf || !selectedDate || loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg,#00844d,#006b3e)', border: 'none', borderRadius: '10px', padding: '0.6rem 1.25rem', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', opacity: !selectedTurf ? 0.5 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}>
          <RefreshCw size={14} /> Load Slots
        </button>
      </div>

      {/* ── Summary Strip ── */}
      {slots.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: total, color: '#71717a' },
            { label: 'Available', value: available, color: '#4ade80' },
            { label: 'Booked', value: booked, color: '#f87171' },
            { label: 'On Hold', value: on_hold, color: '#fbbf24' },
            { label: 'Unavailable', value: unavailable, color: '#71717a' },
          ].map(s => (
            <div key={s.label} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: '90px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '0.7rem', color: '#52525b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Slot Grid ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', fontSize: '0.875rem' }}>Loading slots...</div>
      )}

      {fetched && slots.length === 0 && (
        /* ── Generate Slots Panel (shown when no slots exist) ── */
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Zap size={16} color="#d97706" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#f4f4f5' }}>No slots found — Generate Slots</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Base Price (₹)*', key: 'price', type: 'number', ph: '1200' },
              { label: 'Peak Price (₹)', key: 'peak_hour_price', type: 'number', ph: '1800' },
              { label: 'Peak Start', key: 'peak_start', type: 'time', ph: '' },
              { label: 'Peak End', key: 'peak_end', type: 'time', ph: '' },
            ].map(({ label, key, type, ph }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>{label}</label>
                <input type={type} value={genForm[key]} onChange={e => setGenForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                  style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} />
              </div>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#d97706,#b45309)', border: 'none', borderRadius: '10px', padding: '0.65rem 1.25rem', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, boxShadow: '0 4px 12px rgba(217,119,6,0.15)' }}>
            <Zap size={14} /> {generating ? 'Generating...' : 'Generate Slots'}
          </button>
        </div>
      )}

      {slots.length > 0 && (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Clock size={15} color="#64748b" />
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#f4f4f5' }}>
              Slot Grid — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {/* Legend */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['available', 'booked', 'on_hold', 'unavailable'].map(k => {
                const v = slotColors[k]
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: v.bg, border: `1px solid ${v.border}` }} />
                    <span style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 700 }}>{v.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2 sm:gap-2.5">
            {slots.map(slot => {
              const isOverlap = isOverlapSlot(slot)
              const statusKey = isOverlap ? 'unavailable' : slot.status
              const s = slotColors[statusKey] || slotColors.expired
              const isBookedByAdmin = ['booked', 'blocked'].includes(slot.status) && slot.booked_by?.role === 'admin'
              const isClickable = ['available', 'booked', 'blocked'].includes(slot.status) && !isOverlap
              return (
                <button key={slot._id}
                  disabled={!isClickable}
                  onClick={() => { if (isClickable) setActionSlot({ slot, mode: 'menu' }) }}
                  style={{
                    background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px',
                    padding: '0.65rem 0.5rem', textAlign: 'center', cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (isClickable) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: s.color }}>{to12h(slot.start_time)}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color, margin: '0.1rem 0' }}>→ {to12h(slot.end_time)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#f4f4f5', fontWeight: 800 }}>₹{slot.price}</div>
                  {['booked', 'blocked'].includes(slot.status) && !isOverlap && <Lock size={10} color="#64748b" style={{ marginTop: '0.25rem', display: 'block', margin: '0.25rem auto 0' }} />}
                  {isOverlap && (
                    <div style={{ marginTop: '0.2rem', fontSize: '0.55rem', fontWeight: 800, color: '#71717a', background: 'rgba(113,113,122,0.1)', borderRadius: '4px', padding: '0.1rem 0.3rem', display: 'inline-block' }}>
                      UNAVAILABLE
                    </div>
                  )}
                  {isBookedByAdmin && (
                    <div style={{ marginTop: '0.2rem', fontSize: '0.55rem', fontWeight: 800, color: '#c084fc', background: 'rgba(192,132,252,0.12)', borderRadius: '4px', padding: '0.1rem 0.3rem', display: 'inline-block' }}>
                      ADMIN
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Slot Action Modal ── */}
      {actionSlot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '20px', padding: '1.75rem', maxWidth: '360px', width: '90%', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#f4f4f5', fontWeight: 800, fontSize: '1rem' }}>
              Slot: {to12h(actionSlot.slot.start_time)} – {to12h(actionSlot.slot.end_time)}
            </h3>
            <p style={{ color: '#71717a', fontSize: '0.8rem', margin: '0 0 1.25rem', fontWeight: 600 }}>Current price: ₹{actionSlot.slot.price}</p>

            {actionSlot.mode === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Booked-by-Admin remark banner */}
                {['booked', 'blocked'].includes(actionSlot.slot.status) && actionSlot.slot.booked_by?.role === 'admin' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.25)', borderRadius: '10px', padding: '0.6rem 0.875rem', marginBottom: '0.15rem' }}>
                    <Lock size={13} color="#c084fc" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc' }}>Booked by Admin</span>
                    {actionSlot.slot.booked_by?.name && (
                      <span style={{ fontSize: '0.72rem', color: '#a855f7', marginLeft: 'auto' }}>{actionSlot.slot.booked_by.name}</span>
                    )}
                  </div>
                )}

                {/* Only admins can book/unbook */}
                {!isCaretaker && (
                  <button onClick={handleBookToggle} disabled={saving}
                    style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={14} /> {saving ? 'Processing...' : ['booked', 'blocked'].includes(actionSlot.slot.status) ? 'Unbook this slot' : 'Book this slot'}
                  </button>
                )}

                <button onClick={() => { setNewPrice(actionSlot.slot.price); setActionSlot(a => ({ ...a, mode: 'price' })) }}
                  style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.2)', color: '#60a5fa', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ₹ Update price
                </button>
                <button onClick={() => setActionSlot(null)} style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#18181b', border: '1px solid #27272a', color: '#71717a', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Cancel
                </button>
              </div>
            )}

            {actionSlot.mode === 'price' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>New Price (₹)</label>
                  <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input type="checkbox" id="allDays" checked={applyToAllDays} onChange={e => setApplyToAllDays(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="allDays" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Apply to all future days</label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => { setActionSlot(null); setApplyToAllDays(false) }} style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', background: '#18181b', border: '1px solid #27272a', color: '#71717a', fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handlePriceUpdate} disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: '12px', background: 'linear-gradient(135deg,#00844d,#006b3e)', border: 'none', color: '#fff', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}>
                    {saving ? 'Saving...' : 'Update Price'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SlotManagement
