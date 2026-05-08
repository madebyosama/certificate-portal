'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PRIORITY_COLORS: Record<string, string> = { low: '#9ca3af', normal: '#1976d2', high: '#f59e0b', urgent: '#e53935' }
const STATUS_COLORS: Record<string, string> = { open: '#e53935', in_progress: '#f59e0b', resolved: '#43a047', closed: '#9ca3af' }

export default function SupportClient({ tickets: initial }: { tickets: any[] }) {
  const supabase = createClient()
  const [tickets, setTickets] = useState<any[]>(initial)
  const [selected, setSelected] = useState<any | null>(null)
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('open')
  const [success, setSuccess] = useState('')

  function openTicket(t: any) {
    setSelected(t)
    setReply(t.admin_reply || '')
    setStatus(t.status)
    setSuccess('')
  }

  async function saveReply() {
    if (!selected) return
    setLoading(true)
    await supabase.from('support_tickets').update({ admin_reply: reply, status, updated_at: new Date().toISOString() }).eq('id', selected.id)
    setTickets(p => p.map(t => t.id === selected.id ? { ...t, admin_reply: reply, status } : t))
    setSelected((s: any) => s ? { ...s, admin_reply: reply, status } : s)
    setLoading(false)
    setSuccess('Reply saved.')
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const openCount = tickets.filter(t => t.status === 'open').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: 16 }}>
      {/* Ticket List */}
      <div>
        {openCount > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            {openCount} open ticket{openCount !== 1 ? 's' : ''} need a response.
          </div>
        )}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Tickets ({filtered.length})</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer', textTransform: 'capitalize',
                    background: filter === f ? '#111827' : '#fff', color: filter === f ? '#fff' : '#374151' }}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            {filtered.length === 0 ? (
              <div className="empty-state">No {filter !== 'all' ? filter : ''} tickets.</div>
            ) : filtered.map(t => (
              <div key={t.id} onClick={() => openTicket(t)}
                style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selected?.id === t.id ? '#f0f9ff' : '#fff', transition: 'background 150ms' }}
                onMouseEnter={e => { if (selected?.id !== t.id) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={e => { if (selected?.id !== t.id) e.currentTarget.style.background = '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#111827' }}>{t.subject}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: PRIORITY_COLORS[t.priority], textTransform: 'uppercase' }}>{t.priority}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>
                  {t.profile?.atc_name || t.profile?.full_name || t.profile?.email || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: STATUS_COLORS[t.status], fontWeight: 600, textTransform: 'capitalize' }}>
                    ● {t.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Detail */}
      {selected && (
        <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 80 }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Reply</span>
            <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: 4 }}>{selected.subject}</div>
              <div style={{ fontSize: '0.775rem', color: '#6b7280', marginBottom: 2 }}>
                From: {selected.profile?.atc_name || selected.profile?.full_name || selected.profile?.email}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Priority: {selected.priority}</span>
              </div>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, fontSize: '0.825rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                {selected.message}
              </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Your Reply</label>
              <textarea className="form-textarea" rows={5} value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your response here..." />
            </div>

            <button className="btn btn-primary" onClick={saveReply} disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : 'Save Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
