import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'

export default async function CertificateOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: orders } = await supabase
    .from('certificate_orders')
    .select(
      '*, candidate:candidates(first_name,last_name), course:courses(course_title,reference_number)'
    )
    .eq('atc_id', user.id)
    .order('created_at', { ascending: false })

  const displayName =
    profile?.atc_name || profile?.full_name || user.email || 'User'

  const totalSpent = (orders ?? []).reduce(
    (s: number, o: any) => s + Number(o.total_amount || 0),
    0
  )

  return (
    <AppLayout userName={displayName}>
      <div className='page-header'>
        <h1 className='page-title'>Certificate Hard-Copy Orders</h1>
        <div style={{ fontSize: '0.825rem', color: '#6b7280' }}>
          Total spent:{' '}
          <strong style={{ color: '#1976d2' }}>${totalSpent.toFixed(2)}</strong>
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>Your Orders ({orders?.length ?? 0})</div>
        <div style={{ overflowX: 'auto' }}>
          <table className='data-table'>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Student</th>
                <th>Course</th>
                <th>Certificate #</th>
                <th>Ship To</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className='empty-state'>
                    No hard-copy orders yet. You can order a hard copy from any
                    course's students table.
                  </td>
                </tr>
              ) : (
                orders.map((o: any) => (
                  <tr key={o.id}>
                    <td
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: '#6b7280',
                      }}
                    >
                      {o.order_number}
                    </td>
                    <td>
                      {o.candidate
                        ? `${o.candidate.first_name} ${o.candidate.last_name}`
                        : '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {o.course?.course_title ?? '—'}
                      </div>
                      {o.course?.reference_number && (
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                          Ref {o.course.reference_number}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#1976d2',
                      }}
                    >
                      {o.certificate_no || '—'}
                    </td>
                    <td style={{ fontSize: '0.775rem' }}>
                      <div>{o.recipient_name}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.7rem' }}>
                        {[o.city, o.country].filter(Boolean).join(', ')}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ${Number(o.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge badge-${o.status}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='table-footer'>
          <span>
            {orders?.length ?? 0} order{orders?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </AppLayout>
  )
}
