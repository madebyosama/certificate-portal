import { cache } from 'react'
import { createClient } from './supabase/server'

export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
})

export const getCachedCourseTypes = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.from('course_types').select('*').eq('is_active', true).order('title')
  return data ?? []
})

export const getCachedCourses = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*, trainer:trainers(first_name, last_name)')
    .eq('atc_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
})

export const getCachedDashboardStats = cache(async (userId: string) => {
  const supabase = await createClient()
  const [
    { count: courseCount },
    { count: submittedCount },
    { count: invoiceCount },
    { count: trainerCount },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('atc_id', userId),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('atc_id', userId).eq('status', 'submitted'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('atc_id', userId),
    supabase.from('trainers').select('*', { count: 'exact', head: true }).eq('atc_id', userId),
  ])
  return {
    courseReferenceNumbers: courseCount ?? 0,
    uploadedResults: submittedCount ?? 0,
    allInvoices: invoiceCount ?? 0,
    totalTrainers: trainerCount ?? 0,
  }
})
