import { useState, useEffect } from 'react'
import { adminApi, api } from '../utils/adminApi'
import { Clock, Lock, CheckCircle, AlertCircle, Zap, RefreshCw } from 'lucide-react'

const slotColors = {
  available: { bg: '#ebf9f3', border: '#bbf7d0', color: '#166534', label: 'Available' },
  booked: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', label: 'Booked' },
  on_hold: { bg: '#fffbeb', border: '#fef3c7', color: '#92400e', label: 'On Hold' },
  blocked: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569', label: 'Blocked' },
  expired: { bg: '#f1f5f9', border: '#e2e8f0', color: '#94a3b8', label: 'Expired' },
}

const today = () => new Date().toISOString().split('T')[0]

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
  const [actionSlot, setActionSlot] = useState(null)   // { slot, mode: 'block'|'price' }
  const [blockReason, setBlockReason] = useState('Maintenance')
  const [newPrice, setNewPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

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

  const handleBlock = async () => {
    setSaving(true)
    try {
      const slot = actionSlot.slot
      const newStatus = slot.status === 'blocked' ? 'available' : 'blocked'
      await adminApi.put(`/slots/${slot._id}/status`, { status: newStatus, blocked_reason: blockReason })
      showToast(`Slot ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}`)
      setActionSlot(null); fetchSlots()
    } catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const handlePriceUpdate = async () => {
    if (!newPrice) { showToast('Enter a price', 'error'); return }
    setSaving(true)
    try {
      await adminApi.put(`/slots/${actionSlot.slot._id}/price`, { price: Number(newPrice) })
      showToast('Price updated!')
      setActionSlot(null); fetchSlots()
    } catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          background: toast.type === 'error' ? '#fef2f2' : '#ebf9f3',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#991b1b' : '#166534',
          borderRadius: '12px', padding: '0.875rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />} {toast.msg}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
          <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>Select Turf</label>
          <select value={selectedTurf} onChange={e => { setSelectedTurf(e.target.value); setFetched(false); setSlots([]) }}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: selectedTurf ? '#0f172a' : '#94a3b8', fontSize: '0.85rem', outline: 'none' }}>
            <option value="">-- Choose a turf --</option>
            {turfs.map(t => <option key={t._id} value={t._id}>{t.name} — {t.location?.city}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>Date</label>
          <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setFetched(false); setSlots([]) }}
            min={today()}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
        </div>
        <button onClick={fetchSlots} disabled={!selectedTurf || !selectedDate || loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg,#00844d,#006b3e)', border: 'none', borderRadius: '10px', padding: '0.6rem 1.25rem', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', opacity: !selectedTurf ? 0.5 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}>
          <RefreshCw size={14} /> Load Slots
        </button>
      </div>

      {/* ── Summary Strip ── */}
      {summary && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: summary.total, color: '#64748b' },
            { label: 'Available', value: summary.available, color: '#00844d' },
            { label: 'Booked', value: summary.booked, color: '#dc2626' },
            { label: 'On Hold', value: summary.on_hold, color: '#d97706' },
            { label: 'Blocked', value: summary.blocked, color: '#475569' },
          ].map(s => (
            <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: '90px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
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
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Zap size={16} color="#d97706" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>No slots found — Generate Slots</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Base Price (₹)*', key: 'price', type: 'number', ph: '1200' },
              { label: 'Peak Price (₹)', key: 'peak_hour_price', type: 'number', ph: '1800' },
              { label: 'Peak Start', key: 'peak_start', type: 'time', ph: '' },
              { label: 'Peak End', key: 'peak_end', type: 'time', ph: '' },
            ].map(({ label, key, type, ph }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>{label}</label>
                <input type={type} value={genForm[key]} onChange={e => setGenForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
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
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Clock size={15} color="#64748b" />
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
              Slot Grid — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {/* Legend */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {Object.entries(slotColors).slice(0, 4).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: v.bg, border: `1px solid ${v.border}` }} />
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2 sm:gap-2.5">
            {slots.map(slot => {
              const s = slotColors[slot.status] || slotColors.expired
              const isClickable = ['available', 'blocked'].includes(slot.status)
              return (
                <button key={slot._id}
                  onClick={() => { if (isClickable) setActionSlot({ slot, mode: slot.status === 'blocked' ? 'block' : 'menu' }) }}
                  style={{
                    background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px',
                    padding: '0.65rem 0.5rem', textAlign: 'center', cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (isClickable) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: s.color }}>{slot.start_time}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color, margin: '0.1rem 0' }}>→ {slot.end_time}</div>
                  <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 800 }}>₹{slot.price}</div>
                  {slot.status === 'blocked' && <Lock size={10} color="#64748b" style={{ marginTop: '0.25rem', display: 'block', margin: '0.25rem auto 0' }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Slot Action Modal ── */}
      {actionSlot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', maxWidth: '360px', width: '90%', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontWeight: 800, fontSize: '1rem' }}>
              Slot: {actionSlot.slot.start_time} – {actionSlot.slot.end_time}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 1.25rem', fontWeight: 600 }}>Current price: ₹{actionSlot.slot.price}</p>

            {actionSlot.mode === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button onClick={() => setActionSlot(a => ({ ...a, mode: 'block' }))}
                  style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={14} /> Block this slot
                </button>
                <button onClick={() => { setNewPrice(actionSlot.slot.price); setActionSlot(a => ({ ...a, mode: 'price' })) }}
                  style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ₹ Update price
                </button>
                <button onClick={() => setActionSlot(null)} style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Cancel
                </button>
              </div>
            )}

            {actionSlot.mode === 'block' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Reason</label>
                  <select value={blockReason} onChange={e => setBlockReason(e.target.value)}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}>
                    {['Maintenance', 'Holiday', 'Private Event'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setActionSlot(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleBlock} disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: '12px', background: '#dc2626', border: 'none', color: '#fff', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Blocking...' : actionSlot.slot.status === 'blocked' ? 'Unblock' : 'Block Slot'}
                  </button>
                </div>
              </div>
            )}

            {actionSlot.mode === 'price' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>New Price (₹)</label>
                  <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setActionSlot(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>
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
