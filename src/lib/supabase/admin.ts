import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client with service-role privileges.
 * NEVER import this from client components or pages rendered to the browser.
 * Only use inside route handlers or server actions that have already verified
 * the caller is an authenticated admin.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local to use admin features.'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
