export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Profile {
  id: string
  full_name: string | null
  atc_name: string | null
  atc_no: string | null
  atc_address: string | null
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
  atc_id: string
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
  atc_id: string
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
  atc_id: string
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
  created_at: string
}

export interface Invoice {
  id: string
  atc_id: string
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
  atc_id: string
  amount: number
  payment_method: 'bank_transfer' | 'stripe' | 'cheque' | null
  status: 'pending' | 'approved' | 'rejected'
  reference: string | null
  notes: string | null
  created_at: string
}

export interface Transaction {
  id: string
  atc_id: string
  type: 'credit' | 'debit'
  amount: number
  description: string | null
  reference: string | null
  balance_after: number | null
  created_at: string
}

export interface SupportTicket {
  id: string
  atc_id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  admin_reply: string | null
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Announcement {
  id: string
  title: string
  body: string
  target: 'all' | 'specific'
  target_atc_id: string | null
  created_by: string | null
  created_at: string
}
