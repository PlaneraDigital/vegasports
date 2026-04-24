import { useState, useEffect } from 'react'
import { adminApi } from '../utils/adminApi'
import { X, ChevronRight } from 'lucide-react'

const SPORTS_OPTIONS = ['football', 'cricket', 'badminton', 'tennis', 'basketball']
const SURFACE_OPTIONS = ['artificial_grass', 'natural_grass', 'concrete', 'clay']
const TYPE_OPTIONS = ['multi-purpose', 'football-only', 'cricket-only', 'badminton-only']
const DURATION_OPTIONS = [30, 60, 90, 120]
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const AMENITY_KEYS = ['floodlights', 'parking', 'washroom', 'changing_room', 'drinking_water', 'professional_surface', 'safe_premises', 'equipment_rental', 'cafeteria']
const IMAGE_LABELS = ['main', 'exterior', 'night-view', 'aerial', 'changing-room']

const labelOf = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const defaultForm = () => ({
  name: '', slug: '', turf_type: 'multi-purpose', surface: 'artificial_grass',
  slot_duration_minutes: 60, price_per_hour: '', sports: [],
  location: { address: '', city: '', state: '', pincode: '' },
  amenities: Object.fromEntries(AMENITY_KEYS.map(k => [k, false])),
  operating_hours: Object.fromEntries(DAYS.map(d => [d, { open: '', close: '', is_closed: false }])),
  pricing_overrides: { weekend_price: '', peak_hour_price: '', peak_hours: { start: '', end: '' } },
  rules: [],
  highlights: [],
  images: [],
})

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>{label}</label>
    <input
      {...props}
      style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px',
        padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none',
        width: '100%', boxSizing: 'border-box', transition: 'all 0.15s',
        ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.05)' }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
    />
  </div>
)

const SectionTitle = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.25rem 0 0.75rem' }}>
    <ChevronRight size={14} color="#16a34a" />
    <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </span>
  </div>
)

const TurfForm = ({ turf, onClose, onSave }) => {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newRule, setNewRule] = useState('')
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
        amenities: { ...Object.fromEntries(AMENITY_KEYS.map(k => [k, false])), ...(turf.amenities || {}) },
        operating_hours: turf.operating_hours || Object.fromEntries(DAYS.map(d => [d, { open: '', close: '', is_closed: false }])),
        pricing_overrides: {
          weekend_price: turf.pricing_overrides?.weekend_price || '',
          peak_hour_price: turf.pricing_overrides?.peak_hour_price || '',
          peak_hours: { start: turf.pricing_overrides?.peak_hours?.start || '', end: turf.pricing_overrides?.peak_hours?.end || '' },
        },
        rules: turf.rules || [],
        highlights: turf.highlights || [],
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
      <div className="bg-white border border-slate-200 rounded-[24px] w-full max-w-[680px] p-5 sm:p-8 font-['Plus_Jakarta_Sans',sans-serif] shadow-2xl">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            {turf ? 'Edit Turf' : 'Add New Turf'}
          </h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.625rem 0.875rem', color: '#991b1b', fontSize: '0.8rem', marginBottom: '1rem' }}>
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
              <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>Turf Type</label>
              <select value={form.turf_type} onChange={e => set('turf_type', e.target.value)}
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}>
                {TYPE_OPTIONS.map(o => <option key={o} value={o}>{labelOf(o)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>Surface *</label>
              <select value={form.surface} onChange={e => set('surface', e.target.value)}
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}>
                {SURFACE_OPTIONS.map(o => <option key={o} value={o}>{labelOf(o)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>Slot Duration (mins) *</label>
              <select value={form.slot_duration_minutes} onChange={e => set('slot_duration_minutes', Number(e.target.value))}
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}>
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
                  background: form.sports.includes(s) ? '#f0fdf4' : '#ffffff',
                  borderColor: form.sports.includes(s) ? '#16a34a' : '#e2e8f0',
                  color: form.sports.includes(s) ? '#16a34a' : '#64748b',
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
                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>{day}</span>
                  <input type="time" value={h.open} disabled={h.is_closed}
                    onChange={e => set(`operating_hours.${day}.open`, e.target.value)}
                    placeholder="--:--"
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.6rem', color: h.is_closed ? '#94a3b8' : '#0f172a', fontSize: '0.8rem', outline: 'none' }} />
                  <input type="time" value={h.close} disabled={h.is_closed}
                    onChange={e => set(`operating_hours.${day}.close`, e.target.value)}
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.6rem', color: h.is_closed ? '#94a3b8' : '#0f172a', fontSize: '0.8rem', outline: 'none' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!h.is_closed}
                      onChange={e => set(`operating_hours.${day}.is_closed`, e.target.checked)}
                      placeholder="--:--"
                      style={{ accentColor: '#ef4444', width: '14px', height: '14px' }} />
                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Closed</span>
                  </label>
                </div>
              )
            })}
          </div>

          {/* ── Amenities ── */}
          <SectionTitle>Amenities</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {AMENITY_KEYS.map(k => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0.75rem', background: form.amenities[k] ? '#f0fdf4' : '#ffffff', borderRadius: '9px', border: `1px solid ${form.amenities[k] ? '#16a34a' : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                <input type="checkbox" checked={!!form.amenities[k]} onChange={e => set(`amenities.${k}`, e.target.checked)} style={{ accentColor: '#16a34a', width: '14px', height: '14px' }} />
                <span style={{ color: form.amenities[k] ? '#16a34a' : '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>{labelOf(k)}</span>
              </label>
            ))}
          </div>

          {/* ── Rules ── */}
          <SectionTitle>Rules</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Add a rule..."
              style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.55rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
            <button type="button" onClick={() => { if (newRule.trim()) { setForm(p => ({ ...p, rules: [...p.rules, newRule.trim()] })); setNewRule('') } }}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0 0.875rem', color: '#16a34a', fontWeight: 800, cursor: 'pointer', fontSize: '1.2rem' }}>
              +
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {form.rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
                <span style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>• {r}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, rules: p.rules.filter((_, j) => j !== i) }))}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem' }}>×</button>
              </div>
            ))}
          </div>

          {/* ── Highlights ── */}
          <SectionTitle>Highlights</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Highlight Heading</label>
              <input value={newHighlight.title} onChange={e => setNewHighlight(p => ({ ...p, title: e.target.value }))} placeholder="e.g. FIFA Quality Pro"
                style={{ width: '100%', boxSizing: 'border-box', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Short Description</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input value={newHighlight.description} onChange={e => setNewHighlight(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Certified international standard synthetic grass"
                  style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} />
                <button type="button" onClick={() => { if (newHighlight.title.trim() && newHighlight.description.trim()) { setForm(p => ({ ...p, highlights: [...p.highlights, { title: newHighlight.title.trim(), description: newHighlight.description.trim() }] })); setNewHighlight({ title: '', description: '' }) } }}
                  style={{ background: '#16a34a', border: 'none', borderRadius: '10px', padding: '0 1rem', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                  Add
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {form.highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem', shadow: 'sm' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: 800 }}>★ {h.title}</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>{h.description}</span>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, highlights: p.highlights.filter((_, j) => j !== i) }))}
                  style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', itemsCenter: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>×</button>
              </div>
            ))}
          </div>

          {/* ── Images ── */}
          <SectionTitle>Images</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Upload Image</label>
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
                  style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }} 
                />
                {newImage.url && (
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #16a34a' }}>
                    <img src={newImage.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Label</label>
                <select value={newImage.label} onChange={e => setNewImage(p => ({ ...p, label: e.target.value }))}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.875rem', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}>
                  {IMAGE_LABELS.map(l => <option key={l} value={l}>{labelOf(l)}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingBottom: '0.75rem' }}>
                <input type="checkbox" checked={newImage.is_primary} onChange={e => setNewImage(p => ({ ...p, is_primary: e.target.checked }))} style={{ accentColor: '#16a34a', width: '14px', height: '14px' }} />
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>Primary</span>
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
              style={{ background: '#16a34a', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', color: '#fff', fontWeight: 800, cursor: 'pointer', height: '42px' }}>
                Add
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {form.images.map((img, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: `2px solid ${img.is_primary ? '#16a34a' : '#e2e8f0'}`, background: '#fff' }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} 
                  onError={e => { e.target.src = 'https://placehold.co/100x80?text=Invalid+URL' }} />
                <div style={{ padding: '0.4rem', borderTop: '1px solid #f1f5f9' }}>
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
                        background: img.is_primary ? '#16a34a' : '#f8fafc',
                        color: img.is_primary ? '#fff' : '#64748b',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        cursor: 'pointer'
                      }}>
                      {img.is_primary ? 'Primary' : 'Set Pri'}
                    </button>
                    <button type="button" onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '6px', width: '20px', height: '20px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                  <div style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>
                    {img.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, padding: '0.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', color: '#fff', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}>
              {saving ? 'Saving...' : turf ? 'Save Changes' : 'Add Turf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TurfForm
