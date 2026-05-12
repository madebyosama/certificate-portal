'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupportTicket, SupportMessage } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = { open: '#e53935', in_progress: '#f59e0b', resolved: '#43a047', closed: '#9ca3af' }

type TicketWithMessages = SupportTicket & { messages: SupportMessage[] }

export default function SupportForm({ userId, tickets: initial }: { userId: string; tickets: TicketWithMessages[] }) {
  const supabase = createClient()
  const [tickets, setTickets] = useState<TicketWithMessages[]>(initial)
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = useState<string | null>(null)
  const [replyError, setReplyError] = useState<Record<string, string>>({})

  function isLocked(status: string) {
    return status === 'resolved' || status === 'closed'
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject || !form.message) { setError('Subject and message are required.'); return }
    setLoading(true); setError(''); setSuccess('')
    const { data, error } = await supabase.from('support_tickets').insert({
      atp_id: userId, subject: form.subject, message: form.message,
      priority: form.priority, status: 'open',
      updated_at: new Date().toISOString(),
    }).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setTickets(p => [{ ...data, messages: [] }, ...p])
    setForm({ subject: '', message: '', priority: 'normal' })
    setShowForm(false)
    setSuccess('Ticket submitted. We will get back to you shortly.')
  }

  async function postReply(ticket: TicketWithMessages) {
    const body = (replyText[ticket.id] ?? '').trim()
    if (!body) {
      setReplyError(p => ({ ...p, [ticket.id]: 'Reply cannot be empty.' }))
      return
    }
    if (isLocked(ticket.status)) {
      setReplyError(p => ({ ...p, [ticket.id]: 'This ticket is closed and cannot accept new replies.' }))
      return
    }

    setReplyLoading(ticket.id)
    setReplyError(p => ({ ...p, [ticket.id]: '' }))

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        author_id: userId,
        author_role: 'atp',
        body,
      })
      .select()
      .single()

    setReplyLoading(null)

    if (error) {
      setReplyError(p => ({ ...p, [ticket.id]: error.message }))
      return
    }

    // Append the new message to local state
    setTickets(prev => prev.map(t =>
      t.id === ticket.id
        ? { ...t, messages: [...t.messages, data as SupportMessage] }
        : t
    ))
    setReplyText(p => ({ ...p, [ticket.id]: '' }))
  }

  async function reopenTicket(ticket: TicketWithMessages) {
    // Reopen flips status back to 'open' so the ATP can post follow-ups.
    // Only available while status is 'resolved' (closed is terminal).
    if (ticket.status !== 'resolved') return
    setReplyLoading(ticket.id)
    setReplyError(p => ({ ...p, [ticket.id]: '' }))

    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', ticket.id)

    setReplyLoading(null)

    if (error) {
      setReplyError(p => ({ ...p, [ticket.id]: error.message }))
      return
    }

    setTickets(prev => prev.map(t =>
      t.id === ticket.id ? { ...t, status: 'open' } : t
    ))
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
            {tickets.map(t => {
              const locked = isLocked(t.status)
              const showLegacyReply = t.admin_reply && t.messages.length === 0
              return (
                <div key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                    style={{ padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#111827' }}>{t.subject}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                        {new Date(t.created_at).toLocaleDateString()}
                        {t.messages.length > 0 && (
                          <span> · {t.messages.length} repl{t.messages.length === 1 ? 'y' : 'ies'}</span>
                        )}
                      </div>
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
                      {/* Original message from the ATP */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                        <div style={{ maxWidth: '85%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                            You · {new Date(t.created_at).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.825rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                            {t.message}
                          </div>
                        </div>
                      </div>

                      {/* Legacy admin_reply for tickets created before the conversation feature shipped */}
                      {showLegacyReply && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                          <div style={{ maxWidth: '85%', background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 8, padding: 12 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1565c0', marginBottom: 4 }}>
                              Admin
                            </div>
                            <div style={{ fontSize: '0.825rem', color: '#1565c0', whiteSpace: 'pre-wrap' }}>
                              {t.admin_reply}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Conversation thread */}
                      {t.messages.map(m => {
                        const isOwn = m.author_role === 'atp'
                        return (
                          <div key={m.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                            <div style={{
                              maxWidth: '85%',
                              background: isOwn ? '#f9fafb' : '#e3f2fd',
                              border: `1px solid ${isOwn ? '#e5e7eb' : '#bbdefb'}`,
                              borderRadius: 8, padding: 12,
                            }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isOwn ? '#6b7280' : '#1565c0', marginBottom: 4 }}>
                                {isOwn ? 'You' : 'Admin'} · {new Date(m.created_at).toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.825rem', color: isOwn ? '#374151' : '#1565c0', whiteSpace: 'pre-wrap' }}>
                                {m.body}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Empty state for awaiting first response */}
                      {t.messages.length === 0 && !t.admin_reply && (
                        <div style={{ fontSize: '0.775rem', color: '#9ca3af', fontStyle: 'italic', marginBottom: 10 }}>
                          Awaiting admin response...
                        </div>
                      )}

                      {/* Reply form / locked notice */}
                      {!locked ? (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                          {replyError[t.id] && (
                            <div className="alert alert-error" style={{ marginBottom: 8 }}>{replyError[t.id]}</div>
                          )}
                          <textarea
                            className="form-textarea"
                            rows={3}
                            placeholder="Add a reply..."
                            value={replyText[t.id] ?? ''}
                            onChange={e => setReplyText(p => ({ ...p, [t.id]: e.target.value }))}
                            disabled={replyLoading === t.id}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => postReply(t)}
                              disabled={replyLoading === t.id || !(replyText[t.id] ?? '').trim()}
                            >
                              {replyLoading === t.id ? 'Sending...' : 'Send Reply'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                          {replyError[t.id] && (
                            <div className="alert alert-error" style={{ marginBottom: 8 }}>{replyError[t.id]}</div>
                          )}
                          <div style={{
                            background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
                            padding: 12, fontSize: '0.825rem', color: '#6b7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                          }}>
                            <span>
                              {t.status === 'resolved'
                                ? 'This ticket has been marked resolved. If your issue isn\u2019t fully resolved, you can reopen it.'
                                : 'This ticket is closed and no longer accepts replies.'}
                            </span>
                            {t.status === 'resolved' && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => reopenTicket(t)}
                                disabled={replyLoading === t.id}
                              >
                                {replyLoading === t.id ? '...' : 'Reopen Ticket'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
