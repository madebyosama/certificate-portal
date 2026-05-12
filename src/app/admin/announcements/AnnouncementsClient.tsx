'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ATP { id: string; atp_name: string | null; full_name: string | null; email: string | null }
interface Ann { id: string; title: string; body: string; target: string; created_at: string }

export default function AnnouncementsClient({ announcements: initial, atps, adminId }: { announcements: Ann[]; atps: ATP[]; adminId: string }) {
  const supabase = createClient()
  const [announcements, setAnnouncements] = useState<Ann[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', target: 'all', target_atp_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.body) { setError('Title and message are required.'); return }
    if (form.target === 'specific' && !form.target_atp_id) { setError('Please select an ATP.'); return }
    setLoading(true); setError(''); setSuccess('')

    const { data, error } = await supabase.from('announcements').insert({
      title: form.title, body: form.body,
      target: form.target, target_atp_id: form.target === 'specific' ? form.target_atp_id : null,
      created_by: adminId,
    }).select().single()

    setLoading(false)
    if (error) { setError(error.message); return }
    setAnnouncements(p => [data, ...p])
    setForm({ title: '', body: '', target: 'all', target_atp_id: '' })
    setShowForm(false)
    setSuccess('Announcement sent successfully.')
  }

  return (
    <>
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">New Announcement</div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={send}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Title <span className="required">*</span></label>
                  <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. System maintenance notice" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message <span className="required">*</span></label>
                  <textarea className="form-textarea" rows={4} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your announcement here..." required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Target</label>
                    <select className="form-select" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value, target_atp_id: '' }))}>
                      <option value="all">All ATPs</option>
                      <option value="specific">Specific ATP</option>
                    </select>
                  </div>
                  {form.target === 'specific' && (
                    <div className="form-group">
                      <label className="form-label">Select ATP <span className="required">*</span></label>
                      <select className="form-select" value={form.target_atp_id} onChange={e => setForm(p => ({ ...p, target_atp_id: e.target.value }))}>
                        <option value="">— Select ATP —</option>
                        {atps.map(a => <option key={a.id} value={a.id}>{a.atp_name || a.full_name || a.email}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><span className="spinner" /> Sending...</> : 'Send Announcement'}</button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Sent Announcements ({announcements.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Announcement'}
          </button>
        </div>
        {announcements.length === 0 ? (
          <div className="empty-state">No announcements sent yet.</div>
        ) : (
          <div style={{ padding: '6px 0' }}>
            {announcements.map(a => (
              <div key={a.id} style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{a.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span className={`badge ${a.target === 'all' ? 'badge-approved' : 'badge-submitted'}`}>{a.target === 'all' ? 'All ATPs' : 'Specific'}</span>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'pre-wrap' }}>{a.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
