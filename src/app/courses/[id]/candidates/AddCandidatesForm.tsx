'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Candidate } from '@/lib/types'

const COUNTRIES = [
  'United Kingdom', 'United States', 'United Arab Emirates', 'Saudi Arabia',
  'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Pakistan', 'India', 'Bangladesh',
  'Egypt', 'Jordan', 'Lebanon', 'Philippines', 'Nigeria', 'South Africa',
  'Canada', 'Australia', 'Germany', 'France',
]

interface Props {
  courseId: string
  userId: string
  initialCandidates: Candidate[]
}

const emptyForm = {
  first_name: '', last_name: '', date_of_birth: '', country: '',
  email: '', assessment_marks_1: '', assessment_marks_2: '', total_marks: '100', status: 'pass',
}

export default function AddCandidatesForm({ courseId, userId, initialCandidates }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState(emptyForm)
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleAddCandidate(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!form.first_name || !form.last_name || !form.email) {
      setError('First name, last name, and email are required.')
      return
    }

    setAddLoading(true)
    const { data, error } = await supabase.from('candidates').insert({
      course_id: courseId,
      atc_id: userId,
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
    }).select().single()

    setAddLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setCandidates(prev => [...prev, data])
      setForm(emptyForm)
      setSuccess('Candidate added successfully.')
    }
  }

  async function handleSubmit() {
    if (candidates.length === 0) {
      setError('Please add at least one candidate before submitting.')
      return
    }

    setSubmitLoading(true)
    await supabase.from('courses').update({ status: 'submitted', total_candidates: candidates.length }).eq('id', courseId)
    setSubmitLoading(false)

    router.push(`/courses/${courseId}`)
  }

  function statusBadge(status: string) {
    return <span className={`badge badge-${status}`}>{status}</span>
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">Add Candidate</div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleAddCandidate}>
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">First Name <span className="required">*</span></label>
                <input className="form-input" value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span className="required">*</span></label>
                <input className="form-input" value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Date Of Birth <span className="required">*</span></label>
                <input type="date" className="form-input" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Country <span className="required">*</span></label>
                <select className="form-select" value={form.country} onChange={e => handleChange('country', e.target.value)}>
                  <option value="">--- Select Country ---</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input type="email" className="form-input" value={form.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Assessment Marks 1</label>
                <input type="number" className="form-input" value={form.assessment_marks_1} onChange={e => handleChange('assessment_marks_1', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Assessment Marks 2</label>
                <input type="number" className="form-input" value={form.assessment_marks_2} onChange={e => handleChange('assessment_marks_2', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Marks</label>
                <input type="number" className="form-input" value={form.total_marks} onChange={e => handleChange('total_marks', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                  <option value="">Status</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? <><span className="spinner" /> Adding...</> : 'Add Candidate'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Candidates Information</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Name</th>
                <th>Assessment Marks-1</th>
                <th>Assessment Marks-2</th>
                <th>Marks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No candidates added yet.</td></tr>
              ) : (
                candidates.map(c => (
                  <tr key={c.id}>
                    <td>{c.serial_no}</td>
                    <td>{c.first_name} {c.last_name}</td>
                    <td>{c.assessment_marks_1 ?? '—'}</td>
                    <td>{c.assessment_marks_2 ?? '—'}</td>
                    <td>{c.total_marks}</td>
                    <td>{statusBadge(c.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <button className="btn btn-success" onClick={handleSubmit} disabled={submitLoading}>
            {submitLoading ? <><span className="spinner" /> Submitting...</> : 'Submit'}
          </button>
        </div>
      </div>
    </>
  )
}
