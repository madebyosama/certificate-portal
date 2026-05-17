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

export default function CreateCourseForm({
  courseTypes,
  trainers,
  userId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    course_type_id: '',
    trainer_id: '',
    start_date: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = courseTypes.find((c) => c.id === form.course_type_id)

  /**
   * End date is no longer entered by the ATP. It is derived from the
   * course's start date plus the duration (in days) configured
   * by the admin on the course type.
   */
  function computeEndDate(
    startDate: string,
    durationDays: number | undefined
  ): string | null {
    if (!startDate || !durationDays || durationDays < 1) return null
    const d = new Date(startDate)
    if (isNaN(d.getTime())) return null
    d.setDate(d.getDate() + durationDays)
    // Return as YYYY-MM-DD (date-only column)
    return d.toISOString().slice(0, 10)
  }

  const computedEndDate = computeEndDate(
    form.start_date,
    selected?.duration_days
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.course_type_id || !form.trainer_id || !form.start_date) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('courses')
      .insert({
        atp_id: userId,
        course_type_id: form.course_type_id,
        trainer_id: form.trainer_id,
        course_title: selected?.title ?? '',
        start_date: form.start_date,
        // Derived from start date + admin-configured duration.
        end_date: computedEndDate,
        reference_number: '',
      })
      .select()
      .single()
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    // Purchase-course step removed: a course has no separate purchase fee.
    // Go straight to adding students — payment is per-student only and a
    // course must have at least one student before it can be paid for.
    router.push(`/courses/${data.id}/candidates`)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className='alert alert-error'>{error}</div>}

      {selected && (
        <div className='alert alert-info' style={{ marginBottom: 16 }}>
          <strong>{selected.title}</strong> — ${selected.price.toFixed(2)} per
          student · {selected.duration_days} day duration
        </div>
      )}

      <div className='alert alert-info' style={{ marginBottom: 16 }}>
        After saving these details you&apos;ll add students. A course must have
        at least one student before its registration can be completed and paid
        for — payment is charged per student.
      </div>

      <div className='form-grid' style={{ marginBottom: 16 }}>
        <div className='form-group'>
          <label className='form-label'>
            Course <span className='required'>*</span>
          </label>
          <select
            className='form-select'
            value={form.course_type_id}
            onChange={(e) =>
              setForm((p) => ({ ...p, course_type_id: e.target.value }))
            }
            required
          >
            <option value=''>— Select Course —</option>
            {courseTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.title}
              </option>
            ))}
          </select>
        </div>

        <div className='form-group'>
          <label className='form-label'>
            Trainer <span className='required'>*</span>
          </label>
          <select
            className='form-select'
            value={form.trainer_id}
            onChange={(e) =>
              setForm((p) => ({ ...p, trainer_id: e.target.value }))
            }
            required
          >
            <option value=''>— Select Trainer —</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name}
              </option>
            ))}
          </select>
          {trainers.length === 0 && (
            <span
              style={{ fontSize: '0.75rem', color: '#e53935', marginTop: 4 }}
            >
              No trainers added yet.{' '}
              <a href='/trainers' style={{ color: '#1976d2' }}>
                Add a trainer first.
              </a>
            </span>
          )}
        </div>

        <div className='form-group'>
          <label className='form-label'>
            Start Date <span className='required'>*</span>
          </label>
          <input
            type='date'
            className='form-input'
            value={form.start_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, start_date: e.target.value }))
            }
            required
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>End Date</label>
          <input
            type='text'
            className='form-input'
            value={
              computedEndDate
                ? new Date(computedEndDate).toLocaleDateString()
                : '—'
            }
            readOnly
            disabled
            style={{ background: '#f3f4f6', color: '#6b7280' }}
          />
          <span
            style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}
          >
            {selected
              ? `Auto-set from start date + ${selected.duration_days} day${
                  selected.duration_days !== 1 ? 's' : ''
                } course duration.`
              : 'Select a course and start date — the end date is set automatically.'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type='submit' className='btn btn-primary' disabled={loading}>
          {loading ? (
            <>
              <span className='spinner' /> Saving...
            </>
          ) : (
            'Next: Add Students →'
          )}
        </button>
        <button
          type='button'
          className='btn btn-outline'
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
