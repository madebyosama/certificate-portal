import { cache } from 'react'
import { createClient } from './supabase/server'

// React cache() deduplicates calls within a single request — if multiple
// server components call the same function with the same args, the DB is
// only hit once. No cookies-in-cache-scope issue.

export const getCachedProfile = cache(async (userId: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
})

export const getCachedCourseTypes = cache(async () => {
  const supabase = createClient()
  const { data } = await supabase
    .from('course_types')
    .select('*')
    .eq('is_active', true)
    .order('title')
  return data ?? []
})

export const getCachedCourses = cache(async (userId: string) => {
  const supabase = createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, trainer:trainers(first_name, last_name)')
    .eq('atc_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
})

export const getCachedDashboardStats = cache(async (userId: string) => {
  const supabase = createClient()
  const [
    { count: courseCount },
    { count: resultCount },
    { count: invoiceCount },
    { count: otherInvoiceCount },
    { count: trainerCount },
    { count: docCount },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('atc_id', userId),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('atc_id', userId).eq('status', 'submitted'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('atc_id', userId),
    supabase.from('other_invoices').select('*', { count: 'exact', head: true }).eq('atc_id', userId),
    supabase.from('trainers').select('*', { count: 'exact', head: true }).eq('atc_id', userId),
    supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('atc_id', userId).eq('status', 'pending'),
  ])
  return {
    courseReferenceNumbers: courseCount ?? 0,
    uploadedResults: resultCount ?? 0,
    allInvoices: invoiceCount ?? 0,
    otherInvoices: otherInvoiceCount ?? 0,
    totalTrainers: trainerCount ?? 0,
    atcUploadDocuments: docCount ?? 0,
  }
})
