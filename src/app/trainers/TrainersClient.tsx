'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Trainer } from '@/lib/types'

const empty = { first_name: '', last_name: '', email: '', phone: '', qualification: '' }

export default function TrainersClient({ trainers: initial, userId }: { trainers: Trainer[]; userId: string }) {
  const supabase = createClient()
  const [trainers, setTrainers] = useState<Trainer[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function addTrainer(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.first_name || !form.last_name) { setError('First and last name required.'); return }
    setLoading(true)
    const { data, error } = await supabase.from('trainers').insert({ atc_id: userId, ...form }).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setTrainers(p => [data, ...p])
    setForm(empty)
    setShowForm(false)
  }

  async function toggleActive(t: Trainer) {
    await supabase.from('trainers').update({ is_active: !t.is_active }).eq('id', t.id)
    setTrainers(p => p.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x))
  }

  const filtered = trainers.filter(t =>
    `${t.first_name} ${t.last_name} ${t.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">Add Trainer</div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={addTrainer}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">First Name <span className="required">*</span></label>
                  <input className="form-input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name <span className="required">*</span></label>
                  <input className="form-input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Qualification</label>
                  <input className="form-input" value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? <><span className="spinner" /> Saving...</> : 'Save Trainer'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: showForm ? 0 : undefined }}>
          <span>Trainers ({filtered.length})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="table-search" style={{ padding: 0 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: '0.775rem', outline: 'none' }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '+ Add Trainer'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Qualification</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No trainers yet. Add one to get started.</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.first_name} {t.last_name}</td>
                  <td>{t.email ?? '—'}</td>
                  <td>{t.phone ?? '—'}</td>
                  <td>{t.qualification ?? '—'}</td>
                  <td><span className={`badge ${t.is_active ? 'badge-approved' : 'badge-rejected'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className={`btn btn-sm ${t.is_active ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleActive(t)}>
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>{filtered.length} of {trainers.length} trainers</span>
        </div>
      </div>
    </>
  )
}
