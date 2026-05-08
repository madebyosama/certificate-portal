'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function AtpsClient({ atps: initial }: { atps: Profile[] }) {
  const supabase = createClient()
  const [atps, setAtps] = useState<Profile[]>(initial)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function update(id: string, fields: Partial<Profile>) {
    setLoading(id)
    await supabase.from('profiles').update(fields).eq('id', id)
    setAtps(p => p.map(a => a.id === id ? { ...a, ...fields } : a))
    setLoading(null)
  }

  const filtered = atps.filter(a =>
    [a.atc_name, a.full_name, a.email, a.atc_no].join(' ').toLowerCase().includes(search.toLowerCase())
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
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>All ATPs ({filtered.length})</span>
          <div className="table-search" style={{ padding: 0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, ATC no..."
              style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: '0.775rem', outline: 'none' }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ATC Name</th><th>ATC No</th><th>Email</th><th>Balance</th><th>Verified</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No ATPs found.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.atc_name || a.full_name || '—'}</td>
                  <td style={{ fontSize: '0.775rem', color: '#6b7280' }}>{a.atc_no || '—'}</td>
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
    </>
  )
}
