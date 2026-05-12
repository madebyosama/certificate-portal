export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Profile {
  id: string
  full_name: string | null
  atp_name: string | null
  atp_no: string | null
  atp_address: string | null
  email: string | null
  kyc_verified: boolean
  deposit_balance: number
  is_admin: boolean
  avatar_url: string | null
  created_at: string
}

export interface CourseType {
  id: string
  title: string
  price: number
  validity_days: number
  purchase_fee: number
  is_active: boolean
  created_at: string
}

export interface Trainer {
  id: string
  atp_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  qualification: string | null
  is_active: boolean
  created_at: string
}

export interface Course {
  id: string
  reference_number: string
  atp_id: string
  course_type_id: string | null
  trainer_id: string | null
  course_title: string
  start_date: string | null
  end_date: string | null
  status: 'draft' | 'submitted' | 'moderation' | 'approved' | 'rejected'
  total_candidates: number
  notes: string | null
  created_at: string
  trainer?: Trainer
  course_type?: CourseType
}

export interface Candidate {
  id: string
  course_id: string
  atp_id: string
  serial_no: string
  first_name: string
  last_name: string
  email: string | null
  date_of_birth: string | null
  country: string | null
  assessment_marks_1: number | null
  assessment_marks_2: number | null
  total_marks: number
  status: 'pending' | 'pass' | 'fail'
  certificate_no: string | null
  certificate_issued_at: string | null
  /** Whether the ATP has paid the per-student fee for this candidate. */
  paid: boolean
  /** Timestamp when the per-student fee was settled. */
  paid_at: string | null
  created_at: string
}

export interface CertificateOrder {
  id: string
  order_number: string
  atp_id: string
  candidate_id: string
  course_id: string | null
  certificate_no: string | null
  recipient_name: string
  address_line1: string
  address_line2: string | null
  city: string
  state_region: string | null
  postal_code: string
  country: string
  phone: string | null
  certificate_price: number
  delivery_price: number
  tax_amount: number
  total_amount: number
  payment_method: 'deposit' | 'stripe' | null
  status: 'pending' | 'paid' | 'printing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number: string | null
  notes: string | null
  created_at: string
  paid_at: string | null
}

export interface AppSetting {
  key: string
  value: number
  description: string | null
  updated_at: string
}

export interface Invoice {
  id: string
  atp_id: string
  course_id: string | null
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_method: 'deposit' | 'stripe' | null
  issued_at: string
  due_at: string | null
  paid_at: string | null
  course?: Course
}

export interface Deposit {
  id: string
  atp_id: string
  amount: number
  payment_method: 'bank_transfer' | 'stripe' | 'cheque' | null
  status: 'pending' | 'approved' | 'rejected'
  reference: string | null
  notes: string | null
  created_at: string
}

export interface Transaction {
  id: string
  atp_id: string
  type: 'credit' | 'debit'
  amount: number
  description: string | null
  reference: string | null
  balance_after: number | null
  created_at: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  author_id: string
  author_role: 'atp' | 'admin'
  body: string
  created_at: string
}

export interface SupportTicket {
  id: string
  atp_id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  admin_reply: string | null
  created_at: string
  updated_at: string
  profile?: Profile
  messages?: SupportMessage[]
}

export interface Announcement {
  id: string
  title: string
  body: string
  target: 'all' | 'specific'
  target_atp_id: string | null
  created_by: string | null
  created_at: string
}
