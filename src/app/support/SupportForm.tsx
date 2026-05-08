'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_COLORS: Record<string, string> = { open: '#e53935', in_progress: '#f59e0b', resolved: '#43a047', closed: '#9ca3af' }

export default function SupportForm({ userId, tickets: initial }: { userId: string; tickets: any[] }) {
  const supabase = createClient()
  const [tickets, setTickets] = useState<any[]>(initial)
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject || !form.message) { setError('Subject and message are required.'); return }
    setLoading(true); setError(''); setSuccess('')
    const { data, error } = await supabase.from('support_tickets').insert({
      atc_id: userId, subject: form.subject, message: form.message,
      priority: form.priority, status: 'open',
      updated_at: new Date().toISOString(),
    }).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setTickets(p => [data, ...p])
    setForm({ subject: '', message: '', priority: 'normal' })
    setShowForm(false)
    setSuccess('Ticket submitted. We will get back to you shortly.')
  }

  return (
    <>
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">New Support Ticket</div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={submit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Subject <span className="required">*</span></label>
                    <input className="form-input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description of your issue" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Message <span className="required">*</span></label>
                  <textarea className="form-textarea" rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue in detail..." required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><span className="spinner" /> Submitting...</> : 'Submit Ticket'}</button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>My Tickets ({tickets.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Ticket'}
          </button>
        </div>
        {tickets.length === 0 ? (
          <div className="empty-state">No tickets yet. Submit one if you need help.</div>
        ) : (
          <div>
            {tickets.map(t => (
              <div key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  style={{ padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#111827' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: STATUS_COLORS[t.status], textTransform: 'capitalize' }}>
                      ● {t.status.replace('_', ' ')}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{expanded === t.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expanded === t.id && (
                  <div style={{ padding: '0 18px 16px' }}>
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, fontSize: '0.825rem', color: '#374151', marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                      {t.message}
                    </div>
                    {t.admin_reply && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1976d2', marginBottom: 6 }}>Admin Reply:</div>
                        <div style={{ background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 8, padding: 12, fontSize: '0.825rem', color: '#1565c0', whiteSpace: 'pre-wrap' }}>
                          {t.admin_reply}
                        </div>
                      </div>
                    )}
                    {!t.admin_reply && (
                      <div style={{ fontSize: '0.775rem', color: '#9ca3af', fontStyle: 'italic' }}>Awaiting admin response...</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
