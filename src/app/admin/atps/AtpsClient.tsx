'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function AtpsClient({ atps: initial }: { atps: Profile[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [atps, setAtps] = useState<Profile[]>(initial)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Add-ATP form state
  const [newEmail, setNewEmail] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newAtpName, setNewAtpName] = useState('')
  const [newAtpNo, setNewAtpNo] = useState('')
  const [newAtpAddress, setNewAtpAddress] = useState('')
  const [addError, setAddError] = useState('')
  const [addInfo, setAddInfo] = useState('')
  const [adding, setAdding] = useState(false)

  async function update(id: string, fields: Partial<Profile>) {
    setLoading(id)
    await supabase.from('profiles').update(fields).eq('id', id)
    setAtps(p => p.map(a => a.id === id ? { ...a, ...fields } : a))
    setLoading(null)
  }

  function resetForm() {
    setNewEmail('')
    setNewFullName('')
    setNewAtpName('')
    setNewAtpNo('')
    setNewAtpAddress('')
    setAddError('')
    setAddInfo('')
  }

  function closeAdd() {
    setShowAdd(false)
    resetForm()
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddInfo('')
    setAdding(true)

    try {
      const res = await fetch('/api/admin/atps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          full_name: newFullName,
          atp_name: newAtpName,
          atp_no: newAtpNo,
          atp_address: newAtpAddress,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setAddError(json.error ?? 'Failed to invite ATP')
        setAdding(false)
        return
      }

      setAddInfo(`Invitation email sent to ${newEmail}.`)
      // Refresh the server-rendered list so the new ATP shows up
      router.refresh()
      // Optimistically prepend to local state so the row appears immediately
      setAtps(prev => [
        {
          id: json.user.id,
          email: json.user.email,
          full_name: json.user.full_name,
          atp_name: json.user.atp_name,
          atp_no: json.user.atp_no,
          atp_address: json.user.atp_address,
          kyc_verified: false,
          deposit_balance: 0,
          is_admin: false,
          avatar_url: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setAdding(false)
      // Auto-close after a moment so the admin sees the success message
      setTimeout(closeAdd, 1500)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Network error')
      setAdding(false)
    }
  }

  const filtered = atps.filter(a =>
    [a.atp_name, a.full_name, a.email, a.atp_no].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const unverified = filtered.filter(a => !a.kyc_verified).length

  return (
    <>
      {unverified > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          {unverified} ATP{unverified !== 1 ? 's' : ''} pending verification.
        </div>
      )}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>All ATPs ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="table-search" style={{ padding: 0 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, ATP no..."
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: '0.775rem', outline: 'none' }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add ATP</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ATP Name</th><th>ATP No</th><th>Email</th><th>Balance</th><th>Verified</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No ATPs found.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.atp_name || a.full_name || '—'}</td>
                  <td style={{ fontSize: '0.775rem', color: '#6b7280' }}>{a.atp_no || '—'}</td>
                  <td>{a.email || '—'}</td>
                  <td style={{ fontWeight: 600, color: '#1976d2' }}>${(a.deposit_balance ?? 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${a.kyc_verified ? 'badge-approved' : 'badge-pending'}`}>
                      {a.kyc_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!a.kyc_verified ? (
                        <button className="btn btn-success btn-sm" disabled={loading === a.id}
                          onClick={() => update(a.id, { kyc_verified: true })}>
                          {loading === a.id ? '...' : 'Verify'}
                        </button>
                      ) : (
                        <button className="btn btn-outline btn-sm" disabled={loading === a.id}
                          onClick={() => update(a.id, { kyc_verified: false })}>
                          {loading === a.id ? '...' : 'Unverify'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} of {atps.length} ATPs</span></div>
      </div>

      {showAdd && (
        <div
          onClick={closeAdd}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Add New ATP</span>
              <button
                type="button"
                onClick={closeAdd}
                aria-label="Close"
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1 }}
              >×</button>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.825rem', color: '#6b7280', marginTop: 0, marginBottom: 12 }}>
                The ATP will receive an email with a link to set their password and complete sign-in.
              </p>

              {addError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{addError}</div>}
              {addInfo && <div className="alert alert-info" style={{ marginBottom: 12 }}>{addInfo}</div>}

              <form onSubmit={handleAdd}>
                <div className="form-group">
                  <label className="form-label">Email <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="form-input"
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="atp@example.com"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="Contact person's name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ATP Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newAtpName}
                    onChange={e => setNewAtpName(e.target.value)}
                    placeholder="Training center name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ATP Number</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newAtpNo}
                    onChange={e => setNewAtpNo(e.target.value)}
                    placeholder="e.g. ATP-1234"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newAtpAddress}
                    onChange={e => setNewAtpAddress(e.target.value)}
                    placeholder="Street, city, country"
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" className="btn btn-outline" onClick={closeAdd} disabled={adding}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={adding}>
                    {adding ? 'Sending invite...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
