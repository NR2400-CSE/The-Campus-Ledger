import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side only. Uses the service-role key, which bypasses Row Level Security.
// The key must NEVER be prefixed NEXT_PUBLIC_ or it would ship to the browser.
// Created lazily so `next build` works without secrets present.
let client: SupabaseClient | null = null

export function getAdmin(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server')
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
