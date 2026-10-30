import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import { getAdmin } from '@/lib/supabaseAdmin'
import { optionalAuth, requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const INSTANCE = process.env.INSTANCE_ID || os.hostname()
const MAX_LIMIT = 500

// GET /api/items
// GET /api/items?type=lost|found&status=open|claimed&limit=100
// Public. This is the endpoint that takes the load in a post-fest rush, so it is
// kept to one indexed query. `contact` is only returned to signed-in users.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10) || 100, 1), MAX_LIMIT)

  let query = getAdmin().from('items').select('*').order('created_at', { ascending: false }).limit(limit)
  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const [{ data, error }, claims] = await Promise.all([query, optionalAuth(req)])

  if (error) return NextResponse.json({ error: 'Could not read the ledger' }, { status: 500 })

  const items = claims ? data : (data ?? []).map((i) => ({ ...i, contact: null }))
  return NextResponse.json({ items }, { status: 200, headers: { 'X-Instance-Id': INSTANCE } })
}

// POST /api/items   (any signed-in user)
// body: { type, title, description, category, location, contact }
export async function POST(req: NextRequest) {
  const guard = await requireAuth(req)
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  const { type, title, description, category, location, contact } = body ?? {}

  if (!type || !title || !description || !category || !location || !contact) {
    return NextResponse.json(
      { error: 'type, title, description, category, location and contact are all required' },
      { status: 400 }
    )
  }
  if (type !== 'lost' && type !== 'found') {
    return NextResponse.json({ error: "type must be 'lost' or 'found'" }, { status: 400 })
  }
  const tooLong =
    String(title).length > 120 || String(description).length > 1000 || String(category).length > 60 ||
    String(location).length > 120 || String(contact).length > 120
  if (tooLong) return NextResponse.json({ error: 'One or more fields are too long' }, { status: 400 })

  const { data, error } = await getAdmin()
    .from('items')
    .insert([{ type, title, description, category, location, contact, created_by: guard.claims.sub }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Could not file the entry' }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}
