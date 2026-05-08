'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupportTicket, SupportMessage, Profile } from '@/lib/types'

const PRIORITY_COLORS: Record<string, string> = { low: '#9ca3af', normal: '#1976d2', high: '#f59e0b', urgent: '#e53935' }
const STATUS_COLORS: Record<string, string> = { open: '#e53935', in_progress: '#f59e0b', resolved: '#43a047', closed: '#9ca3af' }

type AdminTicket = SupportTicket & {
  profile?: Pick<Profile, 'atc_name' | 'full_name' | 'email'> | null
  messages: SupportMessage[]
}

export default function SupportClient({ adminId, tickets: initial }: { adminId: string; tickets: AdminTicket[] }) {
  const supabase = createClient()
  const [tickets, setTickets] = useState<AdminTicket[]>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [statusDraft, setStatusDraft] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('open')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selected = tickets.find(t => t.id === selectedId) ?? null

  function openTicket(t: AdminTicket) {
    setSelectedId(t.id)
    setReply('')
    setStatusDraft(t.status)
    setError('')
    setSuccess('')
  }

  async function postReply() {
    if (!selected) return
    const body = reply.trim()
    if (!body) {
      setError('Reply cannot be empty.')
      return
    }
    setReplyLoading(true)
    setError('')
    setSuccess('')

    const { data, error: insertError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selected.id,
        author_id: adminId,
        author_role: 'admin',
        body,
      })
      .select()
      .single()

    setReplyLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setTickets(prev => prev.map(t =>
      t.id === selected.id
        ? { ...t, messages: [...t.messages, data as SupportMessage] }
        : t
    ))
    setReply('')
    setSuccess('Reply sent.')
  }

  async function saveStatus() {
    if (!selected || statusDraft === selected.status) return
    setStatusLoading(true)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({ status: statusDraft, updated_at: new Date().toISOString() })
      .eq('id', selected.id)

    setStatusLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setTickets(prev => prev.map(t =>
      t.id === selected.id ? { ...t, status: statusDraft as AdminTicket['status'] } : t
    ))
    setSuccess(`Status updated to ${statusDraft.replace('_', ' ')}.`)
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
                style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selectedId === t.id ? '#f0f9ff' : '#fff', transition: 'background 150ms' }}
                onMouseEnter={e => { if (selectedId !== t.id) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={e => { if (selectedId !== t.id) e.currentTarget.style.background = '#fff' }}>
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
                    {t.messages.length > 0 && (
                      <span style={{ color: '#6b7280', fontWeight: 400 }}> · {t.messages.length} repl{t.messages.length === 1 ? 'y' : 'ies'}</span>
                    )}
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
            <span>Conversation</span>
            <button onClick={() => setSelectedId(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: 4 }}>{selected.subject}</div>
              <div style={{ fontSize: '0.775rem', color: '#6b7280', marginBottom: 8 }}>
                From: {selected.profile?.atc_name || selected.profile?.full_name || selected.profile?.email}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Priority: {selected.priority}</span>
                <span className="badge" style={{ background: '#e0f2fe', color: '#075985', textTransform: 'capitalize' }}>{selected.status.replace('_', ' ')}</span>
              </div>

              {/* Conversation thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Original ATP message */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ maxWidth: '85%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                      ATP · {new Date(selected.created_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                      {selected.message}
                    </div>
                  </div>
                </div>

                {/* Legacy admin_reply for tickets created before the conversation feature */}
                {selected.admin_reply && selected.messages.length === 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ maxWidth: '85%', background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1565c0', marginBottom: 4 }}>
                        You (legacy reply)
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#1565c0', whiteSpace: 'pre-wrap' }}>
                        {selected.admin_reply}
                      </div>
                    </div>
                  </div>
                )}

                {/* Thread messages */}
                {selected.messages.map(m => {
                  const isAdmin = m.author_role === 'admin'
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%',
                        background: isAdmin ? '#e3f2fd' : '#f9fafb',
                        border: `1px solid ${isAdmin ? '#bbdefb' : '#e5e7eb'}`,
                        borderRadius: 8, padding: 12,
                      }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isAdmin ? '#1565c0' : '#6b7280', marginBottom: 4 }}>
                          {isAdmin ? 'You' : 'ATP'} · {new Date(m.created_at).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: isAdmin ? '#1565c0' : '#374151', whiteSpace: 'pre-wrap' }}>
                          {m.body}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, marginTop: 14 }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Reply</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your response..."
                  disabled={replyLoading}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={postReply}
                    disabled={replyLoading || !reply.trim()}
                  >
                    {replyLoading ? <><span className="spinner" /> Sending...</> : 'Send Reply'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={statusDraft} onChange={e => setStatusDraft(e.target.value)}>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={saveStatus}
                  disabled={statusLoading || statusDraft === selected.status}
                >
                  {statusLoading ? '...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
