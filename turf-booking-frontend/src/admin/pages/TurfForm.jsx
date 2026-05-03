import { useState, useEffect } from 'react'
import { adminApi } from '../utils/adminApi'
import { X, ChevronRight } from 'lucide-react'

const SPORTS_OPTIONS = ['football', 'cricket', 'badminton', 'tennis', 'basketball']
const SURFACE_OPTIONS = ['artificial_grass', 'natural_grass', 'concrete', 'clay']
const TYPE_OPTIONS = ['multi-purpose', 'football-only', 'cricket-only', 'badminton-only']
const DURATION_OPTIONS = [30, 60, 90, 120]
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const IMAGE_LABELS = ['main', 'exterior', 'night-view', 'aerial', 'changing-room']

const labelOf = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const defaultForm = () => ({
  name: '', slug: '', turf_type: 'multi-purpose', surface: 'artificial_grass',
  slot_duration_minutes: 60, price_per_hour: '', sports: [],
  location: { address: '', city: '', state: '', pincode: '' },
  amenities: [],
  operating_hours: Object.fromEntries(DAYS.map(d => [d, { open: '', close: '', is_closed: false }])),
  pricing_overrides: { weekend_price: '', peak_hour_price: '', peak_hours: { start: '', end: '' } },
  rules: [],
  highlights: [],
  offers: [],
  images: [],
})

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>{label}</label>
    <input
      {...props}
      style={{
        background: '#18181b', border: '1px solid #27272a', borderRadius: '10px',
        padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none',
        width: '100%', boxSizing: 'border-box', transition: 'all 0.15s',
        ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = '#4ade80'; e.target.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.05)' }}
      onBlur={e => { e.target.style.borderColor = '#27272a'; e.target.style.boxShadow = 'none' }}
    />
  </div>
)

const SectionTitle = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.25rem 0 0.75rem' }}>
    <ChevronRight size={14} color="#4ade80" />
    <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </span>
  </div>
)

const TurfForm = ({ turf, onClose, onSave }) => {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newRule, setNewRule] = useState('')
  const [newAmenity, setNewAmenity] = useState('')
  const [newOffer, setNewOffer] = useState('')
  const [newHighlight, setNewHighlight] = useState({ title: '', description: '' })
  const [newImage, setNewImage] = useState({ url: '', label: 'main', is_primary: false })

  useEffect(() => {
    if (turf) {
      setForm({
        name: turf.name || '',
        slug: turf.slug || '',
        turf_type: turf.turf_type || 'multi-purpose',
        surface: turf.surface || 'artificial_grass',
        slot_duration_minutes: turf.slot_duration_minutes || 60,
        price_per_hour: turf.price_per_hour || '',
        sports: turf.sports || [],
        location: { address: turf.location?.address || '', city: turf.location?.city || '', state: turf.location?.state || '', pincode: turf.location?.pincode || '' },
        amenities: turf.amenities || [],
        operating_hours: turf.operating_hours || Object.fromEntries(DAYS.map(d => [d, { open: '', close: '', is_closed: false }])),
        pricing_overrides: {
          weekend_price: turf.pricing_overrides?.weekend_price || '',
          peak_hour_price: turf.pricing_overrides?.peak_hour_price || '',
          peak_hours: { start: turf.pricing_overrides?.peak_hours?.start || '', end: turf.pricing_overrides?.peak_hours?.end || '' },
        },
        rules: turf.rules || [],
        highlights: turf.highlights || [],
        offers: turf.offers || [],
        images: turf.images || [],
      })
    }
  }, [turf])

  const set = (path, value) => {
    setForm(prev => {
      const clone = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = clone
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return clone
    })
  }

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const toggleSport = (s) => setForm(p => ({ ...p, sports: p.sports.includes(s) ? p.sports.filter(x => x !== s) : [...p.sports, s] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.slug || !form.surface || !form.slot_duration_minutes || !form.price_per_hour) {
      setError('Name, slug, surface, slot duration and price per hour are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price_per_hour: Number(form.price_per_hour),
        pricing_overrides: {
          weekend_price: form.pricing_overrides.weekend_price ? Number(form.pricing_overrides.weekend_price) : null,
          peak_hour_price: form.pricing_overrides.peak_hour_price ? Number(form.pricing_overrides.peak_hour_price) : null,
          peak_hours: form.pricing_overrides.peak_hours,
        },
      }
      if (turf) {
        await adminApi.put(`/turfs/${turf._id}`, payload)
      } else {
        await adminApi.post('/turfs', payload)
      }
      onSave()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save turf.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="bg-zinc-900 border border-zinc-700 rounded-[24px] w-full max-w-[680px] p-5 sm:p-8 font-['Plus_Jakarta_Sans',sans-serif] shadow-2xl">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f4f4f5' }}>
            {turf ? 'Edit Turf' : 'Add New Turf'}
          </h2>
          <button onClick={onClose} style={{ background: '#18181b', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#71717a', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#1a1111', border: '1px solid #442222', borderRadius: '10px', padding: '0.625rem 0.875rem', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── Basic Info ── */}
          <SectionTitle>Basic Info</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Turf Name *" value={form.name} onChange={e => { set('name', e.target.value); set('slug', autoSlug(e.target.value)) }} placeholder="e.g. Champions Arena" />
            <Input label="Slug *" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>Turf Type</label>
              <select value={form.turf_type} onChange={e => set('turf_type', e.target.value)}
                style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }}>
                {TYPE_OPTIONS.map(o => <option key={o} value={o}>{labelOf(o)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>Surface *</label>
              <select value={form.surface} onChange={e => set('surface', e.target.value)}
                style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }}>
                {SURFACE_OPTIONS.map(o => <option key={o} value={o}>{labelOf(o)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>Slot Duration (mins) *</label>
              <select value={form.slot_duration_minutes} onChange={e => set('slot_duration_minutes', Number(e.target.value))}
                style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }}>
                {DURATION_OPTIONS.map(o => <option key={o} value={o}>{o} mins</option>)}
              </select>
            </div>
            <Input label="Base Price (per slot) (₹) *" type="number" value={form.price_per_hour} onChange={e => set('price_per_hour', e.target.value)} placeholder="e.g. 1200" />
          </div>

          {/* ── Sports ── */}
          <SectionTitle>Sports</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {SPORTS_OPTIONS.map(s => (
              <button key={s} type="button" onClick={() => toggleSport(s)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: '8px', border: '1px solid',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                  background: form.sports.includes(s) ? 'rgba(74, 222, 128, 0.1)' : '#18181b',
                  borderColor: form.sports.includes(s) ? '#4ade80' : '#27272a',
                  color: form.sports.includes(s) ? '#4ade80' : '#71717a',
                  transition: 'all 0.15s',
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* ── Location ── */}
          <SectionTitle>Location</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Address" value={form.location.address} onChange={e => set('location.address', e.target.value)} placeholder="Street address" />
            </div>
            <Input label="City" value={form.location.city} onChange={e => set('location.city', e.target.value)} placeholder="Mumbai" />
            <Input label="State" value={form.location.state} onChange={e => set('location.state', e.target.value)} placeholder="Maharashtra" />
            <Input label="Pincode" value={form.location.pincode} onChange={e => set('location.pincode', e.target.value)} placeholder="400001" />
          </div>

          {/* ── Pricing ── */}
          <SectionTitle>Pricing Overrides</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input label="Weekend Price (₹)" type="number" value={form.pricing_overrides.weekend_price} onChange={e => set('pricing_overrides.weekend_price', e.target.value)} placeholder="e.g. 1500" />
            <Input label="Peak Price (per slot) (₹)" type="number" value={form.pricing_overrides.peak_hour_price} onChange={e => set('pricing_overrides.peak_hour_price', e.target.value)} placeholder="e.g. 1800" />
            <Input label="Peak Start" type="time" value={form.pricing_overrides.peak_hours.start} onChange={e => set('pricing_overrides.peak_hours.start', e.target.value)} />
            <Input label="Peak End" type="time" value={form.pricing_overrides.peak_hours.end} onChange={e => set('pricing_overrides.peak_hours.end', e.target.value)} />
          </div>

          {/* ── Operating Hours ── */}
          <SectionTitle>Operating Hours</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {DAYS.map(day => {
              // Ensure we merge existing day data with defaults
              const h = {
                open: '',
                close: '',
                is_closed: false,
                ...(form.operating_hours?.[day] || {})
              }
              return (
                <div key={day} className="flex flex-wrap sm:grid sm:grid-cols-[100px_1fr_1fr_auto] gap-2 items-center">
                  <span style={{ color: '#71717a', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>{day}</span>
                  <input type="time" value={h.open} disabled={h.is_closed}
                    onChange={e => set(`operating_hours.${day}.open`, e.target.value)}
                    placeholder="--:--"
                    style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.45rem 0.6rem', color: h.is_closed ? '#52525b' : '#f4f4f5', fontSize: '0.8rem', outline: 'none' }} />
                  <input type="time" value={h.close} disabled={h.is_closed}
                    onChange={e => set(`operating_hours.${day}.close`, e.target.value)}
                    style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.45rem 0.6rem', color: h.is_closed ? '#52525b' : '#f4f4f5', fontSize: '0.8rem', outline: 'none' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!h.is_closed}
                      onChange={e => set(`operating_hours.${day}.is_closed`, e.target.checked)}
                      placeholder="--:--"
                      style={{ accentColor: '#ef4444', width: '14px', height: '14px' }} />
                    <span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Closed</span>
                  </label>
                </div>
              )
            })}
          </div>

          {/* ── Amenities ── */}
          <SectionTitle>Amenities</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input value={newAmenity} onChange={e => setNewAmenity(e.target.value)} placeholder="Add an amenity (e.g. Floodlights)..."
              style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.55rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} />
            <button type="button" onClick={() => { if (newAmenity.trim()) { setForm(p => ({ ...p, amenities: [...p.amenities, newAmenity.trim()] })); setNewAmenity('') } }}
              style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 0.875rem', color: '#4ade80', fontWeight: 800, cursor: 'pointer', fontSize: '1.2rem' }}>
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {form.amenities.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
                <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>{a}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, amenities: p.amenities.filter((_, j) => j !== i) }))}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>

          {/* ── Offers ── */}
          <SectionTitle>Offers</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input value={newOffer} onChange={e => setNewOffer(e.target.value)} placeholder="Add an offer heading (e.g. 20% Off weekday moring)..."
              style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.55rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} />
            <button type="button" onClick={() => { if (newOffer.trim()) { setForm(p => ({ ...p, offers: [...p.offers, newOffer.trim()] })); setNewOffer('') } }}
              style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 0.875rem', color: '#4ade80', fontWeight: 800, cursor: 'pointer', fontSize: '1.2rem' }}>
              +
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {form.offers.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
                <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 800 }}>🎫 {o}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, offers: p.offers.filter((_, j) => j !== i) }))}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem' }}>×</button>
              </div>
            ))}
          </div>

          {/* ── Rules ── */}
          <SectionTitle>Rules</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Add a rule..."
              style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.55rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} />
            <button type="button" onClick={() => { if (newRule.trim()) { setForm(p => ({ ...p, rules: [...p.rules, newRule.trim()] })); setNewRule('') } }}
              style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0 0.875rem', color: '#4ade80', fontWeight: 800, cursor: 'pointer', fontSize: '1.2rem' }}>
              +
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {form.rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
                <span style={{ color: '#a1a1aa', fontSize: '0.8rem', fontWeight: 600 }}>• {r}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, rules: p.rules.filter((_, j) => j !== i) }))}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem' }}>×</button>
              </div>
            ))}
          </div>

          {/* ── Highlights ── */}
          <SectionTitle>Highlights</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '1rem', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Highlight Heading</label>
              <input value={newHighlight.title} onChange={e => setNewHighlight(p => ({ ...p, title: e.target.value }))} placeholder="e.g. FIFA Quality Pro"
                style={{ width: '100%', boxSizing: 'border-box', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Short Description</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={newHighlight.description} onChange={e => setNewHighlight(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Certified international standard synthetic grass"
                  style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} />
                <button type="button" onClick={() => { if (newHighlight.title.trim() && newHighlight.description.trim()) { setForm(p => ({ ...p, highlights: [...p.highlights, { title: newHighlight.title.trim(), description: newHighlight.description.trim() }] })); setNewHighlight({ title: '', description: '' }) } }}
                  style={{ background: '#4ade80', border: 'none', borderRadius: '10px', padding: '0 1rem', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                  Add
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {form.highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '0.75rem 1rem', shadow: 'sm' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#f4f4f5', fontSize: '0.85rem', fontWeight: 800 }}>★ {h.title}</span>
                  <span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 500 }}>{h.description}</span>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, highlights: p.highlights.filter((_, j) => j !== i) }))}
                  style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', color: '#f87171', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>×</button>
              </div>
            ))}
          </div>

          {/* ── Images ── */}
          <SectionTitle>Images</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '1rem', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Upload Image</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    try {
                      setSaving(true);
                      const res = await adminApi.post('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      
                      const uploadedUrl = res.data.url;
                      
                      // Auto-add to the gallery so the user doesn't have to click "Add"
                      setForm(prev => {
                        const isFirst = (prev.images || []).length === 0;
                        return {
                          ...prev,
                          images: [...(prev.images || []), { 
                            url: uploadedUrl, 
                            label: newImage.label || 'main', 
                            is_primary: isFirst 
                          }]
                        };
                      });
                      
                      setNewImage(p => ({ ...p, url: '' })); // Reset staging state
                    } catch (err) {
                      setError('Image upload failed.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.5rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }} 
                />
                {newImage.url && (
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #4ade80' }}>
                    <img src={newImage.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Label</label>
                <select value={newImage.label} onChange={e => setNewImage(p => ({ ...p, label: e.target.value }))}
                  style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#f4f4f5', fontSize: '0.85rem', outline: 'none' }}>
                  {IMAGE_LABELS.map(l => <option key={l} value={l}>{labelOf(l)}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingBottom: '0.75rem' }}>
                <input type="checkbox" checked={newImage.is_primary} onChange={e => setNewImage(p => ({ ...p, is_primary: e.target.checked }))} style={{ accentColor: '#4ade80', width: '14px', height: '14px' }} />
                <span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 700 }}>Primary</span>
              </label>
              <button type="button" onClick={() => {
                if (newImage.url.trim()) {
                  let updatedImages = [...form.images];
                  if (newImage.is_primary) {
                    updatedImages = updatedImages.map(img => ({ ...img, is_primary: false }));
                  }
                  setForm(p => ({ ...p, images: [...updatedImages, { ...newImage, url: newImage.url.trim() }] }));
                  setNewImage({ url: '', label: 'main', is_primary: false });
                }
              }}
              style={{ background: '#4ade80', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', color: '#fff', fontWeight: 800, cursor: 'pointer', height: '42px' }}>
                Add
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {form.images.map((img, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: `2px solid ${img.is_primary ? '#4ade80' : '#27272a'}`, background: '#18181b' }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                  onError={e => { e.target.src = 'https://placehold.co/100x80?text=Invalid+URL' }} />
                <div style={{ padding: '0.4rem', borderTop: '1px solid #27272a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = form.images.map((img, j) => ({
                          ...img,
                          is_primary: i === j
                        }));
                        setForm(p => ({ ...p, images: updated }));
                      }}
                      style={{ 
                        flex: 1,
                        fontSize: '9px', 
                        fontWeight: 800, 
                        textTransform: 'uppercase', 
                        background: img.is_primary ? '#4ade80' : '#18181b',
                        color: img.is_primary ? '#fff' : '#71717a',
                        border: '1px solid #27272a',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        cursor: 'pointer'
                      }}>
                      {img.is_primary ? 'Primary' : 'Set Pri'}
                    </button>
                    <button type="button" onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                      style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', color: '#f87171', borderRadius: '6px', width: '20px', height: '20px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                  <div style={{ fontSize: '8px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', marginTop: '2px' }}>
                    {img.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #4ade80, #00844d)', border: 'none', color: '#fff', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 12px rgba(74,222,128,0.2)' }}>
              {saving ? 'Saving...' : turf ? 'Save Changes' : 'Add Turf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TurfForm
