'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CourseType } from '@/lib/types'

const empty = {
  title: '',
  price: '7.00',
  validity_days: '1',
  purchase_fee: '0',
}

export default function CourseTypesClient({
  courseTypes: initial,
}: {
  courseTypes: CourseType[]
}) {
  const supabase = createClient()
  const [types, setTypes] = useState<CourseType[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function startEdit(ct: CourseType) {
    setEditId(ct.id)
    setForm({
      title: ct.title,
      price: ct.price.toString(),
      validity_days: ct.validity_days.toString(),
      purchase_fee: ct.purchase_fee.toString(),
    })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) {
      setError('Title is required.')
      return
    }
    setLoading(true)
    setError('')
    const payload = {
      title: form.title,
      price: parseFloat(form.price) || 7,
      validity_days: parseInt(form.validity_days) || 1,
      purchase_fee: parseFloat(form.purchase_fee) || 0,
    }

    if (editId) {
      await supabase.from('course_types').update(payload).eq('id', editId)
      setTypes((p) =>
        p.map((t) => (t.id === editId ? { ...t, ...payload } : t))
      )
    } else {
      const { data } = await supabase
        .from('course_types')
        .insert({ ...payload, is_active: true })
        .select()
        .single()
      if (data) setTypes((p) => [data, ...p])
    }
    setLoading(false)
    setShowForm(false)
    setEditId(null)
    setForm(empty)
  }

  async function toggleActive(ct: CourseType) {
    await supabase
      .from('course_types')
      .update({ is_active: !ct.is_active })
      .eq('id', ct.id)
    setTypes((p) =>
      p.map((t) => (t.id === ct.id ? { ...t, is_active: !t.is_active } : t))
    )
  }

  function cancel() {
    setShowForm(false)
    setEditId(null)
    setForm(empty)
    setError('')
  }

  return (
    <>
      {showForm && (
        <div className='card' style={{ marginBottom: 16 }}>
          <div className='card-header'>
            {editId ? 'Edit Course' : 'Add Course'}
          </div>
          <div className='card-body'>
            {error && <div className='alert alert-error'>{error}</div>}
            <form onSubmit={save}>
              <div className='form-grid-3' style={{ marginBottom: 14 }}>
                <div className='form-group full-width'>
                  <label className='form-label'>
                    Title <span className='required'>*</span>
                  </label>
                  <input
                    className='form-input'
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder='e.g. Award in First Aid'
                    required
                  />
                </div>
                <div className='form-group'>
                  <label className='form-label'>Price per Student ($)</label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    className='form-input'
                    value={form.price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: e.target.value }))
                    }
                  />
                </div>
                <div className='form-group'>
                  <label className='form-label'>Validity (days)</label>
                  <input
                    type='number'
                    min='1'
                    className='form-input'
                    value={form.validity_days}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, validity_days: e.target.value }))
                    }
                  />
                </div>
                <div className='form-group'>
                  <label className='form-label'>Purchase Fee ($)</label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    className='form-input'
                    value={form.purchase_fee}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, purchase_fee: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type='submit'
                  className='btn btn-primary'
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className='spinner' /> Saving...
                    </>
                  ) : editId ? (
                    'Update'
                  ) : (
                    'Add Course'
                  )}
                </button>
                <button
                  type='button'
                  className='btn btn-outline'
                  onClick={cancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className='card'>
        <div
          className='card-header'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Courses ({types.length})</span>
          <button
            className='btn btn-primary btn-sm'
            onClick={() => {
              setShowForm(!showForm)
              setEditId(null)
              setForm(empty)
            }}
          >
            {showForm && !editId ? '✕ Cancel' : '+ Add Course'}
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Title</th>
                <th>Price / Student</th>
                <th>Validity</th>
                <th>Purchase Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr>
                  <td colSpan={6} className='empty-state'>
                    No courses yet.
                  </td>
                </tr>
              ) : (
                types.map((ct) => (
                  <tr key={ct.id}>
                    <td style={{ fontWeight: 500 }}>{ct.title}</td>
                    <td>${ct.price.toFixed(2)}</td>
                    <td>
                      {ct.validity_days} day{ct.validity_days !== 1 ? 's' : ''}
                    </td>
                    <td>${ct.purchase_fee.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${ct.is_active ? 'badge-approved' : 'badge-rejected'}`}
                      >
                        {ct.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className='btn btn-outline btn-sm'
                          onClick={() => startEdit(ct)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm ${ct.is_active ? 'btn-outline' : 'btn-success'}`}
                          onClick={() => toggleActive(ct)}
                        >
                          {ct.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='table-footer'>
          <span>
            {types.filter((t) => t.is_active).length} active,{' '}
            {types.filter((t) => !t.is_active).length} inactive
          </span>
        </div>
      </div>
    </>
  )
}
