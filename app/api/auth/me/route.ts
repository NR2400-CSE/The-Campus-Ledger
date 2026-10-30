import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/auth/me  -> who does this access token belong to
export async function GET(req: NextRequest) {
  const guard = await requireAuth(req)
  if (!guard.ok) return guard.res
  const { data } = await getAdmin().from('users').select('name, email, role').eq('id', guard.claims.sub).single()
  if (!data) return NextResponse.json({ error: 'Account not found' }, { status: 401 })
  return NextResponse.json({ user: data })
}
