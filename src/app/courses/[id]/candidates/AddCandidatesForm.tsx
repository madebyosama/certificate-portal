'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Candidate } from '@/lib/types'

const COUNTRIES = [
  'United Kingdom','United States','United Arab Emirates','Saudi Arabia','Qatar',
  'Kuwait','Bahrain','Oman','Pakistan','India','Bangladesh','Egypt','Jordan',
  'Lebanon','Philippines','Nigeria','South Africa','Canada','Australia','Germany','France',
]

const empty = {
  first_name: '', last_name: '', email: '', date_of_birth: '', country: '',
  assessment_marks_1: '', assessment_marks_2: '', total_marks: '100', status: 'pass',
}

interface Props { courseId: string; userId: string; initialCandidates: Candidate[] }

export default function AddCandidatesForm({ courseId, userId, initialCandidates }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState(empty)
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.first_name || !form.last_name || !form.email) {
      setError('First name, last name, and email are required.')
      return
    }
    setAddLoading(true)
    const { data, error } = await supabase.from('candidates').insert({
      course_id: courseId, atc_id: userId,
      first_name: form.first_name, last_name: form.last_name, email: form.email,
      date_of_birth: form.date_of_birth || null, country: form.country || null,
      assessment_marks_1: form.assessment_marks_1 ? Number(form.assessment_marks_1) : null,
      assessment_marks_2: form.assessment_marks_2 ? Number(form.assessment_marks_2) : null,
      total_marks: Number(form.total_marks) || 100,
      status: form.status, serial_no: '',
    }).select().single()
    setAddLoading(false)
    if (error) { setError(error.message); return }
    setCandidates(p => [...p, data])
    setForm(empty)
    setSuccess(`${data.first_name} ${data.last_name} added.`)
  }

  async function proceed() {
    if (candidates.length === 0) { setError('Add at least one student before proceeding.'); return }
    setSubmitLoading(true)
    await supabase.from('courses').update({ status: 'submitted', total_candidates: candidates.length }).eq('id', courseId)
    setSubmitLoading(false)
    router.push(`/courses/${courseId}/purchase`)
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header">Add Student</div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={addCandidate}>
            <div className="form-grid-3" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">First Name <span className="required">*</span></label>
                <input className="form-input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span className="required">*</span></label>
                <input className="form-input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select className="form-select" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}>
                  <option value="">— Select Country —</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assessment 1</label>
                <input type="number" className="form-input" value={form.assessment_marks_1} onChange={e => setForm(p => ({ ...p, assessment_marks_1: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Assessment 2</label>
                <input type="number" className="form-input" value={form.assessment_marks_2} onChange={e => setForm(p => ({ ...p, assessment_marks_2: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input type="number" className="form-input" value={form.total_marks} onChange={e => setForm(p => ({ ...p, total_marks: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? <><span className="spinner" /> Adding...</> : '+ Add Student'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Students Added ({candidates.length})</span>
          {candidates.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={proceed} disabled={submitLoading}>
              {submitLoading ? <><span className="spinner" /> ...</> : 'Continue to Payment →'}
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Email</th><th>Country</th><th>Marks</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No students added yet. Add one above.</td></tr>
              ) : candidates.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td>{c.first_name} {c.last_name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.country || '—'}</td>
                  <td>{c.total_marks}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {candidates.length > 0 && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb' }}>
            <button className="btn btn-success" onClick={proceed} disabled={submitLoading}>
              {submitLoading ? <><span className="spinner" /> ...</> : `Continue to Payment → (${candidates.length} student${candidates.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
