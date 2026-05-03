import { useState, useEffect } from 'react'
import { adminApi, api } from '../utils/adminApi'
import { Plus, Edit2, Trash2, Search, CheckCircle, XCircle, Layers } from 'lucide-react'
import TurfForm from './TurfForm'

const statusBadge = {
  active:           { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  label: 'Active'   },
  inactive:         { color: '#71717a', bg: 'rgba(113,113,122,0.1)', label: 'Inactive' },
  pending_approval: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Pending'  },
  suspended:        { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Suspended'},
}

const TurfManagement = () => {
  const [turfs, setTurfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTurf, setEditTurf] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchTurfs = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/turfs')
      setTurfs(data.turfs)
    } catch { showToast('Failed to load turfs', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTurfs() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminApi.delete(`/turfs/${deleteId}`)
      showToast('Turf marked inactive')
      setDeleteId(null)
      fetchTurfs()
    } catch { showToast('Failed to delete turf', 'error') }
    finally { setDeleting(false) }
  }

  const filtered = turfs.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          background: toast.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
          color: toast.type === 'error' ? '#f87171' : '#4ade80',
          borderRadius: '12px', padding: '0.875rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f4f4f5' }}>Turf Management</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#71717a' }}>{turfs.length} turfs on platform</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search turfs..."
              style={{
                background: '#18181b', border: '1px solid #27272a', borderRadius: '10px',
                padding: '0.55rem 0.875rem 0.55rem 2.25rem', color: '#f4f4f5',
                fontSize: '0.8rem', outline: 'none', width: '220px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}
            />
          </div>
          <button
            onClick={() => { setEditTurf(null); setShowForm(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #00844d, #006b3e)',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(22,163,74,0.25)',
            }}
          >
            <Plus size={15} /> Add Turf
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Loading turfs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <Layers size={32} style={{ marginBottom: '0.75rem', opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.875rem' }}>No turfs found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272a' }}>
                  {['Turf', 'Location', 'Surface', 'Sports', 'Price/slot', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '1rem 1rem', fontSize: '0.7rem', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const st = statusBadge[t.status] || statusBadge.inactive
                  return (
                    <tr key={t._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #27272a' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f4f4f5' }}>{t.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.15rem' }}>{t.turf_type || 'multi-purpose'}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#a1a1aa' }}>
                        {t.location?.city || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'capitalize' }}>
                        {t.surface?.replace('_', ' ') || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {(t.sports || []).slice(0, 3).map(s => (
                            <span key={s} style={{ background: '#18181b', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '5px', padding: '0.15rem 0.4rem', fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize' }}>
                              {s}
                            </span>
                          ))}
                          {t.sports?.length > 3 && <span style={{ color: '#52525b', fontSize: '0.65rem' }}>+{t.sports.length - 3}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', color: '#00844d', fontWeight: 700 }}>
                        ₹{t.price_per_hour?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.bg === '#f8fafc' ? '#e2e8f0' : 'transparent'}`, borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setEditTurf(t); setShowForm(true) }}
                            style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', color: '#2563eb', display: 'flex' }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(t._id)}
                            style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer', color: '#dc2626', display: 'flex' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f4f4f5', fontWeight: 800 }}>Delete Turf?</h3>
            <p style={{ color: '#71717a', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              This will mark the turf as inactive. Existing bookings will not be affected.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: '#dc2626', border: 'none', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turf Form Modal */}
      {showForm && (
        <TurfForm
          turf={editTurf}
          onClose={() => { setShowForm(false); setEditTurf(null) }}
          onSave={() => { setShowForm(false); setEditTurf(null); fetchTurfs(); showToast(editTurf ? 'Turf updated!' : 'Turf added!') }}
        />
      )}
    </div>
  )
}

export default TurfManagement
