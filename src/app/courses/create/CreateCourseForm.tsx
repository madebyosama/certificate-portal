'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CourseType, Trainer } from '@/lib/types'

interface Props {
  courseTypes: CourseType[]
  trainers: Trainer[]
  userId: string
}

export default function CreateCourseForm({ courseTypes, trainers, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ course_type_id: '', trainer_id: '', start_date: '', end_date: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = courseTypes.find(c => c.id === form.course_type_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.course_type_id || !form.trainer_id || !form.start_date) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('courses').insert({
      atc_id: userId,
      course_type_id: form.course_type_id,
      trainer_id: form.trainer_id,
      course_title: selected?.title ?? '',
      start_date: form.start_date,
      end_date: form.end_date || null,
      reference_number: '',
    }).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push(`/courses/${data.id}/candidates`)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      {selected && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <strong>{selected.title}</strong> — ${selected.price.toFixed(2)} per student · {selected.validity_days} day validity
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Course Type <span className="required">*</span></label>
          <select className="form-select" value={form.course_type_id} onChange={e => setForm(p => ({ ...p, course_type_id: e.target.value }))} required>
            <option value="">— Select Course —</option>
            {courseTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.title}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Trainer <span className="required">*</span></label>
          <select className="form-select" value={form.trainer_id} onChange={e => setForm(p => ({ ...p, trainer_id: e.target.value }))} required>
            <option value="">— Select Trainer —</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
          </select>
          {trainers.length === 0 && (
            <span style={{ fontSize: '0.75rem', color: '#e53935', marginTop: 4 }}>
              No trainers added yet. <a href="/trainers" style={{ color: '#1976d2' }}>Add a trainer first.</a>
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Start Date <span className="required">*</span></label>
          <input type="date" className="form-input" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
        </div>

        <div className="form-group">
          <label className="form-label">End Date</label>
          <input type="date" className="form-input" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving...</> : 'Next: Add Students →'}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  )
}
