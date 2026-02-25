'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Trainer } from '@/lib/types'

const emptyForm = { first_name: '', last_name: '', email: '', phone: '', qualification: '' }

export default function TrainersClient({ trainers: initial, userId }: { trainers: Trainer[], userId: string }) {
  const supabase = createClient()
  const [trainers, setTrainers] = useState<Trainer[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.from('trainers').insert({
      atc_id: userId,
      ...form,
    }).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setTrainers(prev => [data, ...prev])
    setForm(emptyForm)
    setShowForm(false)
  }

  async function handleToggleActive(trainer: Trainer) {
    await supabase.from('trainers').update({ is_active: !trainer.is_active }).eq('id', trainer.id)
    setTrainers(prev => prev.map(t => t.id === trainer.id ? { ...t, is_active: !t.is_active } : t))
  }

  const filtered = trainers.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (t.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">Manage Trainers</div>
        <div className="table-controls">
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Trainer'}
          </button>
          <div className="table-search">
            <span>Search:</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
          </div>
        </div>

        {showForm && (
          <div style={{ padding: '0 18px 18px' }}>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAdd}>
              <div className="form-grid" style={{ marginBottom: 12 }}>
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
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? <><span className="spinner" /> Saving...</> : 'Save Trainer'}
              </button>
            </form>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Qualification</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No trainers found.</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td>{t.first_name} {t.last_name}</td>
                    <td>{t.email ?? '—'}</td>
                    <td>{t.phone ?? '—'}</td>
                    <td>{t.qualification ?? '—'}</td>
                    <td><span className={`badge ${t.is_active ? 'badge-pass' : 'badge-fail'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button
                        className={`btn btn-xs ${t.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleActive(t)}
                      >
                        {t.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {filtered.length} of {trainers.length} entries</span>
        </div>
      </div>
    </>
  )
}
