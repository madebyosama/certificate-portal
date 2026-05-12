'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Candidate } from '@/lib/types'

const COUNTRIES = [
  'United Kingdom','United States','United Arab Emirates','Saudi Arabia','Qatar',
  'Kuwait','Bahrain','Oman','Pakistan','India','Bangladesh','Egypt','Jordan',
  'Lebanon','Philippines','Nigeria','South Africa','Canada','Australia','Germany','France',
]

const emptyForm = {
  first_name: '', last_name: '', email: '', date_of_birth: '', country: '',
  assessment_marks_1: '', assessment_marks_2: '', total_marks: '100', status: 'pass',
}

type FormState = typeof emptyForm

interface Props {
  courseId: string
  userId: string
  initialCandidates: Candidate[]
  /** Whether the course has already been activated. */
  isCourseApproved: boolean
}

export default function AddCandidatesForm({
  courseId,
  userId,
  initialCandidates,
  isCourseApproved,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const unpaidCount = useMemo(
    () => candidates.filter((c) => !c.paid).length,
    [candidates]
  )

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.first_name || !form.last_name || !form.email) {
      setError('First name, last name, and email are required.')
      return
    }
    setAddLoading(true)
    const { data, error } = await supabase.from('candidates').insert({
      course_id: courseId,
      atp_id: userId,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      date_of_birth: form.date_of_birth || null,
      country: form.country || null,
      assessment_marks_1: form.assessment_marks_1 ? Number(form.assessment_marks_1) : null,
      assessment_marks_2: form.assessment_marks_2 ? Number(form.assessment_marks_2) : null,
      total_marks: Number(form.total_marks) || 100,
      status: form.status,
      serial_no: '',
      paid: false,
    }).select().single()
    setAddLoading(false)
    if (error) { setError(error.message); return }
    setCandidates((p) => [...p, data])
    setForm(emptyForm)
    setSuccess(`${data.first_name} ${data.last_name} added.`)
  }

  function startEdit(c: Candidate) {
    setError(''); setSuccess('')
    setEditingId(c.id)
    setEditForm({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email || '',
      date_of_birth: c.date_of_birth || '',
      country: c.country || '',
      assessment_marks_1: c.assessment_marks_1?.toString() || '',
      assessment_marks_2: c.assessment_marks_2?.toString() || '',
      total_marks: c.total_marks?.toString() || '100',
      status: c.status,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(emptyForm)
  }

  async function saveEdit(id: string) {
    setError(''); setSuccess('')
    if (!editForm.first_name || !editForm.last_name || !editForm.email) {
      setError('First name, last name, and email are required.')
      return
    }
    setBusyId(id)
    const { data, error } = await supabase.from('candidates').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      email: editForm.email,
      date_of_birth: editForm.date_of_birth || null,
      country: editForm.country || null,
      assessment_marks_1: editForm.assessment_marks_1 ? Number(editForm.assessment_marks_1) : null,
      assessment_marks_2: editForm.assessment_marks_2 ? Number(editForm.assessment_marks_2) : null,
      total_marks: Number(editForm.total_marks) || 100,
      status: editForm.status,
    }).eq('id', id).select().single()
    setBusyId(null)
    if (error) { setError(error.message); return }
    setCandidates((p) => p.map((c) => (c.id === id ? data : c)))
    setSuccess(`${data.first_name} ${data.last_name} updated.`)
    cancelEdit()
  }

  async function deleteCandidate(c: Candidate) {
    if (c.paid) {
      setError("Cannot delete a student that has already been paid for.")
      return
    }
    if (!confirm(`Remove ${c.first_name} ${c.last_name}?`)) return
    setError(''); setSuccess('')
    setBusyId(c.id)
    const { error } = await supabase.from('candidates').delete().eq('id', c.id).eq('paid', false)
    setBusyId(null)
    if (error) { setError(error.message); return }
    setCandidates((p) => p.filter((x) => x.id !== c.id))
    setSuccess(`${c.first_name} ${c.last_name} removed.`)
  }

  async function proceed() {
    if (unpaidCount === 0) {
      setError('No new (unpaid) students to bill for.')
      return
    }
    setSubmitLoading(true)
    if (!isCourseApproved) {
      // First-purchase flow may still be in 'draft' — mark as submitted before
      // sending the user to the payment screen.
      await supabase.from('courses').update({
        status: 'submitted',
        total_candidates: candidates.length,
      }).eq('id', courseId)
    } else {
      // Course is already approved, just keep total_candidates in sync.
      await supabase.from('courses').update({
        total_candidates: candidates.length,
      }).eq('id', courseId)
    }
    setSubmitLoading(false)
    router.push(`/courses/${courseId}/purchase`)
  }

  const renderFormFields = (state: FormState, setState: (s: FormState) => void) => (
    <div className="form-grid-3" style={{ marginBottom: 14 }}>
      <div className="form-group">
        <label className="form-label">First Name <span className="required">*</span></label>
        <input className="form-input" value={state.first_name} onChange={e => setState({ ...state, first_name: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Last Name <span className="required">*</span></label>
        <input className="form-input" value={state.last_name} onChange={e => setState({ ...state, last_name: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Email <span className="required">*</span></label>
        <input type="email" className="form-input" value={state.email} onChange={e => setState({ ...state, email: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Date of Birth</label>
        <input type="date" className="form-input" value={state.date_of_birth} onChange={e => setState({ ...state, date_of_birth: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Country</label>
        <select className="form-select" value={state.country} onChange={e => setState({ ...state, country: e.target.value })}>
          <option value="">— Select Country —</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-select" value={state.status} onChange={e => setState({ ...state, status: e.target.value })}>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Assessment 1</label>
        <input type="number" className="form-input" value={state.assessment_marks_1} onChange={e => setState({ ...state, assessment_marks_1: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Assessment 2</label>
        <input type="number" className="form-input" value={state.assessment_marks_2} onChange={e => setState({ ...state, assessment_marks_2: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">Total Marks</label>
        <input type="number" className="form-input" value={state.total_marks} onChange={e => setState({ ...state, total_marks: e.target.value })} />
      </div>
    </div>
  )

  const proceedLabel = isCourseApproved
    ? `Pay for ${unpaidCount} New Student${unpaidCount !== 1 ? 's' : ''} →`
    : `Continue to Payment → (${unpaidCount} student${unpaidCount !== 1 ? 's' : ''})`

  return (
    <>
      {/* Add new student */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header">Add Student</div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={addCandidate}>
            {renderFormFields(form, setForm)}
            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? <><span className="spinner" /> Adding...</> : '+ Add Student'}
            </button>
          </form>
        </div>
      </div>

      {/* Students list */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            Students Added ({candidates.length})
            {isCourseApproved && unpaidCount > 0 && (
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                · {unpaidCount} unpaid
              </span>
            )}
          </span>
          {unpaidCount > 0 && (
            <button className="btn btn-success btn-sm" onClick={proceed} disabled={submitLoading}>
              {submitLoading ? <><span className="spinner" /> ...</> : proceedLabel}
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Marks</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No students added yet. Add one above.</td></tr>
              ) : candidates.map((c, i) => {
                const isEditing = editingId === c.id
                if (isEditing) {
                  return (
                    <tr key={c.id}>
                      <td colSpan={8} style={{ padding: 14, background: '#f9fafb' }}>
                        <div style={{ fontWeight: 600, marginBottom: 10 }}>
                          Editing {c.first_name} {c.last_name}
                        </div>
                        {renderFormFields(editForm, setEditForm)}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => saveEdit(c.id)}
                            disabled={busyId === c.id}
                          >
                            {busyId === c.id ? <><span className="spinner" /> Saving...</> : 'Save'}
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={cancelEdit} disabled={busyId === c.id}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td>{c.first_name} {c.last_name}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.country || '—'}</td>
                    <td>{c.total_marks}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                    <td>
                      {c.paid ? (
                        <span className="badge badge-approved">paid</span>
                      ) : (
                        <span className="badge badge-pending">unpaid</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => startEdit(c)}
                          disabled={busyId === c.id}
                        >
                          Edit
                        </button>
                        {!c.paid && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                            onClick={() => deleteCandidate(c)}
                            disabled={busyId === c.id}
                          >
                            {busyId === c.id ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {unpaidCount > 0 && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb' }}>
            <button className="btn btn-success" onClick={proceed} disabled={submitLoading}>
              {submitLoading ? <><span className="spinner" /> ...</> : proceedLabel}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
