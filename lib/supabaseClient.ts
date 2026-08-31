import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at build/runtime instead of silently returning empty data
  console.warn(
    'Supabase env vars are missing. Copy .env.example to .env.local and fill in your project credentials.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ItemStatus = 'open' | 'claimed'
export type ItemType = 'lost' | 'found'

export interface LostFoundItem {
  id: string
  type: ItemType
  title: string
  description: string
  category: string
  location: string
  contact: string
  status: ItemStatus
  created_at: string
}
