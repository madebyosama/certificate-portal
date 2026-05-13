'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Course } from '@/lib/types'

export default function CoursesTable({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [openAction, setOpenAction] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpenAction(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = courses.filter(
    (c) =>
      c.reference_number.toLowerCase().includes(search.toLowerCase()) ||
      c.course_title.toLowerCase().includes(search.toLowerCase())
  )
  const total = filtered.length
  const totalPages = Math.ceil(total / perPage) || 1
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '—')

  return (
    <>
      <div className='table-controls'>
        <div className='table-per-page'>
          Show
          <select
            className='per-page-select'
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </div>
        <div className='table-search'>
          Search:
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder='Course title or ref...'
          />
        </div>
      </div>

      <div ref={ref} style={{ overflowY: 'visible' }}>
        <table className='data-table' style={{ overflow: 'visible' }}>
          <thead>
            <tr>
              <th>Ref #</th>
              <th>Course Title</th>
              <th>Trainer</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className='empty-state'>
                  No courses found.
                </td>
              </tr>
            ) : (
              paginated.map((course) => (
                <tr key={course.id}>
                  <td>{course.reference_number}</td>
                  <td>
                    <span
                      className='ref-link'
                      onClick={() => router.push(`/courses/${course.id}`)}
                    >
                      {course.course_title || '—'}
                    </span>
                  </td>
                  <td>
                    {course.trainer
                      ? `${course.trainer.first_name} ${course.trainer.last_name}`
                      : '—'}
                  </td>
                  <td>{fmt(course.start_date)}</td>
                  <td>{fmt(course.end_date)}</td>
                  <td>
                    <span className={`badge badge-${course.status}`}>
                      {course.status}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{ position: 'relative', display: 'inline-block' }}
                    >
                      <button
                        className='btn btn-teal btn-sm'
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenAction(
                            openAction === course.id ? null : course.id
                          )
                        }}
                      >
                        Actions ▾
                      </button>
                      {openAction === course.id && (
                        <div
                          className='action-menu'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className='action-menu-item'
                            onClick={() => {
                              setOpenAction(null)
                              router.push(`/courses/${course.id}`)
                            }}
                          >
                            View Details
                          </div>
                          <div
                            className='action-menu-item'
                            onClick={() => {
                              setOpenAction(null)
                              router.push(`/courses/${course.id}/candidates`)
                            }}
                          >
                            {course.status === 'approved'
                              ? 'Add / Manage Students'
                              : 'Add Students'}
                          </div>
                          {course.status !== 'approved' ? (
                            <div
                              className='action-menu-item'
                              style={{ color: '#1976d2', fontWeight: 600 }}
                              onClick={() => {
                                setOpenAction(null)
                                router.push(`/courses/${course.id}/purchase`)
                              }}
                            >
                              Purchase Course
                            </div>
                          ) : (
                            <div
                              className='action-menu-item'
                              style={{ color: '#1976d2', fontWeight: 600 }}
                              onClick={() => {
                                setOpenAction(null)
                                router.push(`/courses/${course.id}/purchase`)
                              }}
                            >
                              Pay for New Students
                            </div>
                          )}
                        </div>
                      )}
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
          {total === 0
            ? 'No entries'
            : `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`}
        </span>
        <div className='pagination'>
          <button onClick={() => setPage(1)} disabled={page === 1}>
            «
          </button>
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
            (n) => (
              <button
                key={n}
                className={page === n ? 'active' : ''}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
          >
            »
          </button>
        </div>
      </div>
    </>
  )
}
