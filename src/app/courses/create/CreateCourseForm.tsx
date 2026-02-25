'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CourseType, Trainer, Profile } from '@/lib/types'

interface Props {
  courseTypes: CourseType[]
  trainers: Trainer[]
  profile: Profile | null
  userId: string
}

export default function CreateCourseForm({ courseTypes, trainers, profile, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    course_type_id: '',
    trainer_id: '',
    start_date: '',
    end_date: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedCourse = courseTypes.find(c => c.id === formData.course_type_id)

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.course_type_id || !formData.trainer_id || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.from('courses').insert({
      atc_id: userId,
      course_type_id: formData.course_type_id,
      trainer_id: formData.trainer_id,
      course_title: selectedCourse?.title ?? '',
      start_date: formData.start_date,
      end_date: formData.end_date,
      reference_number: '',
    }).select().single()

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push(`/courses/${data.id}/candidates`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid-3" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">
            Select Course <span className="required">*</span>
          </label>
          <select
            className="form-select"
            value={formData.course_type_id}
            onChange={e => handleChange('course_type_id', e.target.value)}
            required
          >
            <option value="">--- Select Course ---</option>
            {courseTypes.map(ct => (
              <option key={ct.id} value={ct.id}>{ct.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Select Trainer <span className="required">*</span>
          </label>
          <select
            className="form-select"
            value={formData.trainer_id}
            onChange={e => handleChange('trainer_id', e.target.value)}
            required
          >
            <option value="">--- Select Trainer ---</option>
            {trainers.map(t => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Course Start Date <span className="required">*</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={formData.start_date}
            onChange={e => handleChange('start_date', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">ATC Name</label>
          <input
            type="text"
            className="form-input"
            value={profile?.atc_name ?? ''}
            disabled
            placeholder="ATC Name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">ATC No</label>
          <input
            type="text"
            className="form-input"
            value={profile?.atc_no ?? ''}
            disabled
          />
        </div>

        <div className="form-group">
          <label className="form-label">Course End Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.end_date}
            onChange={e => handleChange('end_date', e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">ATC Address</label>
          <textarea
            className="form-textarea"
            value={profile?.atc_address ?? ''}
            disabled
            rows={3}
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <><span className="spinner" /> Saving...</> : 'Next >'}
      </button>
    </form>
  )
}
