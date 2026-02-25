'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Course } from '@/lib/types'

interface Props {
  courses: Course[]
}

export default function CoursesTable({ courses }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [openAction, setOpenAction] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setOpenAction(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = courses.filter(
    (c) =>
      c.reference_number.includes(search) ||
      c.course_title.toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.length
  const totalPages = Math.ceil(total / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  function statusBadge(status: string) {
    return <span className={`badge badge-${status}`}>{status}</span>
  }

  return (
    <>
      <div className='table-controls'>
        <div className='table-per-page'>
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
          <span>entries per page</span>
        </div>
        <div className='table-search'>
          <span>Search:</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder='Search...'
          />
        </div>
      </div>

      <div
        ref={tableRef}
        style={{ overflowX: 'visible', overflowY: 'visible' }}
      >
        <table className='data-table' style={{ position: 'relative' }}>
          <thead>
            <tr>
              <th>Course Reference Number ↕</th>
              <th>Course Title ↕</th>
              <th>Start Date ↕</th>
              <th>End Date ↕</th>
              <th>Trainers ↕</th>
              <th>Status ↕</th>
              <th>Action ↕</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className='empty-state'>
                  No data available in table
                </td>
              </tr>
            ) : (
              paginated.map((course) => (
                <tr key={course.id}>
                  <td>
                    <span
                      className='ref-link'
                      onClick={() => router.push(`/courses/${course.id}`)}
                    >
                      {course.reference_number}
                    </span>
                  </td>
                  <td>{course.course_title}</td>
                  <td>
                    {course.start_date
                      ? new Date(course.start_date).toLocaleString()
                      : '—'}
                  </td>
                  <td>
                    {course.end_date
                      ? new Date(course.end_date).toLocaleString()
                      : '—'}
                  </td>
                  <td>
                    {course.trainer ? (
                      <div>
                        <strong>Trainer</strong>
                        <br />
                        Name: {course.trainer.first_name}{' '}
                        {course.trainer.last_name}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{statusBadge(course.status)}</td>
                  <td>
                    <div
                      style={{ position: 'relative', display: 'inline-block' }}
                    >
                      <button
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 12px',
                          background: 'var(--teal-500)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenAction(
                            openAction === course.id ? null : course.id
                          )
                        }}
                      >
                        Actions ▼
                      </button>
                      {openAction === course.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            right: 0,
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            minWidth: 160,
                            zIndex: 9999,
                            overflow: 'hidden',
                          }}
                        >
                          {[
                            {
                              label: 'View Details',
                              href: `/courses/${course.id}`,
                            },
                            {
                              label: 'Add Candidates',
                              href: `/courses/${course.id}/candidates`,
                            },
                            {
                              label: 'Purchase',
                              href: `/courses/${course.id}/purchase`,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              onClick={() => {
                                setOpenAction(null)
                                router.push(item.href)
                              }}
                              style={{
                                padding: '10px 14px',
                                fontSize: '0.8125rem',
                                color: '#374151',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = '#f9fafb')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  'transparent')
                              }
                            >
                              {item.label}
                            </div>
                          ))}
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
          Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to{' '}
          {Math.min(page * perPage, total)} of {total} entries
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
