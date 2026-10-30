import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabaseAdmin'
import { optionalAuth, requireAuth, STAFF_ROLES } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/items/:id   (public; contact hidden unless signed in)
export async function GET(req: NextRequest, { params }: Params) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid item id' }, { status: 400 })
  const [{ data, error }, claims] = await Promise.all([
    getAdmin().from('items').select('*').eq('id', params.id).single(),
    optionalAuth(req),
  ])
  if (error || !data) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  return NextResponse.json({ item: claims ? data : { ...data, contact: null } }, { status: 200 })
}

// PUT /api/items/:id   (security_staff or admin only)
// body: any subset of { title, description, category, location, contact, status }
export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await requireAuth(req, { roles: STAFF_ROLES })
  if (!guard.ok) return guard.res
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid item id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const allowedFields = ['title', 'description', 'category', 'location', 'contact', 'status']
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided to update' }, { status: 400 })
  }
  if (updates.status && updates.status !== 'open' && updates.status !== 'claimed') {
    return NextResponse.json({ error: "status must be 'open' or 'claimed'" }, { status: 400 })
  }

  const { data, error } = await getAdmin().from('items').update(updates).eq('id', params.id).select().single()
  if (error || !data) return NextResponse.json({ error: 'Item not found or could not be updated' }, { status: 404 })
  return NextResponse.json({ item: data }, { status: 200 })
}

// DELETE /api/items/:id   (security_staff or admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requireAuth(req, { roles: STAFF_ROLES })
  if (!guard.ok) return guard.res
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid item id' }, { status: 400 })

  const { error } = await getAdmin().from('items').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Could not delete the item' }, { status: 500 })
  return NextResponse.json({ message: 'Item deleted' }, { status: 200 })
}
