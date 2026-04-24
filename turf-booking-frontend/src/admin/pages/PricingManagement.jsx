import { useState, useEffect } from 'react'
import { adminApi, api } from '../utils/adminApi'
import { DollarSign, Save, CheckCircle, AlertCircle } from 'lucide-react'

const PricingManagement = () => {
  const [turfs, setTurfs] = useState([])
  const [selectedTurf, setSelectedTurf] = useState(null)
  const [form, setForm] = useState({ price_per_hour: '', weekend_price: '', peak_hour_price: '', peak_start: '', peak_end: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    api.get('/api/turfs').then(r => setTurfs(r.data.turfs)).catch(() => {})
  }, [])

  const handleSelectTurf = (turf) => {
    setSelectedTurf(turf)
    setForm({
      price_per_hour:   turf.price_per_hour || '',
      weekend_price:    turf.pricing_overrides?.weekend_price || '',
      peak_hour_price:  turf.pricing_overrides?.peak_hour_price || '',
      peak_start:       turf.pricing_overrides?.peak_hours?.start || '',
      peak_end:         turf.pricing_overrides?.peak_hours?.end || '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.put(`/turfs/${selectedTurf._id}/pricing`, {
        price_per_hour:   form.price_per_hour   ? Number(form.price_per_hour)  : undefined,
        weekend_price:    form.weekend_price     ? Number(form.weekend_price)   : undefined,
        peak_hour_price:  form.peak_hour_price   ? Number(form.peak_hour_price) : undefined,
        peak_start:       form.peak_start || undefined,
        peak_end:         form.peak_end   || undefined,
      })
      // Refresh turf list
      const { data } = await api.get('/api/turfs')
      setTurfs(data.turfs)
      const updated = data.turfs.find(t => t._id === selectedTurf._id)
      if (updated) setSelectedTurf(updated)
      showToast('Pricing updated successfully!')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update pricing', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '0.65rem 0.875rem', color: '#0f172a', fontSize: '0.875rem',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: 'all 0.15s',
  }

  const labelStyle = { color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start font-['Plus_Jakarta_Sans',sans-serif]">

      {/* Toast */}
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

      {/* ── Left: Turf Selector ── */}
      <div className="w-full lg:w-[280px] shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Select Turf</h3>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>{turfs.length} turfs available</p>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          {turfs.map(t => (
            <button key={t._id} onClick={() => handleSelectTurf(t)}
              style={{
                width: '100%', textAlign: 'left', padding: '1rem 1.25rem', border: 'none',
                background: selectedTurf?._id === t._id ? '#ebf9f3' : 'transparent',
                borderLeft: `3px solid ${selectedTurf?._id === t._id ? '#00844d' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderBottom: '1px solid #f8fafc',
              }}
              onMouseEnter={e => { if (selectedTurf?._id !== t._id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (selectedTurf?._id !== t._id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: selectedTurf?._id === t._id ? '#00844d' : '#0f172a' }}>{t.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem', fontWeight: 600 }}>{t.location?.city} · ₹{t.price_per_hour}/slot</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Pricing Form ── */}
      <div className="w-full flex-1">
        {!selectedTurf ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '4rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <DollarSign size={36} color="#e2e8f0" style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>Select a turf from the left to manage pricing</p>
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{selectedTurf.name}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{selectedTurf.location?.address}, {selectedTurf.location?.city}</p>
            </div>

            {/* Base Pricing */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00844d' }} />
                <span style={{ color: '#00844d', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Base Pricing</span>
              </div>
              <div>
                <label style={labelStyle}>Base Price per Hour (₹)</label>
                <input type="number" value={form.price_per_hour} onChange={e => setForm(p => ({ ...p, price_per_hour: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#00844d'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '0.4rem 0 0', fontWeight: 600 }}>Applied to all weekday normal slots</p>
              </div>
            </div>

            {/* Weekend Pricing */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                <span style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weekend Override</span>
              </div>
              <div>
                <label style={labelStyle}>Weekend Price per Hour (₹)</label>
                <input type="number" value={form.weekend_price} onChange={e => setForm(p => ({ ...p, weekend_price: e.target.value }))}
                  placeholder="Leave blank to use base price"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '0.4rem 0 0', fontWeight: 600 }}>Applied on Saturdays and Sundays</p>
              </div>
            </div>

            {/* Peak Hour Pricing */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
                <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Peak Hour Override</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label style={labelStyle}>Peak Price (₹)</label>
                  <input type="number" value={form.peak_hour_price} onChange={e => setForm(p => ({ ...p, peak_hour_price: e.target.value }))}
                    placeholder="e.g. 1800"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#d97706'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Peak Start Time</label>
                  <input type="time" value={form.peak_start} onChange={e => setForm(p => ({ ...p, peak_start: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#d97706'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Peak End Time</label>
                  <input type="time" value={form.peak_end} onChange={e => setForm(p => ({ ...p, peak_end: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#d97706'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '0.75rem 0 0', fontWeight: 600 }}>Overrides base price during specified hours on both weekdays and weekends</p>
            </div>

            {/* Current Pricing Summary */}
            <div style={{ background: '#ebf9f3', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid #bbf7d0' }}>
              <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>
                Current Saved Pricing
              </div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div><div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>Base</div><div style={{ color: '#00844d', fontWeight: 800, fontSize: '1rem' }}>₹{selectedTurf.price_per_hour}/slot</div></div>
                <div><div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>Weekend</div><div style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.875rem' }}>{selectedTurf.pricing_overrides?.weekend_price ? `₹${selectedTurf.pricing_overrides.weekend_price}/slot` : '—'}</div></div>
                <div><div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>Peak Hour</div><div style={{ color: '#d97706', fontWeight: 800, fontSize: '0.875rem' }}>{selectedTurf.pricing_overrides?.peak_hour_price ? `₹${selectedTurf.pricing_overrides.peak_hour_price}/slot` : '—'}</div></div>
                <div><div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>Peak Window</div><div style={{ color: '#475569', fontWeight: 700, fontSize: '0.875rem' }}>{selectedTurf.pricing_overrides?.peak_hours?.start ? `${selectedTurf.pricing_overrides.peak_hours.start} – ${selectedTurf.pricing_overrides.peak_hours.end}` : '—'}</div></div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#00844d,#006b3e)', border: 'none', borderRadius: '12px', padding: '0.8rem', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 20px rgba(22,163,74,0.2)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Pricing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PricingManagement
